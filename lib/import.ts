import "server-only";
import * as XLSX from "xlsx";
import type { SessionUser } from "./auth";
import { traineeScope } from "./admin";
import { Certificate, Course, Location, Trainee, Trainer } from "./models";
import { canAccessLocation } from "./permissions";
import { nextCertificateNumber } from "./certificates";
import { normalizeCertificateNumber } from "./verify-core";
import { slugify } from "./catalog";

export const IMPORT_COLUMNS = [
  "certificate_number", "trainee_name", "id_number", "nationality", "trainee_company", "course", "location", "level", "company", "project",
  "enrollment_number", "trainer", "approver", "training_start", "training_end", "issue_date", "expiry_date",
] as const;
export const REQUIRED = ["trainee_name", "id_number", "course", "location", "issue_date"];
export const MAX_IMPORT_ROWS = 2000;

export type ImportRow = { row: number; data: Record<string, string>; errors: string[] };

export function templateWorkbook() {
  const ws = XLSX.utils.aoa_to_sheet([
    [...IMPORT_COLUMNS],
    ["", "Example Name", "1234567890", "Saudi Arabia", "Example Contracting Co.", "Forklift Truck & Telehandler Operators", "Al Khobar", "Forklift up to 5T", "Example Contracting Co.", "", "ENR-001", "", "", "2026-01-10", "2026-01-12", "2026-01-12", ""],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "certificates");
  return wb;
}

function parseDate(v: string): Date | null {
  const s = v.trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); // DD/MM/YYYY
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return null;
}

export function readRows(buf: Buffer): { rows: Record<string, string>[]; error?: string } {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buf, { type: "buffer", cellDates: true, raw: false });
  } catch {
    return { rows: [], error: "Could not read the file. Upload a .xlsx or .csv file based on the template." };
  }
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return { rows: [], error: "The file has no sheets." };
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "", raw: false, dateNF: "yyyy-mm-dd" });
  const rows = json.map((r) => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      const key = k.trim().toLowerCase().replace(/\s+/g, "_");
      out[key] = v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "").trim().slice(0, 300);
    }
    return out;
  });
  const missingCols = REQUIRED.filter((c) => !(json.length ? Object.keys(rows[0]).includes(c) : true));
  if (missingCols.length) return { rows: [], error: `Missing required column(s): ${missingCols.join(", ")}. Use the template.` };
  if (rows.length > MAX_IMPORT_ROWS) return { rows: [], error: `Too many rows (${rows.length}). Import at most ${MAX_IMPORT_ROWS} rows per file.` };
  return { rows };
}

