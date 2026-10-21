import "server-only";
import { randomBytes } from "crypto";
import { connectDb } from "./db";
import { Category, Course, Location, PageContent, Setting, StoredUpload, Trainee, Trainer } from "./models";
import { parseUploadUrl, validateImage, type UploadFolder } from "./upload-core";

export async function storeImage(buf: Buffer, name: string, mime: string, folder: UploadFolder, userId: string) {
  const v = validateImage(buf, name, mime);
  if (!v.ok) return v;
  await connectDb();
  const filename = `${Date.now()}-${randomBytes(16).toString("hex")}.${v.kind.ext}`;
  await StoredUpload.create({ folder, filename, mimeType: v.kind.mime, size: buf.length, data: buf, uploadedBy: userId });
  return { ok: true as const, url: `/api/uploads/${folder}/${filename}`, filename, size: buf.length, folder };
}

/** Counts every content document that still points at this URL. */
export async function countUploadReferences(url: string) {
  await connectDb();
  const counts = await Promise.all([
    Course.countDocuments({ imageUrl: url }),
    Category.countDocuments({ imageUrl: url }),
    Location.countDocuments({ imageUrl: url }),
    Trainee.countDocuments({ photoUrl: url }),
    Trainer.countDocuments({ signatureUrl: url }),
  ]);
  let n = counts.reduce((a, b) => a + b, 0);
  const mixed = [...(await Setting.find().lean()), ...(await PageContent.find().lean())];
  for (const d of mixed) if (JSON.stringify(d).includes(url)) n++;
  return n;
}

/**
 * Deletes a stored upload only if it is one of ours and nothing references it any more.
 * Call this AFTER the owning document has been saved with its new value.
 */
export async function deleteStoredUploadByUrl(url: string | null | undefined) {
  const parsed = parseUploadUrl(url);
  if (!parsed || !url) return false;
  if ((await countUploadReferences(url)) > 0) return false;
  const r = await StoredUpload.deleteOne(parsed);
  return r.deletedCount === 1;
}

/** Helper for update flows: clean up every old image URL that changed. */
export async function cleanupReplacedImages(before: Record<string, unknown>, after: Record<string, unknown>, keys: string[]) {
  for (const k of keys) {
    const old = before[k];
    if (typeof old === "string" && old && old !== after[k]) await deleteStoredUploadByUrl(old);
  }
}
