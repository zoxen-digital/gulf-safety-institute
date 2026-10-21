import Link from "next/link";
import { isValidObjectId, Types } from "mongoose";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Location, Trainer } from "@/lib/models";
import { locationScope } from "@/lib/permissions";
import { Badge, Empty, PageHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/Form";
import { SafeImage } from "@/components/SafeImage";
import { TrainerEditor, type TrainerForm } from "./Editor";
import { deleteTrainer } from "./actions";

export const metadata = { title: "Trainers & Approvers" };

export default async function TrainersAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  const u = await requireUser("trainers.manage");
  await connectDb();
  const sp = await searchParams;
  const scope = locationScope(u);
  const scopeIds = scope?.map((x) => new Types.ObjectId(x));
  const filter = scopeIds ? { $or: [{ location: { $in: scopeIds } }, { location: null }] } : {};
  const [list, locs] = await Promise.all([
    Trainer.find(filter).sort({ type: 1, name: 1 }).lean(),
    Location.find(scopeIds ? { _id: { $in: scopeIds } } : {}).sort({ sortOrder: 1 }).lean(),
  ]);
  const locName = (id: unknown) => locs.find((l) => String(l._id) === String(id))?.name;
  const editable = (loc: unknown): boolean => scope === null || Boolean(loc && scope.includes(String(loc)));
  const e = sp.edit && isValidObjectId(sp.edit) ? list.find((t) => String(t._id) === sp.edit && editable(t.location)) : null;
  const form: TrainerForm | null = e
    ? { id: String(e._id), name: e.name, designation: e.designation, type: e.type, signatureUrl: e.signatureUrl, location: e.location ? String(e.location) : "", isActive: e.isActive }
    : sp.new ? { name: "", designation: "", type: "TRAINER", signatureUrl: "", location: "", isActive: true } : null;
  return (
    <>
      <PageHeader title="Trainers & Approvers" description="People whose names and signatures appear on certificates and ID cards." actions={!form && <Link href="?new=1" className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> Add person</Link>} />
      {form && <Panel title={form.id ? `Edit ${form.name}` : "New trainer / approver"} className="mb-6"><TrainerEditor key={form.id || "new"} v={form} allowShared={scope === null} locations={locs.map((l) => ({ value: String(l._id), label: l.name }))} /></Panel>}
      <Panel>
        {list.length === 0 ? <Empty title="No trainers yet" /> : (
          <Table caption="Trainers and approvers">
            <thead className="bg-slate-50"><tr><th className={th}>Name</th><th className={th}>Type</th><th className={th}>Location</th><th className={th}>Signature</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((t) => (
                <tr key={String(t._id)}>
                  <td className={td}><p className="font-semibold">{t.name}</p><p className="text-xs text-muted">{t.designation}</p></td>
                  <td className={td}><Badge value={t.type} /></td>
                  <td className={td}>{t.location ? locName(t.location) || "-" : "All"}</td>
                  <td className={td}>{t.signatureUrl ? <div className="relative h-8 w-24"><SafeImage src={t.signatureUrl} alt="" fill sizes="96px" className="object-contain" /></div> : <span className="text-xs text-muted">None</span>}</td>
                  <td className={td}><Badge value={t.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                  <td className={`${td} text-right`}>{editable(t.location) && <div className="flex justify-end gap-2">
                    <Link href={`?edit=${t._id}`} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Link>
                    <ConfirmAction action={deleteTrainer} fields={{ id: String(t._id) }} danger className="btn-outline btn-sm text-danger" label={<Trash2 className="h-3.5 w-3.5" aria-label="Delete" />} confirmText={`Delete ${t.name}?`} />
                  </div>}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
