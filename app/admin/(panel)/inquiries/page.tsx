import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { Download, X } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { INQUIRY_STATUSES, Inquiry } from "@/lib/models";
import { INQUIRY_TYPES } from "@/lib/inquiry";
import { escapeRegex, fmtDate, listParams } from "@/lib/admin";
import { Badge, Empty, FilterBar, FilterSelect, PageHeader, Pagination, Panel, Table, td, th } from "@/components/admin/ui";
import { InquiryEditor } from "./InquiryEditor";

export const metadata = { title: "Inquiries" };
type SP = Record<string, string | undefined>;

export default async function InquiriesAdmin({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser("inquiries.manage");
  await connectDb();
  const sp = await searchParams;
  const p = listParams(sp);
  const filter: Record<string, unknown> = {};
  if (p.q) {
    const r = { $regex: escapeRegex(p.q), $options: "i" };
    filter.$or = [{ name: r }, { company: r }, { email: r }, { phone: r }, { courseName: r }];
  }
  if (sp.status && (INQUIRY_STATUSES as readonly string[]).includes(sp.status)) filter.status = sp.status;
  if (sp.type && (INQUIRY_TYPES as readonly string[]).includes(sp.type)) filter.type = sp.type;
  const [list, total] = await Promise.all([
    Inquiry.find(filter).sort({ createdAt: -1 }).skip((p.page - 1) * p.perPage).limit(p.perPage).lean(),
    Inquiry.countDocuments(filter),
  ]);
  const sel = sp.id && isValidObjectId(sp.id) ? await Inquiry.findById(sp.id).lean() : null;
  const params = { q: p.q, status: sp.status || "", type: sp.type || "" };
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v))).toString();

  return (
    <>
      <PageHeader title="Inquiries" description={`${total} inquiry(ies)`} actions={<a href={`/api/admin/export/inquiries?${qs}`} className="btn-outline"><Download className="h-4 w-4" aria-hidden /> Export</a>} />
      {sel && (
        <Panel title={`Inquiry from ${sel.name}`} className="mb-6" actions={<Link href={`?${qs}`} className="text-muted hover:text-ink" aria-label="Close"><X className="h-4 w-4" /></Link>}>
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
            <div>
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {([["Company", sel.company], ["Email", sel.email], ["Phone", sel.phone], ["Country", sel.country], ["Type", sel.type], ["Course", sel.courseName], ["Trainees", sel.traineesCount ? String(sel.traineesCount) : ""], ["Received", fmtDate(sel.createdAt)]] as [string, string][]).map(([k, v]) => (
                  <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v || "-"}</dd></div>
                ))}
              </dl>
              <p className="mt-5 text-xs text-muted">Message</p>
              <p className="mt-1 whitespace-pre-line rounded-md bg-slate-50 p-4 text-sm">{sel.message}</p>
              <div className="mt-4 flex gap-2"><a href={`mailto:${sel.email}`} className="btn-navy btn-sm">Reply by email</a>{sel.phone && <a href={`tel:${sel.phone.replace(/\s/g, "")}`} className="btn-outline btn-sm">Call</a>}</div>
            </div>
            <InquiryEditor key={String(sel._id)} id={String(sel._id)} status={sel.status} notes={sel.notes} />
          </div>
        </Panel>
      )}
      <Panel>
        <FilterBar q={p.q} placeholder="Search name, company, email, course">
          <FilterSelect name="status" label="Status" value={sp.status || ""} options={INQUIRY_STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") }))} />
          <FilterSelect name="type" label="Type" value={sp.type || ""} options={INQUIRY_TYPES.map((t) => ({ value: t, label: t }))} />
        </FilterBar>
        {list.length === 0 ? <Empty title="No inquiries found" /> : (
          <Table caption="Inquiries">
            <thead className="bg-slate-50"><tr><th className={th}>Received</th><th className={th}>From</th><th className={th}>Type / Course</th><th className={th}>Trainees</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((i) => (
                <tr key={String(i._id)} className={sp.id === String(i._id) ? "bg-cream" : "hover:bg-slate-50"}>
                  <td className={`${td} text-xs text-muted`}>{fmtDate(i.createdAt)}</td>
                  <td className={td}><Link href={`?${qs}${qs ? "&" : ""}id=${i._id}`} className="font-semibold text-navy underline-offset-2 hover:underline">{i.name}</Link><p className="text-xs text-muted">{i.company || i.email}</p></td>
                  <td className={td}><p>{i.type}</p><p className="text-xs text-muted">{i.courseName}</p></td>
                  <td className={td}>{i.traineesCount || "-"}</td>
                  <td className={td}><Badge value={i.status} /></td>
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
