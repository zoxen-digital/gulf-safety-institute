import "server-only";
import { connectDb } from "./db";
import { Category, Certificate, Counter, Course, Location, Setting, Trainee, Trainer } from "./models";
import type { CertificateRecord, StoredStatus } from "./verify-core";
import { DEFAULT_SETTINGS } from "./catalog";

/** Atomic per-year counter → GSI-2026-000001. Safe under concurrent requests. */
export async function nextCertificateNumber(year = new Date().getFullYear()) {
  await connectDb();
  const s = await Setting.findOne({ key: "site" }).lean();
  const prefix = String((s?.value as { certificatePrefix?: string })?.certificatePrefix || DEFAULT_SETTINGS.certificatePrefix)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "") || "GSI";
  for (let i = 0; i < 5; i++) {
    const c = await Counter.findOneAndUpdate({ key: `cert:${prefix}:${year}` }, { $inc: { seq: 1 } }, { upsert: true, new: true }).lean();
    const num = `${prefix}-${year}-${String(c!.seq).padStart(6, "0")}`;
    // A manually entered number may already use this value; skip it.
    if (!(await Certificate.exists({ certificateNumber: num }))) return num;
  }
  throw new Error("Could not allocate a certificate number");
}

type Populated = {
  _id: unknown;
  certificateNumber: string;
  status: StoredStatus;
  issueDate: Date;
  expiryDate: Date;
  level?: string;
  company?: string;
  project?: string;
  enrollmentNumber?: string;
  trainingStartDate?: Date;
  trainingEndDate?: Date;
  isDemo?: boolean;
  location: { _id: unknown; name: string; city: string; country: string } | null;
  trainee: { fullName: string; idNumber: string; nationality?: string; photoUrl?: string; company?: string } | null;
  course: { name: string; category: { name: string; shortName?: string } | null } | null;
  trainer: { name: string; signatureUrl?: string; designation?: string } | null;
  approver: { name: string; signatureUrl?: string; designation?: string } | null;
};

export type FullRecord = CertificateRecord & {
  id: string;
  locationId: string;
  trainerSignature?: string;
  approverSignature?: string;
  trainerDesignation?: string;
  approverDesignation?: string;
};

export async function loadCertificate(filter: { certificateNumber?: string; _id?: string }): Promise<FullRecord | null> {
  await connectDb();
  // Ensure models are registered for populate().
  void [Trainee, Course, Category, Location, Trainer];
  const c = (await Certificate.findOne({ ...filter, deletedAt: null })
    .populate("trainee", "fullName idNumber nationality photoUrl company")
    .populate({ path: "course", select: "name category", populate: { path: "category", select: "name shortName" } })
    .populate("location", "name city country")
    .populate("trainer", "name signatureUrl designation")
    .populate("approver", "name signatureUrl designation")
    .lean()) as unknown as Populated | null;
  if (!c || !c.trainee || !c.course) return null;
  return {
    id: String(c._id),
    locationId: String(c.location?._id || ""),
    certificateNumber: c.certificateNumber,
    status: c.status,
    issueDate: c.issueDate,
    expiryDate: c.expiryDate,
    level: c.level,
    company: c.company,
    project: c.project,
    enrollmentNumber: c.enrollmentNumber,
    trainingStartDate: c.trainingStartDate,
    trainingEndDate: c.trainingEndDate,
    isDemo: c.isDemo,
    trainee: c.trainee,
    course: { name: c.course.name, categoryName: c.course.category?.shortName || c.course.category?.name },
    location: c.location,
    trainer: c.trainer,
    approver: c.approver,
    trainerSignature: c.trainer?.signatureUrl,
    approverSignature: c.approver?.signatureUrl,
    trainerDesignation: c.trainer?.designation,
    approverDesignation: c.approver?.designation,
  };
}
