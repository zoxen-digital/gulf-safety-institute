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
import { siteUrl } from "./site-url";

const NAVY = rgb(0x14 / 255, 0x29 / 255, 0x4f / 255);
const NAVY_DARK = rgb(0x0b / 255, 0x1a / 255, 0x33 / 255);
const BLUE = rgb(0x1f / 255, 0x3a / 255, 0x8a / 255);
const GOLD = rgb(0xc9 / 255, 0xa5 / 255, 0x4c / 255);
const TEXT = rgb(0x11 / 255, 0x11 / 255, 0x11 / 255);
const MUTED = rgb(0.42, 0.45, 0.5);
const RED = rgb(0.75, 0.1, 0.1);
const WHITE = rgb(1, 1, 1);

export type PdfContext = "public" | "admin";

export function verifyUrl(n: string) {
  return `${siteUrl()}/verify/${encodeURIComponent(n)}`;
}

export async function qrPng(n: string) {
  return QRCode.toBuffer(verifyUrl(n), { errorCorrectionLevel: "M", margin: 1, width: 600, color: { dark: "#000000", light: "#FFFFFF" } });
}

/** Loads a stored upload or a bundled /brand PNG as a PDF image (PNG/JPEG only). */
async function embedStored(doc: PDFDocument, url?: string): Promise<PDFImage | null> {
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

const dLong = (d?: Date | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }) : "-");
const dDash = (d?: Date | null) => dLong(d).replace(/ /g, "-");
// Standard fonts are WinAnsi only; strip anything they cannot encode.
const safe = (s?: string | null) => (s || "").replace(/₂/g, "2").replace(/[^\x20-\x7E -ÿ]/g, "");

function fit(text: string, font: PDFFont, size: number, max: number) {
  let s = safe(text);
  while (s.length > 1 && font.widthOfTextAtSize(s, size) > max) s = s.slice(0, -2);
  return s === safe(text) ? s : s + ".";
}

