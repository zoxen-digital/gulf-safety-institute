"use server";
import { z } from "zod";
import { bool, ClientError, guarded, oid, revalidateSite, str, type ActionResult } from "@/lib/admin";
import { Certificate, GCC_COUNTRIES, Location, Trainee, Trainer, User } from "@/lib/models";
import { cleanupReplacedImages, deleteStoredUploadByUrl } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

const schema = z.object({
  name: z.string().min(2, "Required").max(120),
  label: z.string().max(80),
  city: z.string().min(2, "Required").max(80),
  country: z.enum(GCC_COUNTRIES),
  description: z.string().max(1000),
  address: z.string().max(300),
  phone: z.string().max(40),
  email: z.union([z.literal(""), z.string().email("Invalid email")]),
  mapUrl: z.union([z.literal(""), z.string().url("Must be a full URL").refine((u) => /^https:\/\//.test(u), "Must start with https://")]),
  imageUrl: z.string().max(300),
  isHeadOffice: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export async function saveLocation(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("locations.manage", async (u) => {
    const data = schema.parse({
      name: str(fd, "name"), label: str(fd, "label"), city: str(fd, "city"), country: str(fd, "country"), description: str(fd, "description"),
      address: str(fd, "address"), phone: str(fd, "phone"), email: str(fd, "email"), mapUrl: str(fd, "mapUrl"), imageUrl: str(fd, "imageUrl"),
      isHeadOffice: bool(fd, "isHeadOffice"), isActive: bool(fd, "isActive"), sortOrder: str(fd, "sortOrder") || "0",
    });
    const id = str(fd, "id");
    let before: Record<string, unknown> = {};
    let doc;
    if (id) {
      const prev = await Location.findById(oid(id)).lean();
      if (!prev) throw new ClientError("Location not found");
      before = prev;
      doc = await Location.findByIdAndUpdate(prev._id, data, { new: true });
    } else doc = await Location.create(data);
    if (data.isHeadOffice) await Location.updateMany({ _id: { $ne: doc!._id } }, { isHeadOffice: false });
    await cleanupReplacedImages(before, data, ["imageUrl"]);
    await logActivity(u, id ? "update" : "create", "Location", String(doc!._id), { name: data.name });
    revalidateSite();
    return { ok: true, message: id ? "Location updated" : "Location created", id: String(doc!._id) };
  });
}

export async function deleteLocation(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("locations.manage", async (u) => {
    const _id = oid(str(fd, "id"));
    const [certs, trainees, trainers, users] = await Promise.all([
      Certificate.countDocuments({ location: _id }),
      Trainee.countDocuments({ homeLocation: _id }),
      Trainer.countDocuments({ location: _id }),
      User.countDocuments({ locations: _id }),
    ]);
    if (certs + trainees + trainers + users > 0)
      throw new ClientError(`This location is used by ${certs} certificate(s), ${trainees} trainee(s), ${trainers} trainer(s) and ${users} user(s). Deactivate it instead.`);
    const doc = await Location.findByIdAndDelete(_id).lean();
    if (!doc) throw new ClientError("Location not found");
    await deleteStoredUploadByUrl(doc.imageUrl);
    await logActivity(u, "delete", "Location", String(_id), { name: doc.name });
    revalidateSite();
    return { ok: true, message: "Location deleted" };
  });
}
