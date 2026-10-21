"use server";
import { z } from "zod";
import { bool, ClientError, guarded, oid, str, type ActionResult } from "@/lib/admin";
import { Certificate, Trainer } from "@/lib/models";
import { canAccessLocation, locationScope } from "@/lib/permissions";
import { cleanupReplacedImages, deleteStoredUploadByUrl } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  name: z.string().min(2, "Required").max(120),
  designation: z.string().max(120),
  type: z.enum(["TRAINER", "APPROVER"]),
  signatureUrl: z.string().max(300),
  isActive: z.boolean(),
});

export async function saveTrainer(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("trainers.manage", async (u) => {
    const data = schema.parse({ name: str(fd, "name"), designation: str(fd, "designation"), type: str(fd, "type"), signatureUrl: str(fd, "signatureUrl"), isActive: bool(fd, "isActive") });
    const loc = str(fd, "location");
    const location = loc ? oid(loc) : null;
    // Scoped managers must attach trainers to one of their own locations.
    if (locationScope(u) !== null && !canAccessLocation(u, location ? String(location) : null)) throw new ClientError("Choose one of your assigned locations");
    const id = str(fd, "id");
    let before: Record<string, unknown> = {};
    let doc;
    if (id) {
      const prev = await Trainer.findById(oid(id)).lean();
      if (!prev) throw new ClientError("Not found");
      if (locationScope(u) !== null && !canAccessLocation(u, prev.location ? String(prev.location) : null)) throw new ClientError("You cannot edit this record");
      before = prev;
      doc = await Trainer.findByIdAndUpdate(prev._id, { ...data, location }, { new: true });
    } else doc = await Trainer.create({ ...data, location });
    await cleanupReplacedImages(before, data, ["signatureUrl"]);
    await logActivity(u, id ? "update" : "create", "Trainer", String(doc!._id), { name: data.name, type: data.type });
    return { ok: true, message: "Saved", id: String(doc!._id) };
  });
}

export async function deleteTrainer(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("trainers.manage", async (u) => {
    const _id = oid(str(fd, "id"));
    const prev = await Trainer.findById(_id).lean();
    if (!prev) throw new ClientError("Not found");
    if (locationScope(u) !== null && !canAccessLocation(u, prev.location ? String(prev.location) : null)) throw new ClientError("You cannot delete this record");
    const n = await Certificate.countDocuments({ $or: [{ trainer: _id }, { approver: _id }] });
    if (n) throw new ClientError(`Used on ${n} certificate(s). Deactivate instead so existing certificates keep their signatures.`);
    await Trainer.deleteOne({ _id });
    await deleteStoredUploadByUrl(prev.signatureUrl);
    await logActivity(u, "delete", "Trainer", String(_id), { name: prev.name });
    return { ok: true, message: "Deleted" };
  });
}