function wrap(text: string, font: PDFFont, size: number, max: number) {
  const lines: string[] = [];
  let cur = "";
  for (const w of safe(text).split(/\s+/)) {
    const t = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > max && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Draws an image inside a box, keeping its aspect ratio, centred. */
function contain(page: PDFPage, img: PDFImage, x: number, y: number, w: number, h: number, opacity = 1) {
  const r = Math.min(w / img.width, h / img.height);
  const iw = img.width * r, ih = img.height * r;
  page.drawImage(img, { x: x + (w - iw) / 2, y: y + (h - ih) / 2, width: iw, height: ih, opacity });
}

async function brandImages(doc: PDFDocument, s: SiteSettings) {
  const uploaded = parseUploadUrl(s.logoUrl) ? await embedStored(doc, s.logoUrl) : null;
  const logo = uploaded || (await embedStored(doc, "/brand/gsi-logo.png"));
  const icon = (await embedStored(doc, "/brand/gsi-icon.png")) || logo;
  const accreditations: PDFImage[] = [];
  for (const u of s.accreditationLogos || []) {
    const img = await embedStored(doc, u);
    if (img) accreditations.push(img);
  }
  // Uploaded stamp/signature win; otherwise the bundled GSI ones are used.
  const stamp = (await embedStored(doc, s.stampUrl)) || (await embedStored(doc, "/brand/gsi-stamp.png"));
  const signature = (await embedStored(doc, s.signatureUrl)) || (await embedStored(doc, "/brand/gsi-signature.png"));
  return { logo, icon, accreditations, stamp, signature };
}

type Brand = Awaited<ReturnType<typeof brandImages>>;

function accreditationRow(page: PDFPage, imgs: PDFImage[], x: number, y: number, w: number, h: number) {
  if (!imgs.length) return;
  const gap = 12;
  const slot = (w - gap * (imgs.length - 1)) / imgs.length;
  imgs.forEach((img, i) => contain(page, img, x + i * (slot + gap), y, slot, h));
}

function idFor(rec: FullRecord, s: SiteSettings, ctx: PdfContext) {
  return ctx === "admin" || s.publicShowFullId ? rec.trainee.idNumber : maskIdentity(rec.trainee.idNumber);
}

function siteText(s: SiteSettings) {
  return s.certificateWebsite || siteUrl().replace(/^https?:\/\//, "");
}

/** A4 portrait certificate (page 1) followed by the wallet card (page 2). */
export async function certificatePdf(rec: FullRecord, settings: SiteSettings, ctx: PdfContext) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Certificate ${rec.certificateNumber}`);
  doc.setAuthor(settings.instituteFullName);
  doc.setSubject("Certificate of Completion");
  doc.setKeywords([]);
  const fonts = {
    reg: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    title: await doc.embedFont(StandardFonts.TimesRomanBold),
  };
  const brand = await brandImages(doc, settings);
  await drawCertificate(doc.addPage([595.28, 841.89]), doc, rec, settings, ctx, fonts, brand);
  await drawCard(doc.addPage([595.28, 375]), doc, rec, settings, ctx, fonts, brand);
  return doc.save();
}

/** Wallet card only. */
export async function idCardPdf(rec: FullRecord, settings: SiteSettings, ctx: PdfContext) {
  const doc = await PDFDocument.create();
  doc.setTitle(`ID Card ${rec.certificateNumber}`);
  doc.setAuthor(settings.instituteFullName);
  doc.setKeywords([]);
  const fonts = { reg: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold), title: await doc.embedFont(StandardFonts.TimesRomanBold) };
  await drawCard(doc.addPage([595.28, 375]), doc, rec, settings, ctx, fonts, await brandImages(doc, settings));
  return doc.save();
}

type Fonts = { reg: PDFFont; bold: PDFFont; title: PDFFont };

async function drawCertificate(page: PDFPage, doc: PDFDocument, rec: FullRecord, s: SiteSettings, ctx: PdfContext, f: Fonts, b: Brand) {
  const W = page.getWidth(), H = page.getHeight();
  const center = (t: string, y: number, size: number, font: PDFFont, color = TEXT) => {
    const txt = fit(t, font, size, W - 110);
    page.drawText(txt, { x: (W - font.widthOfTextAtSize(txt, size)) / 2, y, size, font, color });
  };

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
  // Faint repeating emblem watermark.
  if (b.icon) for (let r = 0, y = 70; y < H - 60; r++, y += 78) for (let x = 50 + (r % 2) * 39; x < W - 60; x += 78) contain(page, b.icon, x, y, 34, 34, 0.05);
  // Double frame.
  page.drawRectangle({ x: 20, y: 20, width: W - 40, height: H - 40, borderColor: NAVY, borderWidth: 3 });
  page.drawRectangle({ x: 27, y: 27, width: W - 54, height: H - 54, borderColor: NAVY, borderWidth: 0.8 });

  if (b.logo) contain(page, b.logo, (W - 190) / 2, H - 150, 190, 102);
  center("Certificate of Completion", H - 205, 38, f.title, TEXT);
  center(s.instituteFullName.toUpperCase(), H - 236, 17, f.bold, BLUE);
  center("awards this certificate to", H - 268, 11, f.reg);
  center(rec.trainee.fullName.toUpperCase(), H - 300, 19, f.bold);
  center(safe(idFor(rec, s, ctx)), H - 324, 15, f.bold);
  center("on successfully completing", H - 356, 11, f.reg);
  const course = wrap(rec.course.name.toUpperCase(), f.bold, 18, W - 120).slice(0, 2);
  course.forEach((l, i) => center(l, H - 390 - i * 22, 18, f.bold, BLUE));
  let y = H - 390 - (course.length - 1) * 22;
  if (rec.level) {
    y -= 22;
    center(rec.level.toUpperCase(), y, 11, f.bold, NAVY);
  }
  if (s.supervisionText) {
    center("under the supervision of", y - 28, 11, f.reg);
    center(s.supervisionText.toUpperCase(), y - 48, 11, f.bold);
    y -= 48;
  }

  const loc = [rec.location?.city || rec.location?.name, rec.location?.country === "Saudi Arabia" ? "Kingdom of Saudi Arabia" : rec.location?.country].filter(Boolean).join(", ");
  const pairs: [string, string][] = [["Issue Date:", dLong(rec.issueDate)], ["Expiry Date:", dLong(rec.expiryDate)], ["Certificate No.", rec.certificateNumber]];
  let ly = y - 38;
  for (const [k, v] of pairs) {
    const kw = f.bold.widthOfTextAtSize(k, 11), vw = f.bold.widthOfTextAtSize(safe(v), 11);
    const x0 = (W - (kw + 6 + vw)) / 2;
    page.drawText(k, { x: x0, y: ly, size: 11, font: f.bold, color: TEXT });
    page.drawText(safe(v), { x: x0 + kw + 6, y: ly, size: 11, font: f.bold, color: k.startsWith("Certificate") ? RED : TEXT });
    ly -= 18;
  }
  if (loc) { center(`Location ${loc}`, ly, 11, f.bold); ly -= 18; }
  const site = siteText(s);
  if (site) {
    const t = fit(site, f.bold, 11, W - 120), tw = f.bold.widthOfTextAtSize(t, 11);
    page.drawText(t, { x: (W - tw) / 2, y: ly, size: 11, font: f.bold, color: BLUE });
    page.drawLine({ start: { x: (W - tw) / 2, y: ly - 2 }, end: { x: (W + tw) / 2, y: ly - 2 }, thickness: 0.7, color: BLUE });
  }

  // Stamp (left), signature (centre), QR (right).
  const baseY = 150;
  if (b.stamp) contain(page, b.stamp, 55, baseY - 10, 105, 105);
  const sig = b.signature || (await embedStored(doc, rec.approverSignature));
  if (sig) contain(page, sig, W / 2 - 85, baseY + 22, 170, 70);
  page.drawLine({ start: { x: W / 2 - 85, y: baseY + 18 }, end: { x: W / 2 + 85, y: baseY + 18 }, thickness: 0.8, color: TEXT });
  const label = safe(s.signatureLabel || "Authorized Signature");
  page.drawText(label, { x: (W - f.bold.widthOfTextAtSize(label, 11)) / 2, y: baseY, size: 11, font: f.bold, color: TEXT });
  const qr = await doc.embedPng(await qrPng(rec.certificateNumber));
  page.drawImage(qr, { x: W - 150, y: baseY - 5, width: 95, height: 95 });

  accreditationRow(page, b.accreditations, 50, 45, W - 100, 50);

  if (rec.isDemo) center("DEMO RECORD - NOT A VALID CREDENTIAL", 34, 9, f.bold, RED);
  if (displayStatus(rec.status, rec.expiryDate) === "EXPIRED") center("EXPIRED", H / 2, 90, f.bold, rgb(0.85, 0.2, 0.2));
}

async function drawCard(page: PDFPage, doc: PDFDocument, rec: FullRecord, s: SiteSettings, ctx: PdfContext, f: Fonts, b: Brand) {
  const W = page.getWidth(), H = page.getHeight();
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: WHITE });
  // Header: emblem + institute name.
  if (b.icon) contain(page, b.icon, 18, H - 72, 60, 60);
  const name = fit(s.instituteFullName.toUpperCase(), f.bold, 22, W - 120);
  page.drawText(name, { x: 88, y: H - 44, size: 22, font: f.bold, color: NAVY_DARK });
  page.drawLine({ start: { x: 88, y: H - 52 }, end: { x: 88 + f.bold.widthOfTextAtSize(name, 22), y: H - 52 }, thickness: 1.5, color: GOLD });
  const site = siteText(s);
  if (site) page.drawText(fit(site, f.reg, 10, W - 120), { x: 88, y: H - 68, size: 10, font: f.reg, color: MUTED });

  const rows: [string, string][] = [
    ["Certificate No:", rec.certificateNumber],
    ["Name:", rec.trainee.fullName.toUpperCase()],
    ["ID No:", idFor(rec, s, ctx)],
    ["Course Name:", rec.course.name.toUpperCase()],
    ["Issuance Date:", dDash(rec.issueDate)],
    ["Expiry Date:", dDash(rec.expiryDate)],
  ];
  if (rec.company) rows.splice(3, 0, ["Company:", rec.company.toUpperCase()]);
  const size = rows.length > 6 ? 12.5 : 13.5, step = rows.length > 6 ? 27 : 30;
  rows.forEach(([k, v], i) => {
    const y = H - 102 - i * step;
    page.drawText(k, { x: 22, y, size, font: f.bold, color: NAVY });
    const kw = f.bold.widthOfTextAtSize(k, size) + 7;
    const max = W - 170 - kw;
    // Shrink long values (e.g. course names) before truncating them.
    let vs = size - 0.5;
    while (vs > 8.5 && f.bold.widthOfTextAtSize(safe(v), vs) > max) vs -= 0.5;
    page.drawText(fit(v, f.bold, vs, max), { x: 22 + kw, y, size: vs, font: f.bold, color: TEXT });
  });

  // Photo and QR on the right.
  const photo = await embedStored(doc, rec.trainee.photoUrl);
  if (photo) contain(page, photo, W - 125, H - 205, 105, 125);
  else {
    page.drawRectangle({ x: W - 118, y: H - 200, width: 92, height: 115, borderColor: MUTED, borderWidth: 0.6 });
    page.drawText("PHOTO", { x: W - 90, y: H - 145, size: 9, font: f.reg, color: MUTED });
  }
  const qr = await doc.embedPng(await qrPng(rec.certificateNumber));
  page.drawImage(qr, { x: W - 112, y: 62, width: 82, height: 82 });

  accreditationRow(page, b.accreditations, 20, 10, W - 150, 44);
  if (rec.isDemo) page.drawText("DEMO - NOT A VALID CREDENTIAL", { x: 22, y: 58, size: 9, font: f.bold, color: RED });
}
