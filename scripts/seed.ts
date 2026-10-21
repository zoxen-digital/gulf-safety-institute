/**
 * Idempotent seed. Safe to run repeatedly: existing records are never overwritten,
 * so edits made in the admin panel survive re-seeding.
 *
 *   npm run seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDb } from "../lib/db";
import {
  ALL_MODELS, Category, Certificate, Course, Location, PageContent, Setting, Trainee, Trainer, User,
} from "../lib/models";
import { CATEGORIES, DEFAULT_LEGAL, DEFAULT_LOCATIONS, DEFAULT_SETTINGS, defaultCourseCopy, slugify } from "../lib/catalog";

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  await connectDb();
  console.log("Connected to", mongoose.connection.name);

  for (const m of ALL_MODELS) await m.syncIndexes();
  console.log("Indexes synced");

  let order = 0;
  for (const c of CATEGORIES) {
    const cat = await Category.findOneAndUpdate(
      { code: c.code },
      { $setOnInsert: { code: c.code, name: c.name, shortName: c.shortName, slug: c.slug, description: c.description, imageUrl: c.imageUrl, sortOrder: ++order, isActive: true } },
      { upsert: true, new: true },
    );
    let i = 0;
    for (const name of c.courses) {
      await Course.updateOne(
        { slug: slugify(name) },
        { $setOnInsert: { category: cat._id, name, slug: slugify(name), ...defaultCourseCopy(name, c.shortName), sortOrder: ++i } },
        { upsert: true },
      );
    }
  }
  console.log(`Categories: ${await Category.countDocuments()}, courses: ${await Course.countDocuments()}`);

  const locIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const l of DEFAULT_LOCATIONS) {
    const doc = await Location.findOneAndUpdate({ name: l.name }, { $setOnInsert: { ...l, isActive: true } }, { upsert: true, new: true });
    locIds[l.name] = doc._id;
  }
  console.log(`Locations: ${await Location.countDocuments()}`);

  // Placeholder people so certificates can be issued immediately; rename them in the admin panel.
  const people = [
    { name: "Lead Trainer (rename)", designation: "Senior HSE Instructor", type: "TRAINER" },
    { name: "Operator Trainer (rename)", designation: "Heavy Equipment Instructor", type: "TRAINER" },
    { name: "Training Manager (rename)", designation: "Training Manager", type: "APPROVER" },
  ];
  for (const p of people) await Trainer.updateOne({ name: p.name }, { $setOnInsert: { ...p, isActive: true } }, { upsert: true });

  await Setting.updateOne({ key: "site" }, { $setOnInsert: { key: "site", value: DEFAULT_SETTINGS } }, { upsert: true });
  for (const [slug, p] of Object.entries(DEFAULT_LEGAL)) await PageContent.updateOne({ slug }, { $setOnInsert: { slug, title: p.title, body: p.body } }, { upsert: true });
  console.log("Settings and legal pages ready");

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 10) throw new Error("SEED_ADMIN_PASSWORD must be at least 10 characters");
    const exists = await User.exists({ email });
    if (!exists) {
      await User.create({ name: "Super Admin", email, passwordHash: await bcrypt.hash(password, 12), role: "SUPER_ADMIN", isActive: true });
      console.log(`Super Admin created: ${email}`);
    } else console.log(`Admin ${email} already exists (password unchanged)`);
  } else console.log("SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set: no admin created");

  if (process.env.SEED_DEMO_DATA === "true") await seedDemo(locIds);

  await mongoose.disconnect();
  console.log("Seed complete");
}

async function seedDemo(locIds: Record<string, mongoose.Types.ObjectId>) {
  console.log("Seeding DEMO records (isDemo=true, numbers prefixed DEMO-)");
  const courses = await Course.find().limit(5).lean();
  const trainer = await Trainer.findOne({ type: "TRAINER" }).lean();
  const approver = await Trainer.findOne({ type: "APPROVER" }).lean();
  const y = new Date().getUTCFullYear();
  const day = 86400_000;
  const now = Date.now();
  const demo = [
    { n: 1, name: "DEMO Trainee One", status: "VALID", issue: now - 90 * day, expiry: now + 640 * day },
    { n: 2, name: "DEMO Trainee Two", status: "VALID", issue: now - 800 * day, expiry: now - 70 * day },
    { n: 3, name: "DEMO Trainee Three", status: "REVOKED", issue: now - 200 * day, expiry: now + 500 * day },
    { n: 4, name: "DEMO Trainee Four", status: "SUSPENDED", issue: now - 30 * day, expiry: now + 700 * day },
    { n: 5, name: "DEMO Trainee Five", status: "VALID", issue: now - 10 * day, expiry: now + 20 * day },
  ];
  for (const d of demo) {
    const t = await Trainee.findOneAndUpdate(
      { idNumber: `DEMO000000${d.n}` },
      { $setOnInsert: { fullName: d.name, idNumber: `DEMO000000${d.n}`, nationality: "Demo", company: "Demo Contracting (sample)", homeLocation: locIds["Al Khobar"], isDemo: true } },
      { upsert: true, new: true },
    );
    await Certificate.updateOne(
      { certificateNumber: `DEMO-${y}-00000${d.n}` },
      {
        $setOnInsert: {
          certificateNumber: `DEMO-${y}-00000${d.n}`, trainee: t._id, course: courses[(d.n - 1) % courses.length]._id,
          location: d.n % 2 ? locIds["Al Khobar"] : locIds["Jubail"], trainer: trainer?._id, approver: approver?._id,
          company: "Demo Contracting (sample)", issueDate: new Date(d.issue), expiryDate: new Date(d.expiry), status: d.status,
          revokeReason: d.status === "VALID" ? "" : "Demo status", isDemo: true,
        },
      },
      { upsert: true },
    );
  }
  console.log(`Demo certificates: DEMO-${y}-000001 … DEMO-${y}-000005 (valid, expired, revoked, suspended, expiring soon)`);
}

main().catch(async (e) => {
  console.error("Seed failed:", e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