/** Validates every row against the database and the actor's permissions. Nothing is written. */
export async function validateRows(u: SessionUser, rows: Record<string, string>[]) {
  const [courses, locations, trainers, scope] = await Promise.all([
    Course.find().select("name slug defaultValidityMonths").lean(),
    Location.find().select("name city").lean(),
    Trainer.find({ isActive: true }).select("name type").lean(),
    traineeScope(u),
  ]);
  const norm = (s: string) => s.trim().toLowerCase();
  const seenNumbers = new Set<string>();
  const seenIds = new Map<string, string>();
  const manualNumbers = rows.map((r) => normalizeCertificateNumber(r.certificate_number || "")).filter(Boolean);
  const existing = new Set((await Certificate.find({ certificateNumber: { $in: manualNumbers } }).select("certificateNumber").lean()).map((c) => c.certificateNumber));
  const idNumbers = rows.map((r) => (r.id_number || "").toUpperCase()).filter(Boolean);
  const existingTrainees = await Trainee.find({ idNumber: { $in: idNumbers } }).select("idNumber fullName").lean();
  const visibleTrainees = new Set((await Trainee.find({ $and: [scope, { idNumber: { $in: idNumbers } }] }).select("idNumber").lean()).map((t) => t.idNumber));

  const result: (ImportRow & { resolved?: Record<string, unknown> })[] = [];
  rows.forEach((d, i) => {
    const errors: string[] = [];
    for (const c of REQUIRED) if (!d[c]) errors.push(`${c} is required`);
    const course = courses.find((c) => norm(c.name) === norm(d.course || "") || c.slug === slugify(d.course || ""));
    if (d.course && !course) errors.push(`Unknown course "${d.course}"`);
    const loc = locations.find((l) => norm(l.name) === norm(d.location || "") || norm(l.city) === norm(d.location || ""));
    if (d.location && !loc) errors.push(`Unknown location "${d.location}"`);
    else if (loc && !canAccessLocation(u, String(loc._id))) errors.push(`You are not allowed to import for location "${d.location}"`);
    const trainer = d.trainer ? trainers.find((t) => t.type === "TRAINER" && norm(t.name) === norm(d.trainer)) : undefined;
    if (d.trainer && !trainer) errors.push(`Unknown trainer "${d.trainer}"`);
    const approver = d.approver ? trainers.find((t) => t.type === "APPROVER" && norm(t.name) === norm(d.approver)) : undefined;
    if (d.approver && !approver) errors.push(`Unknown approver "${d.approver}"`);

    const issue = parseDate(d.issue_date || "");
    if (d.issue_date && !issue) errors.push(`Invalid issue_date "${d.issue_date}" (use YYYY-MM-DD)`);
    let expiry = parseDate(d.expiry_date || "");
    if (d.expiry_date && !expiry) errors.push(`Invalid expiry_date "${d.expiry_date}"`);
    if (!d.expiry_date && issue && course) {
      expiry = new Date(issue);
      expiry.setUTCMonth(expiry.getUTCMonth() + course.defaultValidityMonths);
      expiry.setUTCDate(expiry.getUTCDate() - 1);
    }
    if (issue && expiry && expiry <= issue) errors.push("expiry_date must be after issue_date");
    const ts = parseDate(d.training_start || ""), te = parseDate(d.training_end || "");
    if (d.training_start && !ts) errors.push("Invalid training_start");
    if (d.training_end && !te) errors.push("Invalid training_end");

    const number = d.certificate_number ? normalizeCertificateNumber(d.certificate_number) : "";
    if (d.certificate_number && !number) errors.push("Invalid certificate_number");
    if (number && existing.has(number)) errors.push(`Certificate number ${number} already exists`);
    if (number && seenNumbers.has(number)) errors.push(`Duplicate certificate number ${number} in file`);
    if (number) seenNumbers.add(number);

    const idn = (d.id_number || "").toUpperCase();
    if (idn && !/^[A-Z0-9-]{3,40}$/.test(idn)) errors.push("id_number may contain letters, digits and dashes only");
    const prevName = seenIds.get(idn);
    if (idn && prevName && norm(prevName) !== norm(d.trainee_name || "")) errors.push(`id_number ${idn} appears with different names in the file`);
    if (idn) seenIds.set(idn, d.trainee_name || "");
    const ex = existingTrainees.find((t) => t.idNumber === idn);
    if (ex && !visibleTrainees.has(idn)) errors.push("A trainee with this id_number is registered outside your locations. Ask a Super Admin to import this row.");
    else if (ex && norm(ex.fullName) !== norm(d.trainee_name || "")) errors.push(`id_number ${idn} belongs to an existing trainee named "${ex.fullName}"`);

    result.push({
      row: i + 2,
      data: d,
      errors,
      resolved: errors.length ? undefined : { course: course!._id, location: loc!._id, trainer: trainer?._id, approver: approver?._id, issue, expiry, ts, te, number, idn, existingTrainee: ex?._id },
    });
  });
  return result;
}

export async function commitRows(u: SessionUser, rows: Awaited<ReturnType<typeof validateRows>>) {
  let inserted = 0;
  const failed: { row: number; error: string }[] = [];
  for (const r of rows) {
    if (!r.resolved) continue;
    const x = r.resolved as Record<string, never>;
    try {
      let trainee = x.existingTrainee as unknown;
      if (!trainee) {
        const t = await Trainee.findOneAndUpdate(
          { idNumber: x.idn },
          { $setOnInsert: { fullName: r.data.trainee_name, idNumber: x.idn, nationality: r.data.nationality || "", company: r.data.trainee_company || r.data.company || "", homeLocation: x.location, createdBy: u.id } },
          { upsert: true, new: true },
        ).lean();
        trainee = t!._id;
      }
      const issue = x.issue as unknown as Date;
      const certificateNumber = (x.number as string) || (await nextCertificateNumber(issue.getUTCFullYear()));
      await Certificate.create({
        certificateNumber, trainee, course: x.course, location: x.location, trainer: x.trainer, approver: x.approver,
        level: r.data.level || "", company: r.data.company || r.data.trainee_company || "", project: r.data.project || "", enrollmentNumber: r.data.enrollment_number || "",
        trainingStartDate: x.ts || undefined, trainingEndDate: x.te || undefined, issueDate: issue, expiryDate: x.expiry, status: "VALID", createdBy: u.id,
      });
      inserted++;
    } catch (e) {
      failed.push({ row: r.row, error: (e as { code?: number }).code === 11000 ? "Duplicate certificate number" : "Could not save row" });
    }
  }
  return { inserted, failed };
}
