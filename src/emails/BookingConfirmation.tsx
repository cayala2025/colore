import { Button, Section, Text } from "@react-email/components";
import { es } from "@/content/es";
import { formatDateLong } from "@/lib/format";
import { manageUrl } from "@/lib/site";
import { BookingDetails, type BookingEmailData } from "./BookingDetails";
import { Layout, styles } from "./Layout";

const t = es.email.bookingConfirmation;

export function bookingConfirmationSubject(data: BookingEmailData) {
  return t.subject(formatDateLong(data.date));
}

export default function BookingConfirmation(data: BookingEmailData) {
  return (
    <Layout preview={t.preview}>
      <Text style={styles.h1}>{t.title(data.name.split(" ")[0])}</Text>
      <Text style={styles.p}>{t.intro}</Text>
      <BookingDetails {...data} />
      <Text style={styles.muted}>{t.note}</Text>
      <Text style={styles.p}>{t.manageText}</Text>
      <Section style={{ textAlign: "center" }}>
        <Button href={manageUrl(data.manageToken)} style={styles.button}>
          {t.manageButton}
        </Button>
      </Section>
    </Layout>
  );
}

BookingConfirmation.PreviewProps = {
  name: "Ana López",
  date: "2026-10-08",
  start: "16:00",
  end: "18:00",
  party: 2,
  manageToken: "abc123",
} satisfies BookingEmailData;
