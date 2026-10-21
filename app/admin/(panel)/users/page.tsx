import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { Pencil, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Location, User } from "@/lib/models";
import { fmtDate } from "@/lib/admin";
import { Badge, PageHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/Form";
import { UserEditor, type UserForm } from "./Editor";
import { toggleUserActive } from "./actions";

export const metadata = { title: "Users" };

export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  const me = await requireUser("users.manage");
  await connectDb();
  const sp = await searchParams;
  const [list, locs] = await Promise.all([User.find().sort({ role: 1, name: 1 }).lean(), Location.find().sort({ sortOrder: 1 }).lean()]);
  const locName = (id: unknown) => locs.find((l) => String(l._id) === String(id))?.name || "?";
  const e = sp.edit && isValidObjectId(sp.edit) ? list.find((x) => String(x._id) === sp.edit) : null;
  const form: UserForm | null = e
    ? { id: String(e._id), name: e.name, email: e.email, role: e.role, locations: (e.locations || []).map(String), isActive: e.isActive }
    : sp.new ? { name: "", email: "", role: "STAFF", locations: [], isActive: true } : null;
  return (
    <>
      <PageHeader title="Users" description="Admin panel accounts, roles and location access." actions={!form && <Link href="?new=1" className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> Add user</Link>} />
      {form && <Panel title={form.id ? `Edit ${form.name}` : "New user"} className="mb-6"><UserEditor key={form.id || "new"} v={form} locations={locs.map((l) => ({ value: String(l._id), label: `${l.name}${l.isActive ? "" : " (inactive)"}` }))} /></Panel>}
      <Panel>
        <Table caption="Users">
          <thead className="bg-slate-50"><tr><th className={th}>User</th><th className={th}>Role</th><th className={th}>Locations</th><th className={th}>Last login</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((x) => (
              <tr key={String(x._id)}>
                <td className={td}><p className="font-semibold">{x.name}{String(x._id) === me.id && <span className="ml-2 text-xs text-muted">(you)</span>}</p><p className="text-xs text-muted">{x.email}</p></td>
                <td className={td}><Badge value={x.role} /></td>
                <td className={`${td} text-xs`}>{x.role === "SUPER_ADMIN" ? "All" : (x.locations || []).map(locName).join(", ") || "-"}</td>
                <td className={`${td} text-xs text-muted`}>{fmtDate(x.lastLoginAt)}</td>
                <td className={td}><Badge value={x.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                <td className={`${td} text-right`}><div className="flex justify-end gap-2">
                  <Link href={`?edit=${x._id}`} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Link>
                  <ConfirmAction action={toggleUserActive} fields={{ id: String(x._id) }} danger={x.isActive} className="btn-outline btn-sm" label={x.isActive ? "Deactivate" : "Activate"} confirmText={x.isActive ? `Deactivate ${x.email}? They will be signed out immediately.` : `Re-activate ${x.email}?`} />
                </div></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
