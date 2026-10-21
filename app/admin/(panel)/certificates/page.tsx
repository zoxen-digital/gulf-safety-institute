import Link from "next/link";
import { Types } from "mongoose";
import { Download, FileUp, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Category, Certificate, Course, Location, Trainee } from "@/lib/models";
import { fmtDate, listParams } from "@/lib/admin";
import { buildCertificateFilter } from "@/lib/cert-filters";
import { can, locationScope } from "@/lib/permissions";
import { displayStatus } from "@/lib/verify-core";
import { Badge, Empty, FilterBar, FilterSelect, PageHeader, Pagination, Panel, SortLink, Table, td, th } from "@/components/admin/ui";
import { SafeImage } from "@/components/SafeImage";

export const metadata = { title: "Certificates" };
type SP = Record<string, string | undefined>;

export default async function CertificatesAdmin({ searchParams }: { searchParams: Promise<SP> }) {
  const u = await requireUser("certificates.view");
  await connectDb();
  const sp = await searchParams;
  const p = listParams(sp, "issueDate");
  const fp = { q: p.q, status: sp.status, course: sp.course, category: sp.category, location: sp.location, company: sp.company, from: sp.from, to: sp.to };
  const filter = await buildCertificateFilter(u, fp);
  const sortField = ["issueDate", "expiryDate", "certificateNumber", "createdAt"].includes(p.sort) ? p.sort : "issueDate";
  void Trainee;
  const ls = locationScope(u);
  const [list, total, cats, courses, locs] = await Promise.all([
    Certificate.find(filter).sort({ [sortField]: p.dir, _id: -1 }).skip((p.page - 1) * p.perPage).limit(p.perPage)
      .populate("trainee", "fullName idNumber photoUrl").populate("course", "name").populate("location", "name").lean(),
    Certificate.countDocuments(filter),
    Category.find().sort({ sortOrder: 1 }).lean(),
    Course.find().sort({ name: 1 }).select("name").lean(),
    Location.find(ls ? { _id: { $in: ls.map((x) => new Types.ObjectId(x)) } } : {}).sort({ sortOrder: 1 }).lean(),
  ]);
  const params: Record<string, string> = Object.fromEntries(Object.entries({ ...fp, sort: p.sort, dir: p.dir === 1 ? "asc" : "desc" }).map(([k, v]) => [k, v || ""]));
  const exportQs = new URLSearchParams(Object.fromEntries(Object.entries(fp).filter(([, v]) => v)) as Record<string, string>).toString();

  return (
    <>
      <PageHeader title="Certificates" description={`${total} certificate(s)`} actions={<>
        <a href={`/api/admin/export/certificates${exportQs ? `?${exportQs}` : ""}`} className="btn-outline"><Download className="h-4 w-4" aria-hidden /> Export</a>
        {can(u.role, "import") && <Link href="/admin/import" className="btn-outline"><FileUp className="h-4 w-4" aria-hidden /> Import</Link>}
        {can(u.role, "certificates.edit") && <Link href="/admin/certificates/new" className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> Issue certificate</Link>}
      </>} />
      <Panel>
        <FilterBar q={p.q} placeholder="Certificate no., name, ID, company">
          <FilterSelect name="status" label="Status" value={sp.status || ""} options={[{ value: "VALID", label: "Valid" }, { value: "EXPIRING", label: "Expiring (30 days)" }, { value: "EXPIRED", label: "Expired" }, { value: "SUSPENDED", label: "Suspended" }, { value: "REVOKED", label: "Revoked" }]} />
          <FilterSelect name="category" label="Category" value={sp.category || ""} options={cats.map((c) => ({ value: String(c._id), label: `${c.code}. ${c.shortName || c.name}` }))} />
          <FilterSelect name="course" label="Course" value={sp.course || ""} options={courses.map((c) => ({ value: String(c._id), label: c.name }))} />
          <FilterSelect name="location" label="Location" value={sp.location || ""} options={locs.map((l) => ({ value: String(l._id), label: l.name }))} />
          <div className="min-w-[140px]"><label htmlFor="flt-company" className="mb-1 block text-xs font-medium text-muted">Company</label><input id="flt-company" name="company" defaultValue={sp.company || ""} className="input py-2.5" /></div>
          <div><label htmlFor="flt-from" className="mb-1 block text-xs font-medium text-muted">Issued from</label><input id="flt-from" name="from" type="date" defaultValue={sp.from || ""} className="input py-2.5" /></div>
          <div><label htmlFor="flt-to" className="mb-1 block text-xs font-medium text-muted">Issued to</label><input id="flt-to" name="to" type="date" defaultValue={sp.to || ""} className="input py-2.5" /></div>
        </FilterBar>
        {list.length === 0 ? (
          <Empty title="No certificates found" text="Adjust the filters or issue a new certificate." />
        ) : (
          <Table caption="Certificates">
            <thead className="bg-slate-50"><tr>
              <th className={th}><SortLink field="certificateNumber" label="Cert No." sort={sortField} dir={p.dir} params={params} /></th>
              <th className={th}>Trainee</th><th className={th}>Course</th><th className={th}>Company</th><th className={th}>Location</th>
              <th className={th}><SortLink field="issueDate" label="Issued" sort={sortField} dir={p.dir} params={params} /></th>
              <th className={th}><SortLink field="expiryDate" label="Expires" sort={sortField} dir={p.dir} params={params} /></th>
              <th className={th}>Status</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c) => {
                const t = c.trainee as unknown as { fullName: string; idNumber: string; photoUrl: string } | null;
                const co = c.course as unknown as { name: string } | null;
                const lo = c.location as unknown as { name: string } | null;
                return (
                  <tr key={String(c._id)} className="hover:bg-slate-50">
                    <td className={td}><Link href={`/admin/certificates/${c._id}`} className="font-mono text-xs font-bold text-navy hover:underline">{c.certificateNumber}</Link>{c.isDemo && <span className="ml-1.5"><Badge value="DEMO" /></span>}</td>
                    <td className={td}><div className="flex items-center gap-2.5"><span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100"><SafeImage src={t?.photoUrl} alt="" fill sizes="32px" className="object-cover" /></span><div><p className="font-medium">{t?.fullName}</p><p className="font-mono text-[11px] text-muted">{t?.idNumber}</p></div></div></td>
                    <td className={`${td} max-w-[220px]`}><p className="line-clamp-2">{co?.name}</p></td>
                    <td className={td}>{c.company || "-"}</td>
                    <td className={td}>{lo?.name}</td>
                    <td className={`${td} whitespace-nowrap`}>{fmtDate(c.issueDate)}</td>
                    <td className={`${td} whitespace-nowrap`}>{fmtDate(c.expiryDate)}</td>
                    <td className={td}><Badge value={displayStatus(c.status, c.expiryDate)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        <Pagination page={p.page} total={total} perPage={p.perPage} params={params} />
      </Panel>
    </>
  );
}
