"use server";
import { z } from "zod";
import { ClientError, escapeRegex, guarded, oid, str, toDate, type ActionResult } from "@/lib/admin";
import { Certificate, Course, Location, Trainee, Trainer } from "@/lib/models";
import { canAccessLocation } from "@/lib/permissions";
import type { SessionUser } from "@/lib/auth";
import { nextCertificateNumber } from "@/lib/certificates";
import { normalizeCertificateNumber } from "@/lib/verify-core";
import { assertTraineeAccess, traineeSchema } from "@/lib/trainees";
import { logActivity } from "@/lib/activity";

const base = z.object({
  level: z.string().max(160),
  company: z.string().max(160),
  project: z.string().max(160),
  enrollmentNumber: z.string().max(60),
  notes: z.string().max(4000),
});

export async function saveCertificate(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("certificates.edit", async (u) => {
    const id = str(fd, "id");
    const f = base.parse({ level: str(fd, "level"), company: str(fd, "company"), project: str(fd, "project"), enrollmentNumber: str(fd, "enrollmentNumber"), notes: str(fd, "notes", 4000) });

    // Location must be one the actor is allowed to use.
    const location = oid(str(fd, "location"));
    if (!canAccessLocation(u, String(location))) throw new ClientError("You cannot issue certificates for that location");
    if (!(await Location.exists({ _id: location }))) throw new ClientError("Location not found");

    // Course is free text; link to the catalog course when the name matches exactly (case-insensitive).
    const courseName = str(fd, "courseName", 200);
    if (courseName.length < 2) return { ok: false, message: "Please correct the highlighted fields.", errors: { courseName: "Enter the course name" } };
    const matched = await Course.findOne({ name: { $regex: `^${escapeRegex(courseName)}$`, $options: "i" } }).select("_id").lean();
    const course = matched?._id;
    const trainerId = str(fd, "trainer"), approverId = str(fd, "approver");
    const trainer = trainerId ? oid(trainerId) : undefined;
    const approver = approverId ? oid(approverId) : undefined;
    if (trainer && !(await Trainer.exists({ _id: trainer, type: "TRAINER" }))) throw new ClientError("Trainer not found");
    if (approver && !(await Trainer.exists({ _id: approver, type: "APPROVER" }))) throw new ClientError("Approver not found");

    const issueDate = toDate(str(fd, "issueDate"));
    const expiryDate = toDate(str(fd, "expiryDate"));
    const errors: Record<string, string> = {};
    if (!issueDate) errors.issueDate = "Required";
    if (!expiryDate) errors.expiryDate = "Required";
    if (issueDate && expiryDate && expiryDate <= issueDate) errors.expiryDate = "Must be after the issue date";
    const trainingStartDate = toDate(str(fd, "trainingStartDate"));
    const trainingEndDate = toDate(str(fd, "trainingEndDate"));
    if (trainingStartDate && trainingEndDate && trainingEndDate < trainingStartDate) errors.trainingEndDate = "Must be on or after the start date";

    // Trainee: existing (scoped) or created inline.
    let trainee;
    if (str(fd, "traineeMode") === "new") {
      const t = traineeSchema.safeParse({
        fullName: str(fd, "t_fullName"), idNumber: str(fd, "t_idNumber"), nationality: str(fd, "t_nationality"), dob: str(fd, "t_dob"),
        phone: str(fd, "t_phone"), email: str(fd, "t_email"), company: str(fd, "t_company") || f.company, photoUrl: str(fd, "t_photoUrl"),
      });
      if (!t.success) for (const i of t.error.issues) errors[`t_${String(i.path[0])}`] ??= i.message;
      else if (await Trainee.exists({ idNumber: t.data.idNumber })) errors.t_idNumber = "A trainee with this ID already exists. Select the existing trainee instead.";
      if (Object.keys(errors).length) return { ok: false, message: "Please correct the highlighted fields.", errors };
      const created = await Trainee.create({ ...t.data!, dob: t.data!.dob ? new Date(t.data!.dob) : undefined, homeLocation: location, createdBy: u.id });
      await logActivity(u, "create", "Trainee", String(created._id), { fullName: created.fullName });
      trainee = created._id;
    } else {
      const tid = str(fd, "trainee");
      if (!tid) errors.trainee = "Select a trainee";
      if (Object.keys(errors).length) return { ok: false, message: "Please correct the highlighted fields.", errors };
      trainee = (await assertTraineeAccess(u, oid(tid)))._id;
    }

    const manual = str(fd, "certificateNumber");
    let certificateNumber = "";
    if (manual) {
      certificateNumber = normalizeCertificateNumber(manual);
      if (!certificateNumber) return { ok: false, message: "Invalid certificate number", errors: { certificateNumber: "Letters, digits and dashes only" } };
    }

    const doc: Record<string, unknown> = { ...f, trainee, course: course ?? null, courseName, location, trainer, approver, issueDate, expiryDate, trainingStartDate, trainingEndDate };

    if (id) {
      const prev = await Certificate.findOne({ _id: oid(id), deletedAt: null }).lean();
      if (!prev || !canAccessLocation(u, String(prev.location))) throw new ClientError("Certificate not found");
      if (certificateNumber && certificateNumber !== prev.certificateNumber) {
        if (await Certificate.exists({ certificateNumber })) return { ok: false, message: "That certificate number is already used", errors: { certificateNumber: "Already in use" } };
        doc.certificateNumber = certificateNumber;
      }
      await Certificate.updateOne({ _id: prev._id }, { $set: doc });
      await logActivity(u, "update", "Certificate", id, { certificateNumber: doc.certificateNumber || prev.certificateNumber });
      return { ok: true, message: "Certificate updated", id };
    }

    if (certificateNumber) {
      if (await Certificate.exists({ certificateNumber })) return { ok: false, message: "That certificate number is already used", errors: { certificateNumber: "Already in use" } };
    } else certificateNumber = await nextCertificateNumber(issueDate!.getUTCFullYear());
    const created = await Certificate.create({ ...doc, certificateNumber, status: "VALID", createdBy: u.id });
    await logActivity(u, "create", "Certificate", String(created._id), { certificateNumber });
    return { ok: true, message: `Certificate ${certificateNumber} issued`, id: String(created._id) };
  });
}

async function scopedCert(u: SessionUser, id: string) {
  const c = await Certificate.findOne({ _id: oid(id), deletedAt: null });
  if (!c || !canAccessLocation(u, String(c.location))) throw new ClientError("Certificate not found");
  return c;
}

export async function changeCertificateStatus(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("certificates.revoke", async (u) => {
    const status = z.enum(["VALID", "SUSPENDED", "REVOKED"]).parse(str(fd, "status"));
    const reason = str(fd, "reason", 1000);
    if (status !== "VALID" && reason.length < 3) throw new ClientError("A reason is required");
    const c = await scopedCert(u, str(fd, "id"));
    c.status = status;
    c.revokeReason = status === "VALID" ? "" : reason;
    await c.save();
    await logActivity(u, status === "VALID" ? "reinstate" : status.toLowerCase(), "Certificate", String(c._id), { certificateNumber: c.certificateNumber, reason });
    return { ok: true, message: `Certificate ${status === "VALID" ? "reinstated" : status.toLowerCase()}` };
  });
}

export async function deleteCertificate(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("certificates.delete", async (u) => {
    const c = await scopedCert(u, str(fd, "id"));
    c.deletedAt = new Date();
    await c.save();
    await logActivity(u, "delete", "Certificate", String(c._id), { certificateNumber: c.certificateNumber });
    return { ok: true, message: "Certificate deleted (soft delete; it will no longer verify)" };
  });
}
