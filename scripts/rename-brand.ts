/**
 * One-off migration: renames GISTRA → GSI (Gulf Safety Institute) in stored content.
 * Safe to re-run.   npx tsx scripts/rename-brand.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import mongoose from "mongoose";
import { connectDb } from "../lib/db";
import { Course, PageContent, Setting } from "../lib/models";

const swap = (s: string) =>
  s.replace(/Gulf Industrial Safety & Training Regional Academy/g, "Gulf Safety Institute").replace(/GISTRA/g, "GSI");

async function main() {
  await connectDb();
  const s = await Setting.findOne({ key: "site" }).lean();
  if (s) {
    const value = JSON.parse(swap(JSON.stringify(s.value)));
    if (value.certificatePrefix === "GIS") value.certificatePrefix = "GSI";
    await Setting.updateOne({ _id: s._id }, { $set: { value } });
    console.log("Settings updated");
  }
  for (const p of await PageContent.find().lean()) {
    await PageContent.updateOne({ _id: p._id }, { $set: { title: swap(p.title || ""), body: swap(String(p.body ?? "")) } });
  }
  console.log("Legal pages updated");
  let n = 0;
  for (const c of await Course.find().lean()) {
    const u = { shortDescription: swap(c.shortDescription), description: swap(c.description), whoShouldAttend: swap(c.whoShouldAttend) };
    if (u.shortDescription !== c.shortDescription || u.description !== c.description) {
      await Course.updateOne({ _id: c._id }, { $set: u });
      n++;
    }
  }
  console.log(`Courses updated: ${n}`);
  await mongoose.disconnect();
}
main().catch(async (e) => {
  console.error(e.message);
  await mongoose.disconnect();
  process.exit(1);
});
