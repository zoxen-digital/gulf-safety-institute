import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Category, Course } from "@/lib/models";
import { Badge, Empty, PageHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/Form";
import { SafeImage } from "@/components/SafeImage";
import { CategoryEditor, type CategoryForm } from "./Editor";
import { deleteCategory } from "./actions";

export const metadata = { title: "Categories" };

export default async function CategoriesAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; new?: string }> }) {
  await requireUser("catalog.manage");
  await connectDb();
  const sp = await searchParams;
  const [list, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1 }).lean(),
    Course.aggregate<{ _id: unknown; n: number }>([{ $group: { _id: "$category", n: { $sum: 1 } } }]),
  ]);
  const count = (id: unknown) => counts.find((c) => String(c._id) === String(id))?.n || 0;
  const e = sp.edit && isValidObjectId(sp.edit) ? list.find((c) => String(c._id) === sp.edit) : null;
  const form: CategoryForm | null = e
    ? { id: String(e._id), code: e.code, name: e.name, shortName: e.shortName, slug: e.slug, description: e.description, imageUrl: e.imageUrl, isActive: e.isActive, sortOrder: e.sortOrder }
    : sp.new ? { code: "", name: "", shortName: "", slug: "", description: "", imageUrl: "", isActive: true, sortOrder: list.length + 1 } : null;
  return (
    <>
      <PageHeader title="Categories" description="Training categories shown on the homepage, menus and services pages." actions={!form && <Link href="?new=1" className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> Add category</Link>} />
      {form && <Panel title={form.id ? `Edit ${form.name}` : "New category"} className="mb-6"><CategoryEditor key={form.id || "new"} v={form} /></Panel>}
      <Panel>
        {list.length === 0 ? <Empty title="No categories" text="Run the seed script or add categories here." /> : (
          <Table caption="Categories">
            <thead className="bg-slate-50"><tr><th className={th}>Code</th><th className={th}>Category</th><th className={th}>Courses</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c) => (
                <tr key={String(c._id)}>
                  <td className={`${td} font-heading text-lg font-extrabold text-gold`}>{c.code}</td>
                  <td className={td}><div className="flex items-center gap-3"><div className="relative h-10 w-14 shrink-0 overflow-hidden rounded bg-slate-100"><SafeImage src={c.imageUrl} alt="" fill sizes="56px" className="object-cover" /></div><div><p className="font-semibold">{c.name}</p><p className="text-xs text-muted">/services/{c.slug}</p></div></div></td>
                  <td className={td}><Link className="text-navy underline" href={`/admin/courses?category=${c._id}`}>{count(c._id)}</Link></td>
                  <td className={td}><Badge value={c.isActive ? "ACTIVE" : "INACTIVE"} /></td>
                  <td className={`${td} text-right`}><div className="flex justify-end gap-2">
                    <Link href={`?edit=${c._id}`} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Link>
                    <ConfirmAction action={deleteCategory} fields={{ id: String(c._id) }} danger className="btn-outline btn-sm text-danger" label={<><Trash2 className="h-3.5 w-3.5" aria-hidden /> Delete</>} confirmText={`Delete "${c.name}"? Categories with courses cannot be deleted.`} />
                  </div></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
