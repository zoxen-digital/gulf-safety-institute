"use server";
import { z } from "zod";
import { guarded, revalidateSite, str, type ActionResult } from "@/lib/admin";
import { PageContent, Setting, StoredUpload } from "@/lib/models";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/catalog";
import { countUploadReferences, deleteStoredUploadByUrl } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

const url = z.union([z.literal(""), z.string().url().refine((u) => /^https:\/\//.test(u), "Must start with https://")]);
const img = z.string().max(400);

const IMAGE_KEYS = ["logoUrl", "faviconUrl", "stampUrl"] as const;
const HOME_IMAGE_KEYS = ["heroImage", "standardImage", "ctaImage", "aboutImage"] as const;
const HOME_TEXT_KEYS = Object.keys(DEFAULT_SETTINGS.home).filter((k) => !(HOME_IMAGE_KEYS as readonly string[]).includes(k)) as (keyof SiteSettings["home"])[];

export async function saveSettings(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("settings.manage", async (u) => {
    const s = z
      .object({
        instituteName: z.string().min(2).max(60),
        instituteFullName: z.string().min(2).max(160),
        tagline: z.string().max(200),
        utilityText: z.string().max(120),
        footerText: z.string().max(400),
        logoUrl: img, faviconUrl: img, stampUrl: img,
        phone: z.string().max(40),
        whatsapp: z.string().max(40),
        email: z.union([z.literal(""), z.string().email("Invalid email")]),
        address: z.string().max(300),
        notificationEmail: z.union([z.literal(""), z.string().email("Invalid email")]),
        certificatePrefix: z.string().min(2).max(8).regex(/^[A-Z0-9]+$/, "Uppercase letters and digits only"),
        idCardDisclaimer: z.string().min(10).max(600),
        seoTitle: z.string().max(120),
        seoDescription: z.string().max(300),
      })
      .parse({
        instituteName: str(fd, "instituteName"), instituteFullName: str(fd, "instituteFullName"), tagline: str(fd, "tagline"), utilityText: str(fd, "utilityText"),
        footerText: str(fd, "footerText"), logoUrl: str(fd, "logoUrl"), faviconUrl: str(fd, "faviconUrl"), stampUrl: str(fd, "stampUrl"), phone: str(fd, "phone"),
        whatsapp: str(fd, "whatsapp"), email: str(fd, "email"), address: str(fd, "address"), notificationEmail: str(fd, "notificationEmail"),
        certificatePrefix: str(fd, "certificatePrefix").toUpperCase(), idCardDisclaimer: str(fd, "idCardDisclaimer"), seoTitle: str(fd, "seoTitle"), seoDescription: str(fd, "seoDescription"),
      });
    const social = z.object({ linkedin: url, facebook: url, instagram: url, x: url, youtube: url }).parse(
      Object.fromEntries(["linkedin", "facebook", "instagram", "x", "youtube"].map((k) => [k, str(fd, `social.${k}`)])),
    );
    const home: Record<string, string> = {};
    for (const k of HOME_TEXT_KEYS) home[k] = str(fd, `home.${k}`, 400) || DEFAULT_SETTINGS.home[k];
    for (const k of HOME_IMAGE_KEYS) home[k] = str(fd, `home.${k}`, 400) || DEFAULT_SETTINGS.home[k];
    const stats = [0, 1, 2, 3].map((i) => ({ value: str(fd, `stats.${i}.value`, 20) || DEFAULT_SETTINGS.stats[i].value, label: str(fd, `stats.${i}.label`, 60) || DEFAULT_SETTINGS.stats[i].label }));

    const cert = z
      .object({
        signatureUrl: img,
        signatureLabel: z.string().max(60),
        supervisionText: z.string().max(160),
        certificateWebsite: z.string().max(80),
      })
      .parse({ signatureUrl: str(fd, "signatureUrl"), signatureLabel: str(fd, "signatureLabel") || "Authorized Signature", supervisionText: str(fd, "supervisionText"), certificateWebsite: str(fd, "certificateWebsite") });
    const accreditationLogos = [0, 1, 2, 3, 4, 5].map((i) => str(fd, `accreditationLogos.${i}`, 400)).filter(Boolean);
    const publicShowFullId = fd.get("publicShowFullId") === "on";

    const prev = ((await Setting.findOne({ key: "site" }).lean())?.value || {}) as Partial<SiteSettings>;
    const value = { ...s, ...cert, accreditationLogos, publicShowFullId, social, home, stats };
    await Setting.updateOne({ key: "site" }, { $set: { value } }, { upsert: true });

    // Remove replaced images only after the new settings are saved.
    for (const k of IMAGE_KEYS) if (prev[k] && prev[k] !== value[k]) await deleteStoredUploadByUrl(prev[k]);
    for (const k of HOME_IMAGE_KEYS) if (prev.home?.[k] && prev.home[k] !== home[k]) await deleteStoredUploadByUrl(prev.home[k]);
    if (prev.signatureUrl && prev.signatureUrl !== cert.signatureUrl) await deleteStoredUploadByUrl(prev.signatureUrl);
    for (const old of prev.accreditationLogos || []) if (!accreditationLogos.includes(old)) await deleteStoredUploadByUrl(old);

    await logActivity(u, "update", "Setting", "site");
    revalidateSite();
    return { ok: true, message: "Settings saved. The website will show the changes immediately." };
  });
}

export async function saveLegal(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("settings.manage", async (u) => {
    const slug = z.enum(["privacy-policy", "terms"]).parse(str(fd, "slug"));
    const title = z.string().min(2).max(120).parse(str(fd, "title"));
    const body = z.string().min(10).max(30000).parse(str(fd, "body", 30000));
    await PageContent.updateOne({ slug }, { $set: { title, body } }, { upsert: true });
    await logActivity(u, "update", "PageContent", slug);
    revalidateSite();
    return { ok: true, message: `${title} saved` };
  });
}

/** Deletes uploads older than 24h that no document references (e.g. uploaded but never saved). */
export async function cleanupOrphanUploads(_: ActionResult): Promise<ActionResult> {
  return guarded("settings.manage", async (u) => {
    const old = await StoredUpload.find({ createdAt: { $lt: new Date(Date.now() - 24 * 3600_000) } }).select("folder filename").lean();
    let removed = 0;
    for (const f of old) {
      const url = `/api/uploads/${f.folder}/${f.filename}`;
      if ((await countUploadReferences(url)) === 0 && (await deleteStoredUploadByUrl(url))) removed++;
    }
    await logActivity(u, "cleanup", "StoredUpload", undefined, { checked: old.length, removed });
    return { ok: true, message: `Checked ${old.length} image(s), removed ${removed} unused.` };
  });
}
