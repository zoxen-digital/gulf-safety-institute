import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { ActivityLog } from "@/lib/models";
import { escapeRegex, listParams } from "@/lib/admin";
import { Empty, FilterBar, FilterSelect, PageHeader, Pagination, Panel, Table, td, th } from "@/components/admin/ui";

export const metadata = { title: "Activity Logs" };
const ENTITIES = ["Certificate", "Trainee", "Course", "Category", "Location", "Trainer", "Inquiry", "User", "Setting", "PageContent", "StoredUpload"];

export default async function ActivityLogs({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser("logs.activity");
  await connectDb();
  const sp = await searchParams;
  const p = listParams(sp);
  const f: Record<string, unknown> = {};
  if (p.q) f.$or = [{ userEmail: { $regex: escapeRegex(p.q), $options: "i" } }, { action: { $regex: escapeRegex(p.q), $options: "i" } }, { entityId: p.q }];
  if (sp.entity && ENTITIES.includes(sp.entity)) f.entity = sp.entity;
  const [list, total] = await Promise.all([ActivityLog.find(f).sort({ createdAt: -1 }).skip((p.page - 1) * p.perPage).limit(p.perPage).lean(), ActivityLog.countDocuments(f)]);
  return (
    <>
      <PageHeader title="Activity logs" description="Every admin change, login, import, export and download." />
      <Panel>
        <FilterBar q={p.q} placeholder="User email, action or record id"><FilterSelect name="entity" label="Record type" value={sp.entity || ""} options={ENTITIES.map((e) => ({ value: e, label: e }))} /></FilterBar>
        {list.length === 0 ? <Empty title="No activity found" /> : (
          <Table caption="Activity logs">
            <thead className="bg-slate-50"><tr><th className={th}>Time</th><th className={th}>User</th><th className={th}>Action</th><th className={th}>Record</th><th className={th}>Details</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((l) => (
                <tr key={String(l._id)}>
                  <td className={`${td} whitespace-nowrap text-xs`}>{new Date(l.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Riyadh" })}</td>
                  <td className={`${td} text-xs`}>{l.userEmail || "-"}</td>
                  <td className={td}><span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold">{l.action}</span></td>
                  <td className={`${td} text-xs`}>{l.entity}<p className="font-mono text-[11px] text-muted">{l.entityId}</p></td>
                  <td className={`${td} max-w-[320px] truncate font-mono text-[11px] text-muted`} title={l.details ? JSON.stringify(l.details) : ""}>{l.details ? JSON.stringify(l.details) : ""}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={p.page} total={total} perPage={p.perPage} params={{ q: p.q, entity: sp.entity || "" }} />
      </Panel>
    </>
  );
}
