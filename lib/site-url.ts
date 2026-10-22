/**
 * Canonical public URL (no trailing slash). Used for QR codes, sitemap, reset links and origin checks.
 * Order: APP_URL → Vercel production domain → Vercel deployment URL → localhost.
 */
export function siteUrl(): string {
  // A localhost APP_URL copied from .env.local must never leak into a Vercel deployment (QR codes would break).
  const app = process.env.APP_URL && !(process.env.VERCEL && /localhost|127\.0\.0\.1/.test(process.env.APP_URL)) ? process.env.APP_URL : "";
  const raw =
    app ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}
