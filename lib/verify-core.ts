// Pure verification helpers (no database access) so they can be unit tested.

export type StoredStatus = "VALID" | "SUSPENDED" | "REVOKED";
export type DisplayStatus = "VALID" | "EXPIRED" | "SUSPENDED" | "REVOKED";

export function normalizeCertificateNumber(input: unknown): string {
  if (typeof input !== "string") return "";
  const n = input.trim().toUpperCase().replace(/\s+/g, "");
  return /^[A-Z0-9][A-Z0-9\-/]{1,39}$/.test(n) ? n : "";
}

export function displayStatus(status: StoredStatus, expiryDate: Date, now = new Date()): DisplayStatus {
  if (status !== "VALID") return status;
  return expiryDate.getTime() < now.getTime() ? "EXPIRED" : "VALID";
}

export function maskIdentity(id: string | null | undefined): string {
  const v = (id || "").replace(/\s+/g, "");
  if (!v) return "";
  if (v.length <= 4) return "*".repeat(v.length);
  return v.slice(0, 2) + "*".repeat(Math.max(4, v.length - 4)) + v.slice(-2);
}

export function canPublicDownload(s: DisplayStatus) {
  return s === "VALID" || s === "EXPIRED";
}

export type CertificateRecord = {
  certificateNumber: string;
  status: StoredStatus;
  issueDate: Date;
  expiryDate: Date;
  level?: string;
  company?: string;
  project?: string;
  enrollmentNumber?: string;
  trainingStartDate?: Date | null;
  trainingEndDate?: Date | null;
  isDemo?: boolean;
  trainee: { fullName: string; idNumber: string; nationality?: string; photoUrl?: string; company?: string; dob?: Date; phone?: string; email?: string };
  course: { name: string; categoryName?: string };
  location?: { name?: string; city?: string; country?: string } | null;
  trainer?: { name?: string } | null;
  approver?: { name?: string } | null;
  notes?: string;
  revokeReason?: string;
};

export type PublicResult =
  | { kind: "NOT_FOUND"; searched: string }
  | { kind: "REVOKED" | "SUSPENDED"; certificateNumber: string; fullName: string }
  | {
      kind: "VALID" | "EXPIRED";
      certificateNumber: string;
      fullName: string;
      idDisplay: string;
      nationality: string;
      photoUrl: string;
      employer: string;
      course: string;
      category: string;
      level: string;
      issueDate: string;
      expiryDate: string;
      location: string;
      trainer: string;
      approver: string;
      isDemo: boolean;
    };

const iso = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

/** Explicit allow-listed DTO. Never spread the record into the result. */
export function toPublicResult(rec: CertificateRecord | null, searched: string, now = new Date(), opts: { showFullId?: boolean } = {}): PublicResult {
  if (!rec) return { kind: "NOT_FOUND", searched };
  const s = displayStatus(rec.status, rec.expiryDate, now);
  if (s === "REVOKED" || s === "SUSPENDED") return { kind: s, certificateNumber: rec.certificateNumber, fullName: rec.trainee.fullName };
  return {
    kind: s,
    certificateNumber: rec.certificateNumber,
    fullName: rec.trainee.fullName,
    idDisplay: opts.showFullId ? rec.trainee.idNumber : maskIdentity(rec.trainee.idNumber),
    nationality: rec.trainee.nationality || "",
    photoUrl: rec.trainee.photoUrl || "",
    employer: rec.company || rec.trainee.company || "",
    course: rec.course.name,
    category: rec.course.categoryName || "",
    level: rec.level || "",
    issueDate: iso(rec.issueDate),
    expiryDate: iso(rec.expiryDate),
    location: [rec.location?.city || rec.location?.name, rec.location?.country].filter(Boolean).join(", "),
    trainer: rec.trainer?.name || "",
    approver: rec.approver?.name || "",
    isDemo: Boolean(rec.isDemo),
  };
}
