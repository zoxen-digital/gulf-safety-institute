import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import QRCode from "qrcode";
import { StoredUpload } from "./models";
import { binaryToBuffer, parseUploadUrl } from "./upload-core";
import { displayStatus, maskIdentity } from "./verify-core";
import type { FullRecord } from "./certificates";
import type { SiteSettings } from "./catalog";

const NAVY = rgb(0x14 / 255, 0x29 / 255, 0x4f / 255);
const NAVY_DARK = rgb(0x0b / 255, 0x1a / 255, 0x33 / 255);
const GOLD = rgb(0xc9 / 255, 0xa5 / 255, 0x4c / 255);
const CREAM = rgb(0xf6 / 255, 0xf3 / 255, 0xec / 255);
const TEXT = rgb(0x1c / 255, 0x24 / 255, 0x33 / 255);
const MUTED = rgb(0.42, 0.45, 0.5);
const RED = rgb(0.75, 0.1, 0.1);

export type PdfContext = "public" | "admin";

export function verifyUrl(n: string) {
  return `${(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/verify/${encodeURIComponent(n)}`;
}

async function embedStored(doc: PDFDocument, url?: string): Promise<PDFImage | null> {
  // Bundled brand assets (e.g. /brand/gsi-icon.png) are read from /public.
  if (url && /^\/brand\/[a-z0-9-]+\.png$/.test(url)) {
    try {
      return await doc.embedPng(await readFile(path.join(process.cwd(), "public", url)));
    } catch {
      return null;
    }
  }
  const p = parseUploadUrl(url);
  if (!p) return null;
  const f = await StoredUpload.findOne(p).select("+data mimeType").lean();
  if (!f?.data) return null;
  const bytes = new Uint8Array(binaryToBuffer(f.data));
  try {
    if (f.mimeType === "image/png") return await doc.embedPng(bytes);
    if (f.mimeType === "image/jpeg") return await doc.embedJpg(bytes);
  } catch {
    /* unsupported variant */
  }
  return null;
}

async function qrImage(doc: PDFDocument, n: string) {
  const png = await QRCode.toBuffer(verifyUrl(n), { errorCorrectionLevel: "M", margin: 1, width: 400, color: { dark: "#0B1A33", light: "#FFFFFF" } });
  return doc.embedPng(png);
}

const fmt = (d?: Date | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).toUpperCase() : "-");
// Standard fonts are WinAnsi only; strip anything they cannot encode.
const safe = (s?: string | null) => (s || "").replace(/â‚‚/g, "2").replace(/[^\x20-\x7EÂ -Ã¿]/g, "");

function fit(text: string, font: PDFFont, size: number, max: number) {
  let s = safe(text);
  while (s.length > 1 && font.widthOfTextAtSize(s, size) > max) s = s.slice(0, -2);
  return s === safe(text) ? s : s + ".";
}

