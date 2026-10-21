import "server-only";
import { unstable_cache } from "next/cache";
import { resolveThemeImage } from "./image-assets";
import { connectDb, isDbConfigured } from "./db";
import { Category, Course, Location, PageContent, Setting } from "./models";
import { CATEGORIES, DEFAULT_LEGAL, DEFAULT_LOCATIONS, DEFAULT_SETTINGS, defaultCourseCopy, slugify, type SiteSettings } from "./catalog";

export const SITE_TAG = "site-content";

export type PubCourse = {
  id: string; name: string; slug: string; shortDescription: string; description: string; whoShouldAttend: string;
  duration: string; defaultValidityMonths: number; deliveryMode: string; imageUrl: string;
};
export type PubCategory = { id: string; code: string; name: string; shortName: string; slug: string; description: string; imageUrl: string; courses: PubCourse[] };
export type PubLocation = {
  id: string; name: string; label: string; city: string; country: string; description: string; address: string;
  phone: string; email: string; mapUrl: string; imageUrl: string; isHeadOffice: boolean;
};
export type SiteData = { settings: SiteSettings; categories: PubCategory[]; locations: PubLocation[]; fromDatabase: boolean };

function mergeSettings(v: unknown): SiteSettings {
  const s = (v || {}) as Partial<SiteSettings>;
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    logoUrl: s.logoUrl || DEFAULT_SETTINGS.logoUrl,
    faviconUrl: s.faviconUrl || DEFAULT_SETTINGS.faviconUrl,
    social: { ...DEFAULT_SETTINGS.social, ...(s.social || {}) },
    home: {
      ...DEFAULT_SETTINGS.home, ...(s.home || {}),
      ...Object.fromEntries(
        Object.entries({ ...DEFAULT_SETTINGS.home, ...(s.home || {}) })
          .filter(([key]) => key.endsWith("Image"))
          .map(([key, value]) => [key, resolveThemeImage(value)]),
      ),
    },
    stats: s.stats?.length ? s.stats : DEFAULT_SETTINGS.stats,
  };
}

function fallback(): SiteData {
  return {
    fromDatabase: false,
    settings: DEFAULT_SETTINGS,
    categories: CATEGORIES.map((c) => ({
      id: c.code, code: c.code, name: c.name, shortName: c.shortName, slug: c.slug, description: c.description, imageUrl: resolveThemeImage(c.imageUrl),
      courses: c.courses.map((n) => ({
        id: slugify(n), name: n, slug: slugify(n), ...defaultCourseCopy(n, c.shortName), defaultValidityMonths: 24,
        deliveryMode: "Classroom & practical assessment", imageUrl: resolveThemeImage(c.imageUrl),
      })),
    })),
    locations: DEFAULT_LOCATIONS.map((l) => ({ ...l, id: l.name, address: "", phone: "", email: "", mapUrl: "" })),
  };
}

const load = unstable_cache(
  async (): Promise<SiteData> => {
    await connectDb();
    const [setting, cats, courses, locs] = await Promise.all([
      Setting.findOne({ key: "site" }).lean(),
      Category.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
      Course.find({ isActive: true, showOnWebsite: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      Location.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    ]);
    return {
      fromDatabase: true,
      settings: mergeSettings(setting?.value),
      categories: cats.map((c) => ({
        id: String(c._id), code: c.code, name: c.name, shortName: c.shortName || c.name, slug: c.slug, description: c.description, imageUrl: resolveThemeImage(c.imageUrl),
        courses: courses
          .filter((x) => String(x.category) === String(c._id))
          .map((x) => ({
            id: String(x._id), name: x.name, slug: x.slug, shortDescription: x.shortDescription, description: x.description,
            whoShouldAttend: x.whoShouldAttend, duration: x.duration, defaultValidityMonths: x.defaultValidityMonths,
            deliveryMode: x.deliveryMode, imageUrl: resolveThemeImage(x.imageUrl || c.imageUrl),
          })),
      })),
      locations: locs.map((l) => ({
        id: String(l._id), name: l.name, label: l.label, city: l.city, country: l.country, description: l.description, address: l.address,
        phone: l.phone, email: l.email, mapUrl: l.mapUrl, imageUrl: resolveThemeImage(l.imageUrl), isHeadOffice: l.isHeadOffice,
      })),
    };
  },
  ["site-data", "gistra-generated-images-v1", "gsi-logo-v1"],
  { tags: [SITE_TAG], revalidate: 300 },
);

/** Public content. Falls back to bundled defaults only when MongoDB is not configured yet. */
export async function getSiteData(): Promise<SiteData> {
  if (!isDbConfigured()) return fallback();
  try {
    return await load();
  } catch (e) {
    console.error("site data load failed", (e as Error).message);
    return fallback();
  }
}

export async function getSettings() {
  return (await getSiteData()).settings;
}

export const getLegalPage = unstable_cache(
  async (slug: "privacy-policy" | "terms") => {
    const def = DEFAULT_LEGAL[slug];
    if (!isDbConfigured()) return def;
    try {
      await connectDb();
      const p = await PageContent.findOne({ slug }).lean();
      return p ? { title: p.title || def.title, body: String(p.body ?? def.body) } : def;
    } catch {
      return def;
    }
  },
  ["legal"],
  { tags: [SITE_TAG], revalidate: 300 },
);

export function statValue(v: string, data: SiteData, i: number) {
  if (v !== "auto") return v;
  if (i === 0) return String(data.categories.reduce((n, c) => n + c.courses.length, 0));
  if (i === 1) return String(data.categories.length);
  return v;
}
