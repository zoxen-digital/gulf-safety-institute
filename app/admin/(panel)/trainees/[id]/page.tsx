import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId, Types } from "mongoose";
import { Pencil, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Certificate, Course, Location, Trainee } from "@/lib/models";
import { certificateScope, dateInput, fmtDate, traineeScope } from "@/lib/admin";
import { can, locationScope } from "@/lib/permissions";
import { displayStatus } from "@/lib/verify-core";
import { Badge, Empty, PageHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { SafeImage } from "@/components/SafeImage";
import { TraineeEditor } from "../Editor";

export const metadata = { title: "Trainee" };

export default async function TraineeDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const u = await requireUser("trainees.view");
  await connectDb();
  const { id } = await params;
  const { edit } = await searchParams;
  if (!isValidObjectId(id)) notFound();
  const t = await Trainee.findOne({ _id: id, ...(await traineeScope(u)) }).lean();
  if (!t) notFound();
  void Course;
  const certs = await Certificate.find({ ...certificateScope(u), trainee: t._id }).populate("course", "name").populate("location", "name").sort({ issueDate: -1 }).lean();
  const canEdit = can(u.role, "trainees.edit");
  const ls = locationScope(u);
  const locs = edit && canEdit ? await Location.find(ls ? { _id: { $in: ls.map((x) => new Types.ObjectId(x)) } } : {}).sort({ sortOrder: 1 }).lean() : [];
  const rows: [string, string][] = [
    ["ID / Iqama / Passport", t.idNumber], ["Nationality", t.nationality], ["Date of birth", fmtDate(t.dob)], ["Phone", t.phone], ["Email", t.email], ["Company", t.company],
  ];
  return (
    <>
      <PageHeader title={t.fullName} description="Trainee profile and certificate history" actions={<>
        {canEdit && !edit && <Link href="?edit=1" className="btn-outline"><Pencil className="h-4 w-4" aria-hidden /> Edit</Link>}
        {can(u.role, "certificates.edit") && <Link href={`/admin/certificates/new?trainee=${t._id}`} className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> Issue certificate</Link>}
      </>} />
      {t.isDemo && <p className="mb-4 rounded-md bg-danger px-4 py-2 text-sm font-semibold text-white">Demo record for testing. Not a real trainee.</p>}
      {edit && canEdit ? (
        <Panel title="Edit trainee" className="mb-6">
          <TraineeEditor v={{ id: String(t._id), fullName: t.fullName, idNumber: t.idNumber, nationality: t.nationality, dob: dateInput(t.dob), phone: t.phone, email: t.email, company: t.company, photoUrl: t.photoUrl, homeLocation: t.homeLocation ? String(t.homeLocation) : "" }} locations={locs.map((l) => ({ value: String(l._id), label: l.name }))} requireLocation={ls !== null} />
        </Panel>
      ) : (
        <Panel className="mb-6">
          <div className="grid gap-6 p-5 sm:grid-cols-[140px_1fr]">
            <div className="relative aspect-[3/4] w-[140px] overflow-hidden rounded-md bg-slate-100"><SafeImage src={t.photoUrl} alt={`Photo of ${t.fullName}`} fill sizes="140px" className="object-cover" /></div>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {rows.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v || "-"}</dd></div>)}
            </dl>
          </div>
        </Panel>
      )}
      <Panel title={`Certificates (${certs.length})`}>
        {certs.length === 0 ? <Empty title="No certificates in your locations" /> : (
          <Table caption="Certificates">
            <thead className="bg-slate-50"><tr><th className={th}>Certificate No.</th><th className={th}>Course</th><th className={th}>Location</th><th className={th}>Issued</th><th className={th}>Expires</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {certs.map((c) => {
                const course = c.course as unknown as { name: string } | null;
                const loc = c.location as unknown as { name: string } | null;
                return (
                  <tr key={String(c._id)}>
                    <td className={td}><Link href={`/admin/certificates/${c._id}`} className="font-mono font-semibold text-navy hover:underline">{c.certificateNumber}</Link></td>
                    <td className={td}>{c.courseName || course?.name}</td><td className={td}>{loc?.name}</td>
                    <td className={td}>{fmtDate(c.issueDate)}</td><td className={td}>{fmtDate(c.expiryDate)}</td>
                    <td className={td}><Badge value={displayStatus(c.status, c.expiryDate)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
