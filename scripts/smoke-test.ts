/**
 * End-to-end smoke test against a running server with seeded DEMO data.
 *   SMOKE_URL=http://localhost:3100 npx tsx scripts/smoke-test.ts
 * Never point this at production: it creates a test user and uploads a test image.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import mongoose from "mongoose";
import { inflateSync } from "zlib";
import { SignJWT } from "jose";
import { connectDb } from "../lib/db";
import { Certificate, Location, User } from "../lib/models";

const BASE = process.env.SMOKE_URL || "http://localhost:3100";
const Y = new Date().getUTCFullYear();
let pass = 0, fail = 0;
// pdf-lib writes text as hex strings, so search both forms.
const pdfText = (b: Buffer) => {
  let out = b.toString("latin1");
  const re = /stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(out))) {
    const start = m.index + m[0].length;
    const end = b.indexOf("endstream", start);
    if (end < 0) break;
    try { out += inflateSync(b.subarray(start, end)).toString("latin1"); } catch { /* not deflated */ }
  }
  return out;
};
const pdfHas = (b: Buffer, s: string) => { const t = pdfText(b); return t.includes(s) || t.toUpperCase().includes(Buffer.from(s).toString("hex").toUpperCase()); };
const ok = (cond: boolean, msg: string) => { if (cond) { pass++; console.log("  PASS", msg); } else { fail++; console.log("  FAIL", msg); } };

async function cookieFor(email: string) {
  const u = await User.findOne({ email }).lean();
  const t = await new SignJWT({ sv: u!.sessionVersion }).setProtectedHeader({ alg: "HS256" }).setSubject(String(u!._id)).setIssuedAt().setExpirationTime("1h").sign(new TextEncoder().encode(process.env.AUTH_SECRET!));
  return `gistra_session=${t}`;
}
const get = (p: string, cookie?: string) => fetch(BASE + p, { redirect: "manual", headers: cookie ? { cookie } : {} });

