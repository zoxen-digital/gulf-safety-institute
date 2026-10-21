import { test } from "node:test";
import assert from "node:assert/strict";
import { canPublicDownload, displayStatus, maskIdentity, normalizeCertificateNumber, toPublicResult, type CertificateRecord } from "../lib/verify-core";

const now = new Date("2026-06-01T00:00:00Z");
const base: CertificateRecord = {
  certificateNumber: "GIS-2026-000001",
  status: "VALID",
  issueDate: new Date("2026-01-01"),
  expiryDate: new Date("2027-01-01"),
  trainee: { fullName: "Test Person", idNumber: "2329148072", nationality: "SA", dob: new Date("1990-01-01"), phone: "+966500000000", email: "x@y.z" },
  course: { name: "Forklift", categoryName: "Heavy Equipment" },
  notes: "internal secret",
  revokeReason: "secret reason",
};

test("normalizes certificate numbers", () => {
  assert.equal(normalizeCertificateNumber("  gis-2026-000123 "), "GIS-2026-000123");
  assert.equal(normalizeCertificateNumber("tac 65671"), "TAC65671");
  assert.equal(normalizeCertificateNumber("<script>"), "");
  assert.equal(normalizeCertificateNumber({ $ne: 1 }), "");
  assert.equal(normalizeCertificateNumber(""), "");
});

test("computes expired status from expiry date", () => {
  assert.equal(displayStatus("VALID", new Date("2026-05-31"), now), "EXPIRED");
  assert.equal(displayStatus("VALID", new Date("2026-06-02"), now), "VALID");
  assert.equal(displayStatus("REVOKED", new Date("2030-01-01"), now), "REVOKED");
  assert.equal(displayStatus("SUSPENDED", new Date("2020-01-01"), now), "SUSPENDED");
});

test("masks identity numbers", () => {
  assert.equal(maskIdentity("2329148072"), "23******72");
  assert.equal(maskIdentity("ABC"), "***");
  assert.equal(maskIdentity(""), "");
  assert.ok(!maskIdentity("2329148072").includes("291480"));
});

test("valid result exposes only allow-listed fields", () => {
  const r = toPublicResult(base, base.certificateNumber, now);
  assert.equal(r.kind, "VALID");
  const json = JSON.stringify(r);
  for (const secret of ["2329148072", "+966500000000", "x@y.z", "internal secret", "secret reason", "1990"]) assert.ok(!json.includes(secret), `leaked ${secret}`);
  if (r.kind === "VALID") assert.equal(r.maskedId, "23******72");
});

test("revoked and suspended results show only number, name and status", () => {
  for (const status of ["REVOKED", "SUSPENDED"] as const) {
    const r = toPublicResult({ ...base, status }, base.certificateNumber, now);
    assert.deepEqual(Object.keys(r).sort(), ["certificateNumber", "fullName", "kind"]);
    assert.equal(r.kind, status);
  }
});

test("not found result", () => {
  assert.deepEqual(toPublicResult(null, "X-1", now), { kind: "NOT_FOUND", searched: "X-1" });
});

test("downloads blocked for revoked and suspended", () => {
  assert.equal(canPublicDownload("VALID"), true);
  assert.equal(canPublicDownload("EXPIRED"), true);
  assert.equal(canPublicDownload("REVOKED"), false);
  assert.equal(canPublicDownload("SUSPENDED"), false);
});
