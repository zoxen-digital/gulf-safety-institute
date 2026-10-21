import Link from "next/link";
import { Plus, Pencil, Star, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Location } from "@/lib/models";
import { isValidObjectId } from "mongoose";
import { Badge, Empty, PageHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/Form";
import { SafeImage } from "@/components/SafeImage";
import { LocationEditor, type LocationForm } from "./Editor";
import { deleteLocation } from "./actions";

export const metadata = { title: "Locations" };

const EMPTY: LocationForm = { name: "", label: "", city: "", country: "Saudi Arabia", description: "", address: "", phone: "", email: "", mapUrl: "", imageUrl: "", isHeadOffice: false, isActive: true, sortOrder: 0 };

export default async function LocationsAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  await requireUser("locations.manage");
  await connectDb();
  const sp = await searchParams;
  const list = await Location.find().sort({ sortOrder: 1, name: 1 }).lean();
  const editing = sp.edit && isValidObjectId(sp.edit) ? list.find((l) => String(l._id) === sp.edit) : null;
  const form: LocationForm | null = editing
    ? { id: String(editing._id), name: editing.name, label: editing.label, city: editing.city, country: editing.country, description: editing.description, address: editing.address, phone: editing.phone, email: editing.email, mapUrl: editing.mapUrl, imageUrl: editing.imageUrl, isHeadOffice: editing.isHeadOffice, isActive: editing.isActive, sortOrder: editing.sortOrder }
    : sp.new ? EMPTY : null;

  return (
    <>
      <PageHeader title="Locations" description="Training centres and offices. Active locations appear on the website and in certificate forms." actions={!form && <Link href="?new=1" className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> Add location</Link>} />
      {form && <Panel title={form.id ? `Edit ${form.name}` : "New location"} className="mb-6"><LocationEditor key={form.id || "new"} v={form} /></Panel>}
      <Panel>
        {list.length === 0 ? (
          <Empty title="No locations yet" text="Add your head office and training centres." action={<Link href="?new=1" className="btn-navy">Add location</Link>} />
        ) : (
          <Table caption="Locations">
            <thead className="bg-slate-50"><tr><th className={th}>Location</th><th className={th}>Country</th><th className={th}>Contact</th><th className={th}>Status</th><th className={th}>Order</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((l) => (
                <tr key={String(l._id)}>
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-slate-100"><SafeImage src={l.imageUrl} alt="" fill sizes="56px" className="object-cover" /></div>
                      <div><p className="flex items-center gap-1.5 font-semibold text-ink">{l.name}{l.isHeadOffice && <Star className="h-3.5 w-3.5 text-gold" aria-label="Head office" />}</p><p className="text-xs text-muted">{l.label}</p></div>
                    </div>
                  </td>
                  <td className={td}>{l.city}, {l.country}</td>
                  <td className={`${td} text-xs text-muted`}>{[l.phone, l.email].filter(Boolean).join(" Â· ") || "-"}</td>
                  <td className={td}><Badge value={l.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                  <td className={td}>{l.sortOrder}</td>
                  <td className={`${td} text-right`}>
                    <div className="flex justify-end gap-2">
                      <Link href={`?edit=${l._id}`} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Link>
                      <ConfirmAction action={deleteLocation} fields={{ id: String(l._id) }} danger label={<><Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete</>} className="btn-outline btn-sm text-danger" confirmText={`Delete "${l.name}"? Locations in use cannot be deleted; deactivate them instead.`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