async function main() {
  await connectDb();
  console.log("Public pages");
  for (const p of ["/", "/about", "/services", "/services/heavy-equipment-lifting", "/services/heavy-equipment-lifting/forklift-truck-and-telehandler-operators", "/locations", "/contact", "/request-quote", "/verify", "/privacy-policy", "/terms", "/sitemap.xml", "/robots.txt"]) {
    const r = await get(p);
    ok(r.status === 200, `${p} -> ${r.status}`);
  }
  ok((await get("/services/does-not-exist")).status === 404, "unknown category -> 404");
  const home = await (await get("/")).text();
  ok(home.includes("Confident Workforces") && home.includes("Site Safety &amp; Supervision") && home.includes("Jubail"), "homepage renders DB content");

  console.log("Verification");
  const v1 = await (await get(`/verify?q=demo-${Y}-000001`)).text();
  ok(v1.includes("VERIFIED – VALID") && v1.includes("DE*******01"), "valid certificate (case-insensitive) with masked ID");
  ok(!v1.includes("DEMO0000001"), "full ID number not in public HTML");
  const v2 = await (await get(`/verify/DEMO-${Y}-000002`)).text();
  ok(v2.includes("EXPIRED") && v2.includes("expired on"), "expired certificate");
  const v3 = await (await get(`/verify/DEMO-${Y}-000003`)).text();
  ok(v3.includes("Certificate revoked") && !v3.includes("/certificate\"") && !v3.includes("Demo status"), "revoked: no downloads, no reason");
  const v4 = await (await get(`/verify/DEMO-${Y}-000004`)).text();
  ok(v4.includes("Certificate suspended"), "suspended certificate");
  const v5 = await (await get(`/verify?q=NOPE-123`)).text();
  ok(v5.includes("No certificate found"), "not found");
  const vr = await get(`/verify/DEMO-${Y}-000001`);
  ok((vr.headers.get("x-robots-tag") || "").includes("noindex") && (vr.headers.get("cache-control") || "").includes("no-store"), "result is noindex + no-store");

  console.log("Public PDFs");
  const pdf = await get(`/api/public/certificates/DEMO-${Y}-000001/certificate`);
  const pdfBytes = Buffer.from(await pdf.arrayBuffer());
  ok(pdf.status === 200 && pdf.headers.get("content-type") === "application/pdf" && pdfBytes.subarray(0, 4).toString() === "%PDF", "valid certificate PDF");
  ok(pdfHas(pdfBytes, "DE*******01") && !pdfHas(pdfBytes, "DEMO0000001"), "public PDF has masked ID only");
  ok((await get(`/api/public/certificates/DEMO-${Y}-000001/id-card`)).status === 200, "ID card PDF");
  ok((await get(`/api/public/certificates/DEMO-${Y}-000002/certificate`)).status === 200, "expired PDF allowed");
  ok((await get(`/api/public/certificates/DEMO-${Y}-000003/certificate`)).status === 404, "revoked PDF blocked");
  ok((await get(`/api/public/certificates/DEMO-${Y}-000004/id-card`)).status === 404, "suspended PDF blocked");

  console.log("Auth boundaries");
  const anon = await get("/admin");
  ok(anon.status === 307 && (anon.headers.get("location") || "").includes("/admin/login"), "anonymous /admin redirects to login");
  ok((await get("/api/admin/export/certificates")).status === 401, "anonymous export -> 401");
  const fake = await get("/admin", "gistra_session=forged.token.value");
  ok(fake.status === 307, "forged cookie rejected");

  const admin = await cookieFor(process.env.SEED_ADMIN_EMAIL!.toLowerCase());
  for (const p of ["/admin", "/admin/certificates", "/admin/certificates/new", "/admin/trainees", "/admin/courses", "/admin/categories", "/admin/locations", "/admin/trainers", "/admin/inquiries", "/admin/users", "/admin/settings", "/admin/activity-logs", "/admin/verification-logs", "/admin/import"]) {
    const r = await get(p, admin);
    ok(r.status === 200, `admin ${p} -> ${r.status}`);
  }
  const cert = await Certificate.findOne({ certificateNumber: `DEMO-${Y}-000001` }).lean();
  const ap = await get(`/api/admin/certificates/${cert!._id}/certificate`, admin);
  ok(ap.status === 200 && pdfHas(Buffer.from(await ap.arrayBuffer()), "DEMO0000001"), "admin PDF includes full ID");
  const csv = await get("/api/admin/export/certificates", admin);
  ok(csv.status === 200 && (await csv.text()).includes(`DEMO-${Y}-000001`), "certificate CSV export");
  ok((await get("/api/admin/import", admin)).status === 200, "import template download");

  console.log("Uploads");
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const up = (body: FormData, cookie?: string, origin = BASE) => fetch(BASE + "/api/upload", { method: "POST", body, headers: { ...(cookie ? { cookie } : {}), origin } });
  const fd = () => { const f = new FormData(); f.set("folder", "pages"); f.set("file", new Blob([png], { type: "image/png" }), "a.png"); return f; };
  ok((await up(fd())).status === 401, "upload without session -> 401");
  ok((await up(fd(), admin, "https://evil.example")).status === 403, "cross-origin upload -> 403");
  const r = await up(fd(), admin);
  const j = await r.json();
  ok(r.status === 201 && /^\/api\/uploads\/pages\/\d+-[a-f0-9]{32}\.png$/.test(j.url), `upload stored: ${j.url}`);
  const img = await get(j.url);
  ok(img.status === 200 && img.headers.get("content-type") === "image/png" && (img.headers.get("cache-control") || "").includes("immutable") && img.headers.get("x-content-type-options") === "nosniff", "upload served with correct headers");
  const svg = new FormData(); svg.set("folder", "pages"); svg.set("file", new Blob(["<svg/>"], { type: "image/svg+xml" }), "x.svg");
  ok((await up(svg, admin)).status === 415, "svg rejected");
  const badFolder = new FormData(); badFolder.set("folder", "../x"); badFolder.set("file", new Blob([png], { type: "image/png" }), "a.png");
  ok((await up(badFolder, admin)).status === 400, "bad folder rejected");
  ok((await get("/api/uploads/pages/..%2F..%2Fetc")).status === 404, "path traversal -> 404");

  console.log("Manager scope");
  const jubail = await Location.findOne({ name: "Jubail" }).lean();
  await User.updateOne({ email: "smoke-manager@gistra.local" }, { $set: { name: "Smoke Manager", role: "MANAGER", locations: [jubail!._id], isActive: true, passwordHash: "x" }, $setOnInsert: { sessionVersion: 0 } }, { upsert: true });
  const mgr = await cookieFor("smoke-manager@gistra.local");
  ok((await get("/admin/certificates", mgr)).status === 200, "manager can list certificates");
  const users = await get("/admin/users", mgr);
  ok(users.status === 307 && (users.headers.get("location") || "").includes("denied"), "manager blocked from users");
  ok((await get(`/admin/certificates/${cert!._id}`, mgr)).status === 404, "manager cannot open Al Khobar certificate");
  ok((await get(`/api/admin/certificates/${cert!._id}/certificate`, mgr)).status === 404, "manager cannot download Al Khobar PDF");
  const mcsv = await (await get("/api/admin/export/certificates", mgr)).text();
  ok(!mcsv.includes(`DEMO-${Y}-000001`) && mcsv.includes(`DEMO-${Y}-000002`), "manager export limited to Jubail");
  ok((await get("/admin/settings", mgr)).status === 307, "manager blocked from settings");
  await User.updateOne({ email: "smoke-manager@gistra.local" }, { $set: { isActive: false } });
  ok((await get("/admin", mgr)).status === 307, "deactivated user loses access immediately");
  await User.deleteOne({ email: "smoke-manager@gistra.local" });

  console.log(`\n${pass} passed, ${fail} failed`);
  await mongoose.disconnect();
  process.exit(fail ? 1 : 0);
}
main().catch(async (e) => { console.error(e); await mongoose.disconnect(); process.exit(1); });
