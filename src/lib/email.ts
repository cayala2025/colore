import "server-only";
import { render } from "@react-email/components";
import type { ReactElement } from "react";
import { Resend } from "resend";

export type EmailMessage = { to: string; subject: string; react: ReactElement };
export type SendResult = { id: string | null };
export type EmailSender = (msg: EmailMessage) => Promise<SendResult>;

let resend: Resend | null = null;

/** Send through Resend. Throws on failure. */
export const resendSender: EmailSender = async ({ to, subject, react }) => {
  resend ??= new Resend(process.env.RESEND_API_KEY);
  const [html, text] = await Promise.all([render(react), render(react, { plainText: true })]);
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "Colore <onboarding@resend.dev>",
    to,
    subject,
    html,
    text,
  });
  if (error) throw new Error(`resend: ${error.name}: ${error.message}`);
  return { id: data?.id ?? null };
};

/** Dev fallback: print the email instead of sending it. */
export const consoleSender: EmailSender = async ({ to, subject, react }) => {
  const text = await render(react, { plainText: true });
  console.info(`\n[email:console] To: ${to}\nSubject: ${subject}\n${"-".repeat(60)}\n${text}\n${"-".repeat(60)}`);
  return { id: `console-${Date.now()}` };
};

/** Resend when RESEND_API_KEY is set; otherwise log emails to the console. */
export function emailSender(): EmailSender {
  if (process.env.RESEND_API_KEY) return resendSender;
  console.warn("[email] RESEND_API_KEY missing: emails are logged to the console, not sent");
  return consoleSender;
}
