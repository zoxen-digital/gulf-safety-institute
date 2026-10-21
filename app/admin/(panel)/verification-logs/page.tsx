import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { VerificationLog } from "@/lib/models";
import { escapeRegex, listParams, toDate } from "@/lib/admin";
import { Badge, Empty, FilterBar, FilterSelect, PageHeader, Pagination, Panel, Table, td, th } from "@/components/admin/ui";

export const metadata = { title: "Verification Logs" };
const RESULTS = ["VALID", "EXPIRED", "SUSPENDED", "REVOKED", "NOT_FOUND"];

export default async function VerificationLogs({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("logs.verification");
  await connectDb();
  const sp = await searchParams;
  const p = listParams(sp);
  const f: Record<string, unknown> = {};
  if (p.q) f.searchedNumber = { $regex: escapeRegex(p.q.toUpperCase()), $options: "i" };
  if (sp.result && RESULTS.includes(sp.result)) f.result = sp.result;
  const from = toDate(sp.from || ""), to = toDate(sp.to || "");
  if (from || to) f.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: new Date(to.getTime() + 86399_999) } : {}) };
  const [list, total] = await Promise.all([VerificationLog.find(f).sort({ createdAt: -1 }).skip((p.page - 1) * p.perPage).limit(p.perPage).lean(), VerificationLog.countDocuments(f)]);
  return (
    <>
      <PageHeader title="Verification logs" description="Public certificate searches. Client IDs are salted hashes, not IP addresses." actions={<a href={`/api/admin/export/verification-logs${sp.result ? `?result=${sp.result}` : ""}`} className="btn-outline"><Download className="h-4 w-4" aria-hidden /> Export</a>} />
      <Panel>
        <FilterBar q={p.q} placeholder="Searched certificate number">
          <FilterSelect name="result" label="Result" value={sp.result || ""} options={RESULTS.map((r) => ({ value: r, label: r.replace("_", " ") }))} />
          <div><label htmlFor="flt-from" className="mb-1 block text-xs font-medium text-muted">From</label><input id="flt-from" type="date" name="from" defaultValue={sp.from || ""} className="input py-2.5" /></div>
          <div><label htmlFor="flt-to" className="mb-1 block text-xs font-medium text-muted">To</label><input id="flt-to" type="date" name="to" defaultValue={sp.to || ""} className="input py-2.5" /></div>
        </FilterBar>
        {list.length === 0 ? <Empty title="No searches found" /> : (
          <Table caption="Verification logs">
            <thead className="bg-slate-50"><tr><th className={th}>Time (KSA)</th><th className={th}>Searched number</th><th className={th}>Result</th><th className={th}>Client</th><th className={th}>Browser</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((l) => (
                <tr key={String(l._id)}>
                  <td className={`${td} whitespace-nowrap text-xs`}>{new Date(l.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Riyadh" })}</td>
                  <td className={`${td} font-mono text-xs font-semibold`}>{l.searchedNumber}</td>
                  <td className={td}><Badge value={l.result} /></td>
                  <td className={`${td} font-mono text-[11px] text-muted`}>{l.clientId?.slice(0, 10)}</td>
                  <td className={`${td} max-w-[280px] truncate text-[11px] text-muted`} title={l.userAgent || ""}>{l.userAgent}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={p.page} total={total} perPage={p.perPage} params={{ q: p.q, result: sp.result || "", from: sp.from || "", to: sp.to || "" }} />
      </Panel>
    </>
  );
}
