import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { PageHero } from "@/components/site/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { CourseSearch } from "@/components/site/CourseSearch";

export const metadata: Metadata = {
  title: "Services & Courses",
  description: "Permit to work, confined space, offshore, heavy equipment and emergency response training programmes across the GCC.",
  alternates: { canonical: "/services" },
};
export const revalidate = 300;

export default async function ServicesPage() {
  const { categories, settings } = await getSiteData();
  const all = categories.flatMap((c) => c.courses.map((x) => ({ ...x, href: `/services/${c.slug}/${x.slug}`, tag: `${c.code} · ${c.shortName}` })));
  return (
    <>
      <PageHero
        eyebrow="Training programmes"
        title="Real skills. Safer operations."
        text={`${all.length} programmes across ${categories.length} specialist categories, delivered at our centres or on your site.`}
        image={settings.home.ctaImage}
        crumbs={[{ label: "Services" }]}
      />
      <section className="bg-cream py-14 sm:py-16">
        <div className="container-x">
          <h2 className="sr-only">Categories</h2>
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/services/${c.slug}`} className="card group flex h-full flex-col overflow-hidden hover:shadow-xl">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <SafeImage src={c.imageUrl} alt={c.shortName} fill sizes="(min-width:1024px) 33vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="font-heading text-2xl font-extrabold text-gold">{c.code}</span>
                    <h3 className="font-heading text-lg font-bold text-navy-dark">{c.name}</h3>
                    <p className="mt-2 text-sm text-muted">{c.description}</p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-gold">
                      {c.courses.length} courses <ArrowRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section">
        <div className="container-x">
          <p className="eyebrow">All courses</p>
          <h2 className="h2 mb-8 mt-3">Find a course</h2>
          <CourseSearch courses={all} />
        </div>
      </section>
    </>
  );
}
