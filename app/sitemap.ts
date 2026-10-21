import type { MetadataRoute } from "next";
import { getSiteData } from "@/lib/site-data";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const { categories } = await getSiteData();
  const fixed = ["", "/about", "/services", "/locations", "/contact", "/request-quote", "/verify", "/privacy-policy", "/terms"];
  return [
    ...fixed.map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const, priority: p === "" ? 1 : 0.7 })),
    ...categories.flatMap((c) => [
      { url: `${base}/services/${c.slug}`, priority: 0.8 },
      ...c.courses.map((k) => ({ url: `${base}/services/${c.slug}/${k.slug}`, priority: 0.6 })),
    ]),
  ];
}
