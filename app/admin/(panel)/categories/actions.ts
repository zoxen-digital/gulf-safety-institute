"use server";
import { z } from "zod";
import { bool, ClientError, guarded, oid, revalidateSite, str, type ActionResult } from "@/lib/admin";
import { Category, Course } from "@/lib/models";
import { slugify } from "@/lib/catalog";
import { cleanupReplacedImages, deleteStoredUploadByUrl } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  code: z.string().min(1, "Required").max(4).regex(/^[A-Z0-9]+$/, "Letters/digits only"),
  name: z.string().min(2, "Required").max(160),
  shortName: z.string().max(80),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/, "Lowercase letters, digits and dashes"),
  description: z.string().max(2000),
  imageUrl: z.string().max(300),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export async function saveCategory(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("catalog.manage", async (u) => {
    const name = str(fd, "name");
    const data = schema.parse({
      code: str(fd, "code").toUpperCase(), name, shortName: str(fd, "shortName"), slug: str(fd, "slug") || slugify(name),
      description: str(fd, "description"), imageUrl: str(fd, "imageUrl"), isActive: bool(fd, "isActive"), sortOrder: str(fd, "sortOrder") || "0",
    });
    const id = str(fd, "id");
    let before: Record<string, unknown> = {};
    let doc;
    if (id) {
      const prev = await Category.findById(oid(id)).lean();
      if (!prev) throw new ClientError("Category not found");
      before = prev;
      doc = await Category.findByIdAndUpdate(prev._id, data, { new: true, runValidators: true });
    } else doc = await Category.create(data);
    await cleanupReplacedImages(before, data, ["imageUrl"]);
    await logActivity(u, id ? "update" : "create", "Category", String(doc!._id), { name: data.name });
    revalidateSite();
    return { ok: true, message: "Category saved", id: String(doc!._id) };
  });
}

export async function deleteCategory(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("catalog.manage", async (u) => {
    const _id = oid(str(fd, "id"));
    const n = await Course.countDocuments({ category: _id });
    if (n) throw new ClientError(`This category has ${n} course(s). Move or delete them first, or deactivate the category.`);
    const doc = await Category.findByIdAndDelete(_id).lean();
    if (!doc) throw new ClientError("Category not found");
    await deleteStoredUploadByUrl(doc.imageUrl);
    await logActivity(u, "delete", "Category", String(_id), { name: doc.name });
    revalidateSite();
    return { ok: true, message: "Category deleted" };
  });
}
