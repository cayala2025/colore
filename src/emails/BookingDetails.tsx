import { Link, Text } from "@react-email/components";
import { es } from "@/content/es";
import { formatDateLong, formatTimeRange } from "@/lib/format";
import { styles } from "./Layout";

export type BookingEmailData = {
  name: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string;
  party: number;
  manageToken: string;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function BookingDetails({ date, start, end, party }: BookingEmailData) {
  const l = es.email.labels;
  return (
    <>
      <Text style={styles.label}>{l.date}</Text>
      <Text style={styles.value}>{capitalize(formatDateLong(date))}</Text>
      <Text style={styles.label}>{l.time}</Text>
      <Text style={styles.value}>{formatTimeRange(start, end)}</Text>
      <Text style={styles.label}>{l.people}</Text>
      <Text style={styles.value}>{party}</Text>
      <Text style={styles.label}>{l.address}</Text>
      <Text style={styles.value}>
        <Link href={es.studio.mapsUrl} style={{ color: "inherit", textDecoration: "underline" }}>
          {es.studio.address}
        </Link>
      </Text>
    </>
  );
}
