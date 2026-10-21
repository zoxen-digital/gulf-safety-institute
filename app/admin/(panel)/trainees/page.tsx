import Link from "next/link";
import { Types } from "mongoose";
import { Download, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Location, Trainee } from "@/lib/models";
import { escapeRegex, listParams, traineeScope } from "@/lib/admin";
import { locationScope } from "@/lib/permissions";
import { Badge, Empty, FilterBar, PageHeader, Pagination, Panel, SortLink, Table, td, th } from "@/components/admin/ui";
import { SafeImage } from "@/components/SafeImage";
import { TraineeEditor } from "./Editor";

export const metadata = { title: "Trainees" };
type SP = Record<string, string | undefined>;

export default async function TraineesAdmin({ searchParams }: { searchParams: Promise<SP> }) {
  const u = await requireUser("trainees.view");
  await connectDb();
  const sp = await searchParams;
  const p = listParams(sp, "createdAt");
  const scope = await traineeScope(u);
  const and: Record<string, unknown>[] = [scope];
  if (p.q) {
    const r = { $regex: escapeRegex(p.q), $options: "i" };
    and.push({ $or: [{ fullName: r }, { idNumber: r }, { company: r }] });
  }
  const filter = { $and: and };
  const sortField = ["fullName", "company", "createdAt"].includes(p.sort) ? p.sort : "createdAt";
  const [list, total] = await Promise.all([
    Trainee.find(filter).sort({ [sortField]: p.dir }).skip((p.page - 1) * p.perPage).limit(p.perPage).lean(),
    Trainee.countDocuments(filter),
  ]);
  const ls = locationScope(u);
  const locs = sp.new ? await Location.find(ls ? { _id: { $in: ls.map((x) => new Types.ObjectId(x)) } } : {}).sort({ sortOrder: 1 }).lean() : [];
  const params = { q: p.q, sort: p.sort, dir: p.dir === 1 ? "asc" : "desc" };
  return (
    <>
      <PageHeader title="Trainees" description={`${total} trainee(s)`} actions={!sp.new && <>
        <a href={`/api/admin/export/trainees${p.q ? `?q=${encodeURIComponent(p.q)}` : ""}`} className="btn-outline"><Download className="h-4 w-4" aria-hidden /> Export</a>
        <Link href="?new=1" className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> Add trainee</Link>
      </>} />
      {sp.new && (
        <Panel title="New trainee" className="mb-6">
          <TraineeEditor v={{ fullName: "", idNumber: "", nationality: "", dob: "", phone: "", email: "", company: "", photoUrl: "", homeLocation: ls?.length === 1 ? ls[0] : "" }} locations={locs.map((l) => ({ value: String(l._id), label: l.name }))} requireLocation={ls !== null} />
        </Panel>
      )}
      <Panel>
        <FilterBar q={p.q} placeholder="Search name, ID number, company" />
        {list.length === 0 ? <Empty title="No trainees found" /> : (
          <Table caption="Trainees">
            <thead className="bg-slate-50"><tr>
              <th className={th}><SortLink field="fullName" label="Trainee" sort={sortField} dir={p.dir} params={params} /></th>
              <th className={th}>ID No.</th><th className={th}>Nationality</th>
              <th className={th}><SortLink field="company" label="Company" sort={sortField} dir={p.dir} params={params} /></th>
              <th className={th}><SortLink field="createdAt" label="Added" sort={sortField} dir={p.dir} params={params} /></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((t) => (
                <tr key={String(t._id)} className="hover:bg-slate-50">
                  <td className={td}><Link href={`/admin/trainees/${t._id}`} className="flex items-center gap-3"><span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100"><SafeImage src={t.photoUrl} alt="" fill sizes="40px" className="object-cover" /></span><span className="font-semibold text-navy">{t.fullName}</span>{t.isDemo && <Badge value="DEMO" />}</Link></td>
                  <td className={`${td} font-mono text-xs`}>{t.idNumber}</td>
                  <td className={td}>{t.nationality || "-"}</td>
                  <td className={td}>{t.company || "-"}</td>
                  <td className={`${td} text-xs text-muted`}>{new Date(t.createdAt).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={p.page} total={total} perPage={p.perPage} params={params} />
      </Panel>
    </>
  );
}