function wrap(text: string, font: PDFFont, size: number, max: number) {
  const words = safe(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawEmblem(page: PDFPage, x: number, y: number, r: number, bold: PDFFont) {
  page.drawCircle({ x, y, size: r, borderColor: NAVY, borderWidth: r * 0.12, color: rgb(1, 1, 1) });
  page.drawCircle({ x, y, size: r * 0.78, borderColor: GOLD, borderWidth: r * 0.05 });
  const t = "G";
  const s = r * 1.1;
  page.drawText(t, { x: x - bold.widthOfTextAtSize(t, s) / 2, y: y - s * 0.36, size: s, font: bold, color: NAVY });
}

async function logo(doc: PDFDocument, page: PDFPage, settings: SiteSettings, x: number, y: number, h: number, bold: PDFFont) {
  // The compact shield fits the PDF headers; an uploaded logo replaces it.
  const img = (parseUploadUrl(settings.logoUrl) && (await embedStored(doc, settings.logoUrl))) || (await embedStored(doc, "/brand/gsi-icon.png"));
  if (img) {
    const w = (img.width / img.height) * h;
    page.drawImage(img, { x, y, width: w, height: h });
    return w;
  }
  drawEmblem(page, x + h / 2, y + h / 2, h / 2, bold);
  return h;
}

export async function certificatePdf(rec: FullRecord, settings: SiteSettings, ctx: PdfContext) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Certificate ${rec.certificateNumber}`);
  doc.setAuthor(settings.instituteName);
  doc.setSubject("Certificate of Competence");
  doc.setKeywords([]);
  const page = doc.addPage([842, 595]);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
  const W = 842, H = 595;

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM });
  page.drawRectangle({ x: 18, y: 18, width: W - 36, height: H - 36, borderColor: NAVY, borderWidth: 6 });
  page.drawRectangle({ x: 30, y: 30, width: W - 60, height: H - 60, borderColor: GOLD, borderWidth: 1.5 });
  page.drawRectangle({ x: 30, y: H - 120, width: W - 60, height: 90, color: NAVY });
  page.drawRectangle({ x: 30, y: H - 123, width: W - 60, height: 3, color: GOLD });

  const lw = await logo(doc, page, settings, 54, H - 108, 66, bold);
  page.drawText(safe(settings.instituteName), { x: 54 + lw + 14, y: H - 70, size: 26, font: bold, color: rgb(1, 1, 1) });
  page.drawText(safe(settings.instituteFullName).toUpperCase(), { x: 54 + lw + 14, y: H - 90, size: 9, font: reg, color: GOLD });

  const center = (t: string, y: number, size: number, font: PDFFont, color = TEXT) =>
    page.drawText(t, { x: (W - font.widthOfTextAtSize(t, size)) / 2, y, size, font, color });

  center("CERTIFICATE OF COMPETENCE", H - 168, 30, serif, NAVY);
  page.drawRectangle({ x: W / 2 - 60, y: H - 182, width: 120, height: 2, color: GOLD });
  center("This is to certify that", H - 212, 12, reg, MUTED);
  center(fit(rec.trainee.fullName.toUpperCase(), serif, 28, 640), H - 250, 28, serif, NAVY_DARK);
  const id = ctx === "admin" ? rec.trainee.idNumber : maskIdentity(rec.trainee.idNumber);
  center(`ID No. ${safe(id)}${rec.trainee.nationality ? `   |   ${safe(rec.trainee.nationality)}` : ""}`, H - 270, 10, reg, MUTED);
  center("has successfully completed the training and competency assessment for", H - 298, 12, reg, TEXT);
  center(fit(rec.course.name, bold, 18, 680), H - 326, 18, bold, NAVY);
  if (rec.level) center(fit(`Level / Category: ${rec.level}`, reg, 11, 600), H - 344, 11, reg, TEXT);

  const loc = [rec.location?.city || rec.location?.name, rec.location?.country].filter(Boolean).join(", ");
  const rows: [string, string][] = [
    ["Certificate No.", rec.certificateNumber],
    ["Training Dates", rec.trainingStartDate ? `${fmt(rec.trainingStartDate)} - ${fmt(rec.trainingEndDate)}` : "-"],
    ["Training Location", loc || "-"],
    ["Issue Date", fmt(rec.issueDate)],
    ["Expiry Date", fmt(rec.expiryDate)],
    ["Company", rec.company || rec.trainee.company || "-"],
  ];
  rows.forEach(([k, v], i) => {
    const col = i % 3, row = Math.floor(i / 3);
    const x = 90 + col * 200, y = H - 384 - row * 34;
    page.drawText(k.toUpperCase(), { x, y, size: 7.5, font: bold, color: GOLD });
    page.drawText(fit(v, reg, 10.5, 185), { x, y: y - 13, size: 10.5, font: k === "Certificate No." ? bold : reg, color: k === "Certificate No." ? RED : TEXT });
  });

  const sig = async (label: string, name?: string, des?: string, url?: string, x = 0) => {
    const img = await embedStored(doc, url);
    if (img) {
      const h = 34, w = Math.min(130, (img.width / img.height) * h);
      page.drawImage(img, { x: x + (150 - w) / 2, y: 92, width: w, height: h });
    }
    page.drawLine({ start: { x, y: 88 }, end: { x: x + 150, y: 88 }, thickness: 0.8, color: NAVY });
    page.drawText(fit(name || "-", bold, 10, 150), { x, y: 74, size: 10, font: bold, color: TEXT });
    page.drawText(fit(des ? `${label} - ${des}` : label, reg, 8, 150), { x, y: 62, size: 8, font: reg, color: MUTED });
  };
  await sig("Trainer", rec.trainer?.name, rec.trainerDesignation, rec.trainerSignature, 90);
  await sig("Approved By", rec.approver?.name, rec.approverDesignation, rec.approverSignature, 290);

  const stamp = await embedStored(doc, settings.stampUrl);
  if (stamp) page.drawImage(stamp, { x: 480, y: 56, width: 84, height: (stamp.height / stamp.width) * 84 });

  const qr = await qrImage(doc, rec.certificateNumber);
  page.drawImage(qr, { x: W - 180, y: 58, width: 96, height: 96 });
  page.drawText("Scan to verify", { x: W - 168, y: 46, size: 8, font: reg, color: MUTED });

  if (rec.isDemo) center("DEMO RECORD - NOT A VALID CREDENTIAL", 40, 9, bold, RED);
  if (displayStatus(rec.status, rec.expiryDate) === "EXPIRED") {
    page.drawText("EXPIRED", { x: W - 300, y: H - 250, size: 54, font: bold, color: RED, opacity: 0.18 });
  }
  return doc.save();
}

export async function idCardPdf(rec: FullRecord, settings: SiteSettings, ctx: PdfContext) {
  const doc = await PDFDocument.create();
  doc.setTitle(`ID Card ${rec.certificateNumber}`);
  doc.setAuthor(settings.instituteName);
  doc.setKeywords([]);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 242.65, H = 153.07; // 85.6 x 54 mm

  // FRONT
  const f = doc.addPage([W, H]);
  f.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
  f.drawRectangle({ x: 0, y: H - 34, width: W, height: 34, color: NAVY });
  f.drawRectangle({ x: 0, y: H - 36, width: W, height: 2, color: GOLD });
  const lw = await logo(doc, f, settings, 7, H - 30, 26, bold);
  f.drawText(safe(settings.instituteName), { x: 7 + lw + 5, y: H - 17, size: 11, font: bold, color: rgb(1, 1, 1) });
  f.drawText("CERTIFIED", { x: 7 + lw + 5, y: H - 27, size: 6, font: bold, color: GOLD });
  const course = wrap(rec.course.name.toUpperCase(), bold, 6.2, 110).slice(0, 3);
  course.forEach((l, i) => f.drawText(l, { x: W - 7 - bold.widthOfTextAtSize(l, 6.2), y: H - 13 - i * 7.5, size: 6.2, font: bold, color: rgb(1, 1, 1) }));

  const photo = await embedStored(doc, rec.trainee.photoUrl);
  f.drawRectangle({ x: 7, y: 34, width: 52, height: 64, color: CREAM, borderColor: NAVY, borderWidth: 0.6 });
  if (photo) f.drawImage(photo, { x: 7.5, y: 34.5, width: 51, height: 63 });
  else f.drawText("PHOTO", { x: 20, y: 64, size: 7, font: reg, color: MUTED });
  f.drawText(rec.certificateNumber, { x: 7, y: 25, size: 6.5, font: bold, color: RED });

  const id = ctx === "admin" ? rec.trainee.idNumber : maskIdentity(rec.trainee.idNumber);
  const lines: [string, string][] = [
    ["NAME", rec.trainee.fullName.toUpperCase()],
    ["ID NO", id],
    ["ISSUED", fmt(rec.issueDate)],
    ["EXPIRY", fmt(rec.expiryDate)],
    ["COMPANY", (rec.company || rec.trainee.company || "-").toUpperCase()],
    ["PROJECT", (rec.project || "N/A").toUpperCase()],
  ];
  lines.forEach(([k, v], i) => {
    const y = 106 - i * 11.5;
    f.drawText(`${k}:`, { x: 65, y, size: 5.5, font: bold, color: NAVY });
    f.drawText(fit(v, reg, 5.8, 105), { x: 96, y, size: 5.8, font: reg, color: TEXT });
  });
  const qr = await qrImage(doc, rec.certificateNumber);
  f.drawImage(qr, { x: W - 44, y: 32, width: 38, height: 38 });
  f.drawRectangle({ x: 0, y: 0, width: W, height: 14, color: NAVY });
  const v = "Verify: " + verifyUrl(rec.certificateNumber).replace(/^https?:\/\//, "");
  f.drawText(fit(v, reg, 5, W - 14), { x: 7, y: 5, size: 5, font: reg, color: rgb(1, 1, 1) });
  if (rec.isDemo) f.drawText("DEMO - NOT VALID", { x: 70, y: 20, size: 7, font: bold, color: RED });

  // BACK
  const b = doc.addPage([W, H]);
  b.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM });
  b.drawRectangle({ x: 0, y: H - 6, width: W, height: 6, color: NAVY });
  const back: [string, string][] = [
    ["TRAINED BY", rec.trainer?.name || "-"],
    ["APPROVED BY", rec.approver?.name || "-"],
    ["ENR NO", rec.enrollmentNumber || "-"],
    ["LEVEL / CATEGORY", rec.level || "N/A"],
  ];
  back.forEach(([k, val], i) => {
    const y = H - 20 - i * 12;
    b.drawText(`${k}:`, { x: 8, y, size: 5.8, font: bold, color: NAVY });
    b.drawText(fit(val.toUpperCase(), reg, 6, 140), { x: 72, y, size: 6, font: reg, color: k === "ENR NO" ? RED : TEXT });
  });
  const stamp = await embedStored(doc, settings.stampUrl);
  if (stamp) b.drawImage(stamp, { x: W - 58, y: H - 66, width: 48, height: (stamp.height / stamp.width) * 48 });
  const contact = [settings.address, settings.phone && `Tel: ${settings.phone}`, settings.email].filter(Boolean).join("  |  ");
  if (contact) wrap(contact, reg, 5, W - 16).slice(0, 2).forEach((l, i) => b.drawText(l, { x: 8, y: 62 - i * 7, size: 5, font: reg, color: TEXT }));
  b.drawRectangle({ x: 0, y: 0, width: W, height: 46, color: NAVY });
  wrap(settings.idCardDisclaimer, bold, 5, W - 16).slice(0, 6).forEach((l, i) =>
    b.drawText(l, { x: (W - bold.widthOfTextAtSize(l, 5)) / 2, y: 37 - i * 6.4, size: 5, font: bold, color: rgb(1, 1, 1) }),
  );
  return doc.save();
}
