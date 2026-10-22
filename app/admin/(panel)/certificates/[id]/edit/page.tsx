import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Certificate, Trainee } from "@/lib/models";
import { certificateScope, dateInput } from "@/lib/admin";
import { certificateFormOptions } from "@/lib/cert-options";
import { PageHeader } from "@/components/admin/ui";
import { CertificateForm } from "../../CertificateForm";

export const metadata = { title: "Edit certificate" };

export default async function EditCertificate({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser("certificates.edit");
  await connectDb();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  const c = await Certificate.findOne({ _id: id, ...certificateScope(u) }).lean();
  if (!c) notFound();
  const t = await Trainee.findById(c.trainee).select("fullName idNumber").lean();
  const opts = await certificateFormOptions(u, { course: c.course ? String(c.course) : undefined, location: String(c.location), trainer: c.trainer ? String(c.trainer) : undefined, approver: c.approver ? String(c.approver) : undefined });
  return (
    <>
      <PageHeader title={`Edit ${c.certificateNumber}`} description="Status changes (suspend, revoke, reinstate) are made from the certificate page." />
      <CertificateForm
        {...opts}
        v={{
          id: String(c._id), certificateNumber: c.certificateNumber, trainee: t ? { id: String(t._id), label: `${t.fullName} · ${t.idNumber}` } : undefined,
          course: c.courseName || opts.courses.find((x) => x.value === String(c.course))?.name || "", location: String(c.location), trainer: c.trainer ? String(c.trainer) : "", approver: c.approver ? String(c.approver) : "",
          level: c.level, company: c.company, project: c.project, enrollmentNumber: c.enrollmentNumber, trainingStartDate: dateInput(c.trainingStartDate),
          trainingEndDate: dateInput(c.trainingEndDate), issueDate: dateInput(c.issueDate), expiryDate: dateInput(c.expiryDate), notes: c.notes,
        }}
      />
    </>
  );
}
