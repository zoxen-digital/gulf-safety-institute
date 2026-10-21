import { NextResponse } from "next/server";
import { connectDb, isDbConfigured } from "@/lib/db";
import { loadCertificate } from "@/lib/certificates";
import { certificatePdf, idCardPdf, qrPng } from "@/lib/pdf";
import { clientId, rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/site-data";
import { canPublicDownload, displayStatus, normalizeCertificateNumber } from "@/lib/verify-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(req: Request, { params }: { params: Promise<{ number: string; kind: string }> }) {
  const { number, kind } = await params;
  if (kind !== "certificate" && kind !== "id-card" && kind !== "qr") return NextResponse.json({ error: "Not found" }, { status: 404, headers: NO_STORE });
  const n = normalizeCertificateNumber(decodeURIComponent(number));
  if (!n) return NextResponse.json({ error: "Invalid certificate number" }, { status: 400, headers: NO_STORE });
  if (!isDbConfigured()) return NextResponse.json({ error: "Service unavailable" }, { status: 503, headers: NO_STORE });

  await connectDb();
  if (!(await rateLimit(kind === "qr" ? "verify-qr" : "verify-pdf", await clientId(req), kind === "qr" ? 60 : 20, 60))) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: NO_STORE });

  const rec = await loadCertificate({ certificateNumber: n });
  // Same status rules as the verification page: revoked/suspended certificates are never downloadable.
  if (!rec || !canPublicDownload(displayStatus(rec.status, rec.expiryDate))) return NextResponse.json({ error: "Not available" }, { status: 404, headers: NO_STORE });

  if (kind === "qr") {
    const png = await qrPng(rec.certificateNumber);
    return new NextResponse(new Uint8Array(png), {
      headers: { ...NO_STORE, "Content-Type": "image/png", "Content-Disposition": `inline; filename="qr-${n}.png"` },
    });
  }
  const settings = await getSettings();
  const bytes = kind === "certificate" ? await certificatePdf(rec, settings, "public") : await idCardPdf(rec, settings, "public");
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      ...NO_STORE,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${kind}-${n}.pdf"`,
    },
  });
}
