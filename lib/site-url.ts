/**
 * Canonical public URL (no trailing slash). Used for QR codes, sitemap, reset links and origin checks.
 * Order: APP_URL → Vercel production domain → Vercel deployment URL → localhost.
 */
export function siteUrl(): string {
  const raw =
    process.env.APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
