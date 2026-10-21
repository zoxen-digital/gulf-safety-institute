import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import QRCode from "qrcode";
import { Ban, CheckCircle2, Download, ExternalLink, IdCard, PauseCircle, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Certificate } from "@/lib/models";
import { fmtDate } from "@/lib/admin";
import { loadCertificate } from "@/lib/certificates";
import { verifyUrl } from "@/lib/pdf";
import { can, canAccessLocation } from "@/lib/permissions";
import { displayStatus } from "@/lib/verify-core";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/Form";
import { CopyButton } from "@/components/admin/CopyButton";
import { SafeImage } from "@/components/SafeImage";
import { changeCertificateStatus, deleteCertificate } from "../actions";

export const metadata = { title: "Certificate" };

export default async function CertificateDetail({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser("certificates.view");
  await connectDb();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  const rec = await loadCertificate({ _id: id });
  if (!rec || !canAccessLocation(u, rec.locationId)) notFound();
  const raw = await Certificate.findById(id).select("notes revokeReason createdAt updatedAt trainee").lean();
  const status = displayStatus(rec.status, rec.expiryDate);
  const url = verifyUrl(rec.certificateNumber);
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 240, color: { dark: "#0B1A33", light: "#FFFFFF" } });
  const rows: [string, string][] = [
    ["Trainee", rec.trainee.fullName], ["ID / Iqama / Passport", rec.trainee.idNumber], ["Nationality", rec.trainee.nationality || ""],
    ["Course", rec.course.name], ["Category", rec.course.categoryName || ""], ["Level / Class", rec.level || ""],
    ["Company", rec.company || ""], ["Project", rec.project || ""], ["Location", [rec.location?.name, rec.location?.country].filter(Boolean).join(", ")],
    ["Training dates", rec.trainingStartDate ? `${fmtDate(rec.trainingStartDate)} â€“ ${fmtDate(rec.trainingEndDate)}` : ""],
    ["Issue date", fmtDate(rec.issueDate)], ["Expiry date", fmtDate(rec.expiryDate)], ["Trainer", rec.trainer?.name || ""], ["Approved by", rec.approver?.name || ""],
    ["Enrollment No.", rec.enrollmentNumber || ""],
  ];
  const fields = { id };
  return (
    <>
      <PageHeader
        title={rec.certificateNumber}
        description={`Issued ${fmtDate(rec.issueDate)} Â· last updated ${fmtDate(raw?.updatedAt)}`}
        actions={can(u.role, "certificates.edit") && <Link href={`/admin/certificates/${id}/edit`} className="btn-outline"><Pencil className="h-4 w-4" aria-hidden /> Edit</Link>}
      />
      {rec.isDemo && <p className="mb-4 rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white">Demo record for testing. Not a real credential.</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Panel title="Details" actions={<Badge value={status} />}>
          <div className="grid gap-6 p-5 sm:grid-cols-[120px_1fr]">
            <div className="relative aspect-[3/4] w-[120px] overflow-hidden rounded-md bg-slate-100"><SafeImage src={rec.trainee.photoUrl} alt={`Photo of ${rec.trainee.fullName}`} fill sizes="120px" className="object-cover" /></div>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              {rows.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v || "-"}</dd></div>)}
            </dl>
          </div>
          {(raw?.revokeReason || raw?.notes) && (
            <div className="space-y-3 border-t border-slate-100 p-5 text-sm">
              {raw?.revokeReason && <p><span className="font-semibold text-danger">Status reason:</span> {raw.revokeReason}</p>}
              {raw?.notes && <p className="whitespace-pre-line"><span className="font-semibold">Internal notes:</span> {raw.notes}</p>}
            </div>
          )}
          <div className="border-t border-slate-100 p-5"><Link href={`/admin/trainees/${raw?.trainee}`} className="text-sm font-semibold text-navy underline">View trainee profile</Link></div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Verification">
            <div className="space-y-3 p-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt={`QR code linking to ${url}`} width={180} height={180} className="mx-auto rounded border border-slate-200" />
              <p className="break-all text-center text-xs text-muted">{url}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <CopyButton text={url} />
                <a href={url} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm"><ExternalLink className="h-3.5 w-3.5" aria-hidden /> Open</a>
              </div>
            </div>
          </Panel>
          <Panel title="Documents">
            <div className="flex flex-col gap-2 p-5">
              <a href={`/api/admin/certificates/${id}/certificate`} className="btn-navy btn-sm"><Download className="h-4 w-4" aria-hidden /> Certificate PDF</a>
              <a href={`/api/admin/certificates/${id}/id-card`} className="btn-outline btn-sm"><IdCard className="h-4 w-4" aria-hidden /> ID card PDF</a>
              <p className="text-xs text-muted">Admin downloads include the full ID number. Public downloads are masked.</p>
            </div>
          </Panel>
          {can(u.role, "certificates.revoke") && (
            <Panel title="Status">
              <div className="flex flex-col gap-2 p-5">
                {rec.status !== "VALID" && <ConfirmAction action={changeCertificateStatus} fields={{ ...fields, status: "VALID" }} label={<><CheckCircle2 className="h-4 w-4" aria-hidden /> Reinstate</>} className="btn-outline btn-sm" confirmText="Reinstate this certificate? It will verify as valid again (or expired, based on its expiry date)." />}
                {rec.status !== "SUSPENDED" && <ConfirmAction action={changeCertificateStatus} fields={{ ...fields, status: "SUSPENDED" }} label={<><PauseCircle className="h-4 w-4" aria-hidden /> Suspend</>} className="btn-outline btn-sm" danger confirmText="Suspend this certificate? Public verification will show it as suspended and downloads are blocked." reasonField={{ name: "reason", label: "Reason (internal)" }} />}
                {rec.status !== "REVOKED" && <ConfirmAction action={changeCertificateStatus} fields={{ ...fields, status: "REVOKED" }} label={<><Ban className="h-4 w-4" aria-hidden /> Revoke</>} className="btn-outline btn-sm text-danger" danger confirmText="Revoke this certificate? Public verification will show it as revoked and downloads are blocked." reasonField={{ name: "reason", label: "Revoke reason (internal)" }} />}
                {can(u.role, "certificates.delete") && <ConfirmAction action={deleteCertificate} fields={fields} successHref="/admin/certificates" label={<><Trash2 className="h-4 w-4" aria-hidden /> Delete</>} className="btn-outline btn-sm text-danger" danger confirmText="Delete this certificate? It will stop verifying (soft delete; the record is kept for audit)." />}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
