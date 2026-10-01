import { Body, Container, Head, Hr, Html, Img, Preview, Section, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import { es } from "@/content/es";
import { siteUrl } from "@/lib/site";
import { theme } from "./theme";

type Props = {
  /** Inbox preview line. */
  preview: string;
  children: ReactNode;
};

/** Shared Spanish email layout: cream background, wordmark, white card, footer. */
export function Layout({ preview, children }: Props) {
  return (
    <Html lang="es-MX">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: theme.bg, fontFamily: theme.font, color: theme.ink, margin: 0, padding: "24px 0" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px" }}>
          <Section style={{ backgroundColor: theme.brandBg, borderRadius: 16, padding: "12px 0", marginBottom: 16 }}>
            <Img
              src={`${siteUrl()}/brand/colore-logo.jpg`}
              alt={es.brand.logoAlt}
              width="240"
              style={{ margin: "0 auto", display: "block", color: theme.accent, fontSize: 28, fontWeight: 700 }}
            />
          </Section>
          <Section
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.line}`,
              borderRadius: 16,
              padding: "24px",
            }}
          >
            {children}
          </Section>
          <Hr style={{ borderColor: theme.line, margin: "24px 0 12px" }} />
          <Text style={{ fontSize: 12, color: theme.muted, textAlign: "center", margin: 0 }}>{es.email.footer}</Text>
          <Text style={{ fontSize: 12, color: theme.muted, textAlign: "center", margin: "4px 0 0" }}>
            {es.studio.address}
          </Text>
          <Text style={{ fontSize: 11, color: theme.muted, textAlign: "center", margin: "12px 0 0" }}>
            {es.email.footerAuto}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const styles = {
  h1: { fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: theme.ink } satisfies CSSProperties,
  p: { fontSize: 16, lineHeight: "24px", margin: "0 0 12px", color: theme.ink } satisfies CSSProperties,
  muted: { fontSize: 14, lineHeight: "20px", margin: "0 0 12px", color: theme.muted } satisfies CSSProperties,
  label: { fontSize: 13, color: theme.muted, margin: 0 } satisfies CSSProperties,
  value: { fontSize: 16, fontWeight: 600, margin: "0 0 12px", color: theme.ink } satisfies CSSProperties,
  button: {
    backgroundColor: theme.accent,
    color: theme.accentInk,
    borderRadius: 12,
    padding: "14px 20px",
    fontWeight: 600,
    fontSize: 16,
    textDecoration: "none",
    display: "inline-block",
  } satisfies CSSProperties,
  buttonSecondary: {
    backgroundColor: theme.surface,
    color: theme.ink,
    border: `1px solid ${theme.line}`,
    borderRadius: 12,
    padding: "13px 20px",
    fontWeight: 600,
    fontSize: 16,
    textDecoration: "none",
    display: "inline-block",
  } satisfies CSSProperties,
};
