import "server-only";
import { isValidObjectId, Types } from "mongoose";
import type { SessionUser } from "./auth";
import { certificateScope, escapeRegex, toDate } from "./admin";
import { Course, Trainee } from "./models";

export type CertFilterParams = { q?: string; status?: string; course?: string; category?: string; location?: string; company?: string; from?: string; to?: string };

/** Builds the scoped certificate query shared by the list page and the export endpoint. */
export async function buildCertificateFilter(u: SessionUser, p: CertFilterParams) {
  const and: Record<string, unknown>[] = [certificateScope(u)];
  const now = new Date();
  if (p.status === "VALID") and.push({ status: "VALID", expiryDate: { $gte: now } });
  else if (p.status === "EXPIRED") and.push({ status: "VALID", expiryDate: { $lt: now } });
  else if (p.status === "EXPIRING") and.push({ status: "VALID", expiryDate: { $gte: now, $lte: new Date(now.getTime() + 30 * 86400_000) } });
  else if (p.status === "SUSPENDED" || p.status === "REVOKED") and.push({ status: p.status });
  if (p.course && isValidObjectId(p.course)) and.push({ course: new Types.ObjectId(p.course) });
  if (p.category && isValidObjectId(p.category)) and.push({ course: { $in: await Course.distinct("_id", { category: new Types.ObjectId(p.category) }) } });
  // Location filter narrows within scope; the scope clause above still applies.
  if (p.location && isValidObjectId(p.location)) and.push({ location: new Types.ObjectId(p.location) });
  if (p.company) and.push({ company: { $regex: escapeRegex(p.company.slice(0, 80)), $options: "i" } });
  const from = toDate(p.from || ""), to = toDate(p.to || "");
  if (from || to) and.push({ issueDate: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: new Date(to.getTime() + 86399_999) } : {}) } });
  if (p.q) {
    const r = { $regex: escapeRegex(p.q.slice(0, 80)), $options: "i" };
    const trainees = await Trainee.distinct("_id", { $or: [{ fullName: r }, { idNumber: r }] });
    and.push({ $or: [{ certificateNumber: r }, { company: r }, { trainee: { $in: trainees } }] });
  }
  return { $and: and };
}
