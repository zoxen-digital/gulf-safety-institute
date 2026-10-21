import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { PageHero } from "@/components/site/PageHero";
import { CourseSearch } from "@/components/site/CourseSearch";

export const revalidate = 300;
type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = (await getSiteData()).categories.find((x) => x.slug === category);
  if (!c) return { title: "Category not found" };
  return { title: c.name, description: c.description, alternates: { canonical: `/services/${c.slug}` }, openGraph: { images: [c.imageUrl] } };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const { categories } = await getSiteData();
  const c = categories.find((x) => x.slug === category);
  if (!c) notFound();
  return (
    <>
      <PageHero eyebrow={`Category ${c.code}`} title={c.name} text={c.description} image={c.imageUrl} crumbs={[{ href: "/services", label: "Services" }, { label: c.shortName }]} />
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="h2 mb-8">Courses in this category</h2>
            {c.courses.length ? (
              <CourseSearch courses={c.courses.map((x) => ({ ...x, href: `/services/${c.slug}/${x.slug}` }))} label={`Search ${c.shortName} courses`} />
            ) : (
              <p className="text-muted">Courses for this category will be published soon.</p>
            )}
          </div>
          <aside className="space-y-5">
            <div className="card border-t-4 border-t-gold p-6">
              <h2 className="font-heading text-lg font-bold text-navy-dark">Need this training for your team?</h2>
              <p className="mt-2 text-sm text-muted">Tell us the course, number of trainees and preferred location. We can deliver at our centres or on your site.</p>
              <Link href={`/contact?type=Course%20Inquiry`} className="btn-gold mt-5 w-full">Send an inquiry <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
            <nav aria-label="Other categories" className="card p-6">
              <h2 className="font-heading text-sm font-bold text-navy-dark">Other categories</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {categories.filter((x) => x.slug !== c.slug).map((x) => (
                  <li key={x.slug}><Link href={`/services/${x.slug}`} className="text-ink hover:text-gold"><span className="mr-2 font-bold text-gold">{x.code}</span>{x.shortName}</Link></li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </section>
    </>
  );
}
