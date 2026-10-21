import "server-only";
import { z } from "zod";
import type { Types } from "mongoose";
import type { SessionUser } from "./auth";
import { ClientError, oid, traineeScope } from "./admin";
import { Trainee } from "./models";
import { canAccessLocation, locationScope } from "./permissions";

export const traineeSchema = z.object({
  fullName: z.string().min(2, "Required").max(160),
  idNumber: z.string().min(3, "Required").max(40).regex(/^[A-Za-z0-9-]+$/, "Letters, digits and dashes only").transform((s) => s.toUpperCase()),
  nationality: z.string().max(80),
  dob: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")]),
  phone: z.string().max(40),
  email: z.union([z.literal(""), z.string().email("Invalid email")]),
  company: z.string().max(160),
  photoUrl: z.string().max(300),
});

export type TraineeInput = z.input<typeof traineeSchema>;

/** Throws unless this actor may see/edit the trainee. */
export async function assertTraineeAccess(u: SessionUser, id: Types.ObjectId) {
  const scope = await traineeScope(u);
  const t = await Trainee.findOne({ _id: id, ...scope }).lean();
  if (!t) throw new ClientError("Trainee not found");
  return t;
}

export function resolveHomeLocation(u: SessionUser, raw: string): Types.ObjectId | undefined {
  if (!raw) {
    if (locationScope(u) !== null) throw new ClientError("Choose one of your assigned locations");
    return undefined;
  }
  const id = oid(raw);
  if (!canAccessLocation(u, String(id))) throw new ClientError("You cannot use that location");
  return id;
}
