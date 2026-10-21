"use server";
import { z } from "zod";
import { bool, ClientError, guarded, oid, revalidateSite, str, type ActionResult } from "@/lib/admin";
import { Category, Certificate, Course } from "@/lib/models";
import { slugify } from "@/lib/catalog";
import { cleanupReplacedImages, deleteStoredUploadByUrl } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  name: z.string().min(2, "Required").max(200),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "Lowercase letters, digits and dashes"),
  shortDescription: z.string().max(400),
  description: z.string().max(6000),
  whoShouldAttend: z.string().max(3000),
  duration: z.string().max(80),
  defaultValidityMonths: z.coerce.number().int().min(1, "At least 1 month").max(120),
  deliveryMode: z.string().max(120),
  imageUrl: z.string().max(300),
  showOnWebsite: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export async function saveCourse(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("catalog.manage", async (u) => {
    const name = str(fd, "name");
    const data = schema.parse({
      name, slug: str(fd, "slug") || slugify(name), shortDescription: str(fd, "shortDescription"), description: str(fd, "description", 6000),
      whoShouldAttend: str(fd, "whoShouldAttend", 3000), duration: str(fd, "duration"), defaultValidityMonths: str(fd, "defaultValidityMonths") || "24",
      deliveryMode: str(fd, "deliveryMode"), imageUrl: str(fd, "imageUrl"), showOnWebsite: bool(fd, "showOnWebsite"), isActive: bool(fd, "isActive"),
      sortOrder: str(fd, "sortOrder") || "0",
    });
    const category = oid(str(fd, "category"));
    if (!(await Category.exists({ _id: category }))) throw new ClientError("Choose a valid category");
    const id = str(fd, "id");
    let before: Record<string, unknown> = {};
    let doc;
    if (id) {
      const prev = await Course.findById(oid(id)).lean();
      if (!prev) throw new ClientError("Course not found");
      before = prev;
      doc = await Course.findByIdAndUpdate(prev._id, { ...data, category }, { new: true, runValidators: true });
    } else doc = await Course.create({ ...data, category });
    await cleanupReplacedImages(before, data, ["imageUrl"]);
    await logActivity(u, id ? "update" : "create", "Course", String(doc!._id), { name: data.name });
    revalidateSite();
    return { ok: true, message: "Course saved", id: String(doc!._id) };
  });
}

export async function deleteCourse(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("catalog.manage", async (u) => {
    const _id = oid(str(fd, "id"));
    const n = await Certificate.countDocuments({ course: _id });
    if (n) throw new ClientError(`${n} certificate(s) reference this course. Hide it from the website or deactivate it instead.`);
    const doc = await Course.findByIdAndDelete(_id).lean();
    if (!doc) throw new ClientError("Course not found");
    await deleteStoredUploadByUrl(doc.imageUrl);
    await logActivity(u, "delete", "Course", String(_id), { name: doc.name });
    revalidateSite();
    return { ok: true, message: "Course deleted" };
  });
}
