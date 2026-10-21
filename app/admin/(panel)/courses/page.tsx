import Link from "next/link";
import { isValidObjectId, Types } from "mongoose";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Category, Course } from "@/lib/models";
import { escapeRegex, listParams } from "@/lib/admin";
import { Badge, Empty, FilterBar, FilterSelect, PageHeader, Pagination, Panel, Table, td, th } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/Form";
import { CourseEditor, type CourseForm } from "./Editor";
import { deleteCourse } from "./actions";

export const metadata = { title: "Courses" };
type SP = Record<string, string | undefined>;

export default async function CoursesAdmin({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser("catalog.manage");
  await connectDb();
  const sp = await searchParams;
  const p = listParams(sp, "sortOrder");
  const cats = await Category.find().sort({ sortOrder: 1 }).lean();
  const filter: Record<string, unknown> = {};
  if (p.q) filter.name = { $regex: escapeRegex(p.q), $options: "i" };
  if (sp.category && isValidObjectId(sp.category)) filter.category = new Types.ObjectId(sp.category);
  const [list, total] = await Promise.all([
    Course.find(filter).sort({ category: 1, sortOrder: 1, name: 1 }).skip((p.page - 1) * p.perPage).limit(p.perPage).lean(),
    Course.countDocuments(filter),
  ]);
  const catName = (id: unknown) => cats.find((c) => String(c._id) === String(id));
  const catOpts = cats.map((c) => ({ value: String(c._id), label: `${c.code}. ${c.shortName || c.name}` }));

  let form: CourseForm | null = null;
  if (sp.edit && isValidObjectId(sp.edit)) {
    const e = await Course.findById(sp.edit).lean();
    if (e) form = { id: String(e._id), category: String(e.category), name: e.name, slug: e.slug, shortDescription: e.shortDescription, description: e.description, whoShouldAttend: e.whoShouldAttend, duration: e.duration, defaultValidityMonths: e.defaultValidityMonths, deliveryMode: e.deliveryMode, imageUrl: e.imageUrl, showOnWebsite: e.showOnWebsite, isActive: e.isActive, sortOrder: e.sortOrder };
  } else if (sp.new) form = { category: sp.category || "", name: "", slug: "", shortDescription: "", description: "", whoShouldAttend: "", duration: "", defaultValidityMonths: 24, deliveryMode: "Classroom & practical assessment", imageUrl: "", showOnWebsite: true, isActive: true, sortOrder: 0 };

  const params = { q: p.q, category: sp.category || "" };
  return (
    <>
      <PageHeader title="Courses" description={`${total} course(s)`} actions={!form && <>
        <a href="/api/admin/export/courses" className="btn-outline"><Download className="h-4 w-4" aria-hidden /> Export</a>
        <Link href="?new=1" className="btn-gold"><Plus className="h-4 w-4" aria-hidden /> Add course</Link>
      </>} />
      {form && <Panel title={form.id ? `Edit ${form.name}` : "New course"} className="mb-6"><CourseEditor key={form.id || "new"} v={form} categories={catOpts} /></Panel>}
      <Panel>
        <FilterBar q={p.q} placeholder="Search courses"><FilterSelect name="category" label="Category" value={sp.category || ""} options={catOpts} /></FilterBar>
        {list.length === 0 ? <Empty title="No courses found" /> : (
          <Table caption="Courses">
            <thead className="bg-slate-50"><tr><th className={th}>Course</th><th className={th}>Category</th><th className={th}>Validity</th><th className={th}>Website</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {list.map((c) => {
                const cat = catName(c.category);
                return (
                  <tr key={String(c._id)}>
                    <td className={td}><p className="font-semibold">{c.name}</p><p className="text-xs text-muted">{c.slug}</p></td>
                    <td className={td}><span className="font-bold text-gold">{cat?.code}</span> {cat?.shortName}</td>
                    <td className={td}>{c.defaultValidityMonths} mo</td>
                    <td className={td}><div className="flex gap-1.5">{c.showOnWebsite ? <Badge value="ACTIVE" label="Visible" /> : <Badge value="INACTIVE" label="Hidden" />}{!c.isActive && <Badge value="INACTIVE" />}</div></td>
                    <td className={`${td} text-right`}><div className="flex justify-end gap-2">
                      <Link href={`?edit=${c._id}`} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</Link>
                      <ConfirmAction action={deleteCourse} fields={{ id: String(c._id) }} danger className="btn-outline btn-sm text-danger" label={<Trash2 className="h-3.5 w-3.5" aria-label="Delete" />} confirmText={`Delete "${c.name}"? Courses used by certificates cannot be deleted.`} />
                    </div></td>
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
