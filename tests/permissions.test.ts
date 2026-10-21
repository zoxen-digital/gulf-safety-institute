import { test } from "node:test";
import assert from "node:assert/strict";
import { can, canAccessLocation, locationScope, type Actor } from "../lib/permissions";

const admin: Actor = { id: "a", role: "SUPER_ADMIN", locations: [] };
const manager: Actor = { id: "m", role: "MANAGER", locations: ["L1"] };
const staff: Actor = { id: "s", role: "STAFF", locations: ["L2"] };

test("super admin has every permission and no location scope", () => {
  for (const p of ["users.manage", "settings.manage", "certificates.revoke", "import", "logs.activity"] as const) assert.ok(can("SUPER_ADMIN", p));
  assert.equal(locationScope(admin), null);
  assert.ok(canAccessLocation(admin, "ANY"));
});

test("manager boundaries", () => {
  assert.ok(can("MANAGER", "certificates.revoke"));
  assert.ok(can("MANAGER", "import"));
  assert.ok(can("MANAGER", "trainers.manage"));
  assert.ok(can("MANAGER", "inquiries.manage"));
  for (const p of ["users.manage", "settings.manage", "catalog.manage", "locations.manage", "logs.activity", "uploads.content"] as const) assert.ok(!can("MANAGER", p), p);
  assert.ok(canAccessLocation(manager, "L1"));
  assert.ok(!canAccessLocation(manager, "L2"));
  assert.ok(!canAccessLocation(manager, null));
});

test("staff boundaries", () => {
  assert.ok(can("STAFF", "certificates.edit"));
  assert.ok(can("STAFF", "trainees.edit"));
  for (const p of ["certificates.revoke", "certificates.delete", "import", "users.manage", "settings.manage", "inquiries.manage", "logs.verification"] as const) assert.ok(!can("STAFF", p), p);
  assert.deepEqual(locationScope(staff), ["L2"]);
  assert.ok(!canAccessLocation(staff, "L1"));
});
