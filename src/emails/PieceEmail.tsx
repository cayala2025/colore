import { Img, Link, Text } from "@react-email/components";
import { es } from "@/content/es";
import { formatDateLong } from "@/lib/format";
import { PICKUP_DAYS, READY_DAYS } from "@/lib/pieceTimeline";
import { Layout, styles } from "./Layout";
import { theme } from "./theme";

export type PieceEmailData = {
  name: string;
  code: string;
  /** Signed URL of the piece photo (private bucket), if available. */
  photoUrl?: string | null;
  /** Studio date the piece should be ready. */
  readyDate: string;
  /** Last studio date to pick it up before donation. */
  lastPickupDate: string;
};

export type PieceEmailKind = "received" | "ready" | "reminder" | "finalNotice";

const copy = {
  received: es.email.pieceReceived,
  ready: es.email.pieceReady,
  reminder: es.email.pieceReminder,
  finalNotice: es.email.pieceFinalNotice,
};

export function pieceEmailSubject(kind: PieceEmailKind, data: PieceEmailData) {
  return copy[kind].subject(data.code);
}

function Code({ code }: { code: string }) {
  return (
    <Text
      style={{
        fontSize: 44,
        fontWeight: 800,
        letterSpacing: 1,
        textAlign: "center",
        fontFamily: "Menlo, Consolas, monospace",
        backgroundColor: theme.accentSoft,
        borderRadius: 12,
        padding: "16px 8px",
        margin: "8px 0 16px",
        color: theme.ink,
      }}
    >
      {code}
    </Text>
  );
}

export function PieceEmail({ kind, data }: { kind: PieceEmailKind; data: PieceEmailData }) {
  const t = copy[kind];
  const first = data.name.split(" ")[0];
  const lastDay = formatDateLong(data.lastPickupDate);
  return (
    <Layout preview={t.preview}>
      <Text style={styles.h1}>{t.title}</Text>
      <Text style={styles.p}>
        {first}, {t.intro.charAt(0).toLowerCase() + t.intro.slice(1)}
      </Text>
      <Text style={{ ...styles.label, textAlign: "center" }}>{es.email.labels.code}</Text>
      <Code code={data.code} />
      {data.photoUrl && (
        <Img
          src={data.photoUrl}
          alt={es.email.pieceReceived.photoAlt}
          width="100%"
          style={{ borderRadius: 12, maxWidth: 472, margin: "0 auto 16px" }}
        />
      )}
      {kind === "received" ? (
        <>
          <Text style={styles.label}>{es.email.labels.readyBy}</Text>
          <Text style={styles.value}>{formatDateLong(data.readyDate)}</Text>
          <Text style={styles.p}>{es.email.pieceReceived.next(READY_DAYS)}</Text>
          <Text style={{ ...styles.p, fontWeight: 600 }}>{es.email.pieceReceived.policy(PICKUP_DAYS)}</Text>
        </>
      ) : (
        <>
          <Text style={styles.label}>{es.email.labels.address}</Text>
          <Text style={styles.value}>
            <Link href={es.studio.mapsUrl} style={{ color: "inherit", textDecoration: "underline" }}>
              {es.studio.address}
            </Link>
          </Text>
          <Text style={{ ...styles.p, fontWeight: 600 }}>
            {kind === "ready"
              ? es.email.pieceReady.policy(lastDay)
              : kind === "reminder"
                ? es.email.pieceReminder.policy(lastDay)
                : es.email.pieceFinalNotice.policy(lastDay)}
          </Text>
        </>
      )}
    </Layout>
  );
}

const preview: PieceEmailData = {
  name: "Ana López",
  code: "C-0042",
  photoUrl: null,
  readyDate: "2026-10-15",
  lastPickupDate: "2026-11-15",
};

export default function PieceReceivedPreview() {
  return <PieceEmail kind="received" data={preview} />;
}
