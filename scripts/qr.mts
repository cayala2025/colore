// npm run qr → print/pieza-qr.png and print/pieza-qr.pdf (QR to NEXT_PUBLIC_SITE_URL/pieza).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { es } from "../src/content/es.ts";

nextEnv.loadEnvConfig(process.cwd());

const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
const url = `${site}/pieza`;
const outDir = path.join(process.cwd(), "print");
const ink = rgb(0x1d / 255, 0x1a / 255, 0x17 / 255);
const accent = rgb(0xb5 / 255, 0x53 / 255, 0x2f / 255);

await mkdir(outDir, { recursive: true });

const png = await QRCode.toBuffer(url, { errorCorrectionLevel: "M", margin: 2, width: 1200, color: { dark: "#1d1a17", light: "#ffffff" } });
await writeFile(path.join(outDir, "pieza-qr.png"), png);

// Letter-size page with a centered table card (title, QR, instructions, URL).
const pdf = await PDFDocument.create();
const page = pdf.addPage([612, 792]);
const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
const regular = await pdf.embedFont(StandardFonts.Helvetica);
const qr = await pdf.embedPng(png);
const center = (text: string, font: typeof bold, size: number, y: number, color = ink) =>
  page.drawText(text, { x: (612 - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color });

center(es.brand.name, bold, 40, 700, accent);
center(es.qrCard.title, bold, 26, 640);
const qrSize = 380;
page.drawImage(qr, { x: (612 - qrSize) / 2, y: 230, width: qrSize, height: qrSize });

// Wrap the body text to the card width.
const words = es.qrCard.body.split(" ");
const lines: string[] = [];
for (const w of words) {
  const last = lines.at(-1);
  if (last && regular.widthOfTextAtSize(`${last} ${w}`, 16) < 440) lines[lines.length - 1] = `${last} ${w}`;
  else lines.push(w);
}
lines.forEach((line, i) => center(line, regular, 16, 190 - i * 22));
center(url, regular, 11, 110, rgb(0.42, 0.38, 0.35));

await writeFile(path.join(outDir, "pieza-qr.pdf"), await pdf.save());
console.log(`QR for ${url}\n  → print/pieza-qr.png\n  → print/pieza-qr.pdf`);
if (site.includes("localhost")) {
  console.warn("Warning: NEXT_PUBLIC_SITE_URL points to localhost. Set the real domain before printing.");
}
