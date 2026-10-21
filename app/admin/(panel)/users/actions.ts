"use server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { bool, ClientError, guarded, oid, str, type ActionResult } from "@/lib/admin";
import { Location, ROLES, User } from "@/lib/models";
import { logActivity } from "@/lib/activity";

const pw = z.string().min(10, "At least 10 characters").max(200).regex(/[A-Za-z]/, "Include a letter").regex(/\d/, "Include a number");

const schema = z.object({
  name: z.string().min(2, "Required").max(120),
  email: z.string().email("Invalid email").max(160),
  role: z.enum(ROLES),
  isActive: z.boolean(),
});

async function activeSuperAdminsExcluding(id: unknown) {
  return User.countDocuments({ role: "SUPER_ADMIN", isActive: true, _id: { $ne: id } });
}

export async function saveUser(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("users.manage", async (u) => {
    const data = schema.parse({ name: str(fd, "name"), email: str(fd, "email").toLowerCase(), role: str(fd, "role"), isActive: bool(fd, "isActive") });
    const locations = fd.getAll("locations").map((x) => oid(String(x)));
    if (locations.length && (await Location.countDocuments({ _id: { $in: locations } })) !== locations.length) throw new ClientError("Invalid location selection");
    if (data.role !== "SUPER_ADMIN" && locations.length === 0) throw new ClientError("Managers and staff must be assigned at least one location");
    const password = str(fd, "password", 200);
    const id = str(fd, "id");

    if (!id) {
      const hash = await bcrypt.hash(pw.parse(password), 12);
      const doc = await User.create({ ...data, locations, passwordHash: hash });
      await logActivity(u, "create", "User", String(doc._id), { email: data.email, role: data.role });
      return { ok: true, message: "User created", id: String(doc._id) };
    }

    const prev = await User.findById(oid(id)).lean();
    if (!prev) throw new ClientError("User not found");
    const demoting = prev.role === "SUPER_ADMIN" && (data.role !== "SUPER_ADMIN" || !data.isActive);
    if (demoting && (await activeSuperAdminsExcluding(prev._id)) === 0) throw new ClientError("You cannot demote or deactivate the last active Super Admin");
    const update: Record<string, unknown> = { ...data, locations };
    // Any change to access invalidates existing sessions for that user.
    const accessChanged = prev.role !== data.role || prev.isActive !== data.isActive || String(prev.locations) !== String(locations) || Boolean(password);
    if (password) update.passwordHash = await bcrypt.hash(pw.parse(password), 12);
    await User.updateOne({ _id: prev._id }, { $set: update, ...(accessChanged ? { $inc: { sessionVersion: 1 } } : {}) });
    await logActivity(u, "update", "User", id, { email: data.email, role: data.role, isActive: data.isActive, passwordChanged: Boolean(password) });
    return { ok: true, message: "User updated", id };
  });
}

export async function toggleUserActive(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("users.manage", async (u) => {
    const prev = await User.findById(oid(str(fd, "id"))).lean();
    if (!prev) throw new ClientError("User not found");
    if (prev.isActive && prev.role === "SUPER_ADMIN" && (await activeSuperAdminsExcluding(prev._id)) === 0) throw new ClientError("You cannot deactivate the last active Super Admin");
    await User.updateOne({ _id: prev._id }, { $set: { isActive: !prev.isActive }, $inc: { sessionVersion: 1 } });
    await logActivity(u, prev.isActive ? "deactivate" : "activate", "User", String(prev._id), { email: prev.email });
    return { ok: true, message: prev.isActive ? "User deactivated and signed out" : "User activated" };
  });
}
