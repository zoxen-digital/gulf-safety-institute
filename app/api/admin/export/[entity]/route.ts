import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { AuthError, assertUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { escapeRegex, traineeScope } from "@/lib/admin";
import { buildCertificateFilter } from "@/lib/cert-filters";
import { Category, Certificate, Course, Inquiry, Location, Trainee, Trainer, VerificationLog } from "@/lib/models";
import { displayStatus } from "@/lib/verify-core";
import { logActivity } from "@/lib/activity";
import type { Permission } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS = 20000;
const PERMS: Record<string, Permission> = { certificates: "certificates.view", trainees: "trainees.view", inquiries: "inquiries.manage", courses: "catalog.manage", "verification-logs": "logs.verification" };

// Neutralise spreadsheet formula injection.
const cell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? "" : String(v);
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
};
const d = (v?: Date | null) => (v ? new Date(v).toISOString().slice(0, 10) : "");

export async function GET(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  try {
    const { entity } = await params;
    const perm = PERMS[entity];
    if (!perm) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const u = await assertUser(perm);
    await connectDb();
    const sp = Object.fromEntries(new URL(req.url).searchParams);
    let rows: Record<string, unknown>[] = [];

    if (entity === "certificates") {
      void [Trainee, Course, Location, Trainer, Category];
      const list = await Certificate.find(await buildCertificateFilter(u, sp)).sort({ issueDate: -1 }).limit(MAX_ROWS)
        .populate("trainee", "fullName idNumber nationality").populate({ path: "course", select: "name category", populate: { path: "category", select: "code" } })
        .populate("location", "name").populate("trainer", "name").populate("approver", "name").lean();
      rows = list.map((c) => {
        const t = c.trainee as unknown as { fullName: string; idNumber: string; nationality: string } | null;
        const co = c.course as unknown as { name: string; category?: { code: string } } | null;
        return {
          certificate_number: c.certificateNumber, trainee_name: t?.fullName, id_number: t?.idNumber, nationality: t?.nationality,
          course: c.courseName || co?.name, category: co?.category?.code, level: c.level, company: c.company, project: c.project,
          location: (c.location as unknown as { name: string } | null)?.name, trainer: (c.trainer as unknown as { name: string } | null)?.name,
          approver: (c.approver as unknown as { name: string } | null)?.name, enrollment_number: c.enrollmentNumber,
          training_start: d(c.trainingStartDate), training_end: d(c.trainingEndDate), issue_date: d(c.issueDate), expiry_date: d(c.expiryDate),
          status: displayStatus(c.status, c.expiryDate),
        };
      });
    } else if (entity === "trainees") {
      const and: Record<string, unknown>[] = [await traineeScope(u)];
      if (sp.q) { const r = { $regex: escapeRegex(sp.q.slice(0, 80)), $options: "i" }; and.push({ $or: [{ fullName: r }, { idNumber: r }, { company: r }] }); }
      const list = await Trainee.find({ $and: and }).sort({ fullName: 1 }).limit(MAX_ROWS).lean();
      rows = list.map((t) => ({ full_name: t.fullName, id_number: t.idNumber, nationality: t.nationality, dob: d(t.dob), phone: t.phone, email: t.email, company: t.company }));
    } else if (entity === "inquiries") {
      const f: Record<string, unknown> = {};
      if (sp.status) f.status = String(sp.status).slice(0, 20);
      if (sp.type) f.type = String(sp.type).slice(0, 60);
      const list = await Inquiry.find(f).sort({ createdAt: -1 }).limit(MAX_ROWS).lean();
      rows = list.map((i) => ({ received: d(i.createdAt), name: i.name, company: i.company, email: i.email, phone: i.phone, country: i.country, type: i.type, course: i.courseName, trainees: i.traineesCount ?? "", message: i.message, status: i.status, notes: i.notes }));
    } else if (entity === "courses") {
      const cats = await Category.find().lean();
      const list = await Course.find().sort({ sortOrder: 1 }).lean();
      rows = list.map((c) => ({ category: cats.find((x) => String(x._id) === String(c.category))?.code, name: c.name, slug: c.slug, duration: c.duration, validity_months: c.defaultValidityMonths, delivery: c.deliveryMode, on_website: c.showOnWebsite, active: c.isActive }));
    } else if (entity === "verification-logs") {
      const list = await VerificationLog.find(sp.result ? { result: String(sp.result).slice(0, 20) } : {}).sort({ createdAt: -1 }).limit(MAX_ROWS).lean();
      rows = list.map((l) => ({ time: new Date(l.createdAt).toISOString(), searched: l.searchedNumber, result: l.result, client: l.clientId, user_agent: l.userAgent }));
    }

    const ws = XLSX.utils.json_to_sheet(rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, cell(v)]))));
    const stamp = new Date().toISOString().slice(0, 10);
    await logActivity(u, "export", entity, undefined, { rows: rows.length, format: sp.format || "csv" });
    if (sp.format === "xlsx") {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, entity.slice(0, 30));
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
      return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="gistra-${entity}-${stamp}.xlsx"`, "Cache-Control": "no-store" } });
    }
    const csv = "﻿" + XLSX.utils.sheet_to_csv(ws);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="gistra-${entity}-${stamp}.csv"`, "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
