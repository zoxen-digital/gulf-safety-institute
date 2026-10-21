// Bundled AI-generated theme photography. Exact legacy seed URLs are mapped; custom uploads are unchanged.
export const IMG = {
  "hero": "/images/gistra/hero-refinery.webp",
  "practical": "/images/gistra/practical-training.webp",
  "cta": "/images/gistra/corporate-training.webp",
  "about": "/images/gistra/about-academy.webp",
  "catA": "/images/gistra/site-safety.webp",
  "catB": "/images/gistra/confined-space.webp",
  "catC": "/images/gistra/offshore-marine.webp",
  "catD": "/images/gistra/heavy-equipment.webp",
  "catE": "/images/gistra/emergency-response.webp",
  "khobar": "/images/gistra/al-khobar.webp",
  "jubail": "/images/gistra/jubail.webp"
} as const;

const LEGACY_DEFAULTS: Record<string, string> = {
  "/photo-1581094794329-c8112a89af12": "/images/gistra/hero-refinery.webp",
  "/photo-1565008447742-97f6f38c985c": "/images/gistra/practical-training.webp",
  "/photo-1513828583688-c52646db42da": "/images/gistra/corporate-training.webp",
  "/photo-1504307651254-35680f356dfd": "/images/gistra/about-academy.webp",
  "/photo-1621905251189-08b45d6a269e": "/images/gistra/site-safety.webp",
  "/photo-1581092160562-40aa08e78837": "/images/gistra/confined-space.webp",
  "/photo-1578662996442-48f60103fc96": "/images/gistra/offshore-marine.webp",
  "/photo-1541888946425-d81bb19240f5": "/images/gistra/heavy-equipment.webp",
  "/photo-1599059813005-11265ba4b4ce": "/images/gistra/emergency-response.webp",
  "/photo-1512453979798-5ea266f8880c": "/images/gistra/al-khobar.webp",
  "/photo-1473341304170-971dccb5ac1e": "/images/gistra/jubail.webp"
};

/** Resolve only original seeded stock photos, regardless of Unsplash resize query. */
export function resolveThemeImage(src: string): string {
  if (!src.startsWith("https://images.unsplash.com/")) return src;
  try {
    const url = new URL(src);
    return url.hostname === "images.unsplash.com" ? LEGACY_DEFAULTS[url.pathname] || src : src;
  } catch { return src; }
}
