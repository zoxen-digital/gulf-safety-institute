import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { AuthError, assertUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { loadCertificate } from "@/lib/certificates";
import { certificatePdf, idCardPdf } from "@/lib/pdf";
import { canAccessLocation } from "@/lib/permissions";
import { getSettings } from "@/lib/site-data";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  try {
    const u = await assertUser("certificates.view");
    const { id, kind } = await params;
    if (!isValidObjectId(id) || (kind !== "certificate" && kind !== "id-card")) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await connectDb();
    const rec = await loadCertificate({ _id: id });
    if (!rec || !canAccessLocation(u, rec.locationId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const settings = await getSettings();
    const bytes = kind === "certificate" ? await certificatePdf(rec, settings, "admin") : await idCardPdf(rec, settings, "admin");
    await logActivity(u, "download", "Certificate", id, { kind, certificateNumber: rec.certificateNumber });
    return new NextResponse(Buffer.from(bytes), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${kind}-${rec.certificateNumber}.pdf"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Could not generate PDF" }, { status: 500 });
  }
}
