// Pure role/location policy. Server code must call these on every protected read and write.
import type { Role } from "./models";

export type Permission =
  | "dashboard"
  | "certificates.view"
  | "certificates.edit"
  | "certificates.revoke"
  | "certificates.delete"
  | "import"
  | "trainees.view"
  | "trainees.edit"
  | "catalog.manage"
  | "locations.manage"
  | "trainers.manage"
  | "inquiries.manage"
  | "users.manage"
  | "settings.manage"
  | "logs.activity"
  | "logs.verification"
  | "uploads.content"
  | "uploads.people";

const MATRIX: Record<Role, Permission[] | "*"> = {
  SUPER_ADMIN: "*",
  MANAGER: [
    "dashboard", "certificates.view", "certificates.edit", "certificates.revoke", "certificates.delete", "import",
    "trainees.view", "trainees.edit", "trainers.manage", "inquiries.manage", "logs.verification", "uploads.people",
  ],
  STAFF: ["dashboard", "certificates.view", "certificates.edit", "trainees.view", "trainees.edit", "uploads.people"],
};

export function can(role: Role, p: Permission) {
  const m = MATRIX[role];
  return m === "*" || m.includes(p);
}

export type Actor = { id: string; role: Role; locations: string[] };

/** null = unrestricted; otherwise the list of location ids the actor may see. */
export function locationScope(actor: Actor): string[] | null {
  return actor.role === "SUPER_ADMIN" ? null : actor.locations;
}

export function canAccessLocation(actor: Actor, locationId: string | null | undefined) {
  const scope = locationScope(actor);
  if (scope === null) return true;
  return Boolean(locationId) && scope.includes(String(locationId));
}
