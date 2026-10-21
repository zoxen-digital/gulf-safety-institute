import { isValidObjectId } from "mongoose";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Trainee } from "@/lib/models";
import { traineeScope } from "@/lib/admin";
import { certificateFormOptions } from "@/lib/cert-options";
import { locationScope } from "@/lib/permissions";
import { PageHeader } from "@/components/admin/ui";
import { CertificateForm } from "../CertificateForm";

export const metadata = { title: "Issue certificate" };

export default async function NewCertificate({ searchParams }: { searchParams: Promise<{ trainee?: string }> }) {
  const u = await requireUser("certificates.edit");
  await connectDb();
  const sp = await searchParams;
  const opts = await certificateFormOptions(u);
  const t = sp.trainee && isValidObjectId(sp.trainee) ? await Trainee.findOne({ _id: sp.trainee, ...(await traineeScope(u)) }).lean() : null;
  const ls = locationScope(u);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <PageHeader title="Issue certificate" description="Create a certificate. The number is generated automatically unless you enter one." />
      {opts.locations.length === 0 ? (
        <p className="rounded-md bg-warning/10 p-4 text-sm text-ink">No active locations are available to you. Ask a Super Admin to add a location or assign you to one.</p>
      ) : (
        <CertificateForm
          {...opts}
          v={{
            certificateNumber: "", trainee: t ? { id: String(t._id), label: `${t.fullName} · ${t.idNumber}` } : undefined, course: "",
            location: ls?.length === 1 ? ls[0] : opts.locations.length === 1 ? opts.locations[0].value : "", trainer: "", approver: "",
            level: "", company: t?.company || "", project: "", enrollmentNumber: "", trainingStartDate: "", trainingEndDate: "", issueDate: today, expiryDate: "", notes: "",
          }}
        />
      )}
    </>
  );
}
