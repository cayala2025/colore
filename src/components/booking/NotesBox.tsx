import { WhatsAppLink } from "@/components/WhatsAppLink";
import { es } from "@/content/es";

export function NotesBox() {
  const t = es.booking.notes;
  return (
    <aside
      data-testid="notes-box"
      className="grid gap-2 rounded-card border border-dashed border-line bg-accent-soft/50 p-4 text-sm"
    >
      <p className="font-medium">{t.text}</p>
      <WhatsAppLink
        text={t.whatsappText}
        className="inline-flex min-h-11 items-center font-medium text-accent underline underline-offset-4"
      >
        {t.cta}
      </WhatsAppLink>
    </aside>
  );
}
