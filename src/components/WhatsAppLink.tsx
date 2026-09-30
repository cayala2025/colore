import type { ReactNode } from "react";
import { es } from "@/content/es";
import { studioWhatsappNumber, waLink } from "@/lib/waLink";

type Props = {
  text: string;
  className?: string;
  children: ReactNode;
};

/** Link to Colore's WhatsApp. Renders "#" plus a dev-only warning while the number is missing. */
export function WhatsAppLink({ text, className, children }: Props) {
  const href = waLink(studioWhatsappNumber, text);
  const missing = href === "#";
  return (
    <>
      <a
        href={href}
        target={missing ? undefined : "_blank"}
        rel={missing ? undefined : "noopener noreferrer"}
        className={className}
      >
        {children}
      </a>
      {missing && process.env.NODE_ENV !== "production" && (
        <p role="note" className="col-span-full text-xs text-danger">
          {es.booking.people.devWhatsappMissing}
        </p>
      )}
    </>
  );
}
