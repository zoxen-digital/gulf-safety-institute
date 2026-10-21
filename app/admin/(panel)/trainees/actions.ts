"use server";
import { guarded, oid, str, type ActionResult } from "@/lib/admin";
import { Trainee } from "@/lib/models";
import { assertTraineeAccess, resolveHomeLocation, traineeSchema } from "@/lib/trainees";
import { cleanupReplacedImages } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

export async function saveTrainee(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("trainees.edit", async (u) => {
    const data = traineeSchema.parse({
      fullName: str(fd, "fullName"), idNumber: str(fd, "idNumber"), nationality: str(fd, "nationality"), dob: str(fd, "dob"),
      phone: str(fd, "phone"), email: str(fd, "email"), company: str(fd, "company"), photoUrl: str(fd, "photoUrl"),
    });
    const homeLocation = resolveHomeLocation(u, str(fd, "homeLocation"));
    const doc = { ...data, dob: data.dob ? new Date(data.dob) : undefined, homeLocation };
    const id = str(fd, "id");
    if (id) {
      const prev = await assertTraineeAccess(u, oid(id));
      await Trainee.updateOne({ _id: prev._id }, { $set: doc });
      await cleanupReplacedImages(prev, data, ["photoUrl"]);
      await logActivity(u, "update", "Trainee", id, { fullName: data.fullName });
      return { ok: true, message: "Trainee updated", id };
    }
    const created = await Trainee.create({ ...doc, createdBy: u.id });
    await logActivity(u, "create", "Trainee", String(created._id), { fullName: data.fullName });
    return { ok: true, message: "Trainee created", id: String(created._id) };
  });
}
