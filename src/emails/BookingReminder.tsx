import { Button, Column, Row, Text } from "@react-email/components";
import { es } from "@/content/es";
import { manageUrl } from "@/lib/site";
import { BookingDetails, type BookingEmailData } from "./BookingDetails";
import { Layout, styles } from "./Layout";

const t = es.email.bookingReminder;

export function bookingReminderSubject() {
  return t.subject;
}

// Links only open the manage page with the action preselected; the customer still taps a button
// there. (Email scanners open links automatically, so a link must never change the booking.)
export default function BookingReminder(data: BookingEmailData) {
  const url = manageUrl(data.manageToken);
  return (
    <Layout preview={t.preview}>
      <Text style={styles.h1}>{t.title(data.name.split(" ")[0])}</Text>
      <Text style={styles.p}>{t.intro}</Text>
      <BookingDetails {...data} />
      <Text style={styles.p}>{t.ask}</Text>
      <Row>
        <Column align="center" style={{ padding: 4 }}>
          <Button href={`${url}?accion=confirmar`} style={styles.button}>
            {t.confirm}
          </Button>
        </Column>
        <Column align="center" style={{ padding: 4 }}>
          <Button href={`${url}?accion=cancelar`} style={styles.buttonSecondary}>
            {t.cancel}
          </Button>
        </Column>
      </Row>
    </Layout>
  );
}

BookingReminder.PreviewProps = {
  name: "Ana López",
  date: "2026-10-08",
  start: "16:00",
  end: "18:00",
  party: 2,
  manageToken: "abc123",
} satisfies BookingEmailData;
