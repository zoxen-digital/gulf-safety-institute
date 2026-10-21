import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock, Clock, MonitorPlay, Users } from "lucide-react";
import { getSiteData } from "@/lib/site-data";
import { PageHero } from "@/components/site/PageHero";
import { SafeImage } from "@/components/SafeImage";

export const revalidate = 300;
type Props = { params: Promise<{ category: string; course: string }> };

async function find(category: string, course: string) {
  const { categories } = await getSiteData();
  const c = categories.find((x) => x.slug === category);
  const k = c?.courses.find((x) => x.slug === course);
  return c && k ? { c, k } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const r = await find(p.category, p.course);
  if (!r) return { title: "Course not found" };
  return { title: r.k.name, description: r.k.shortDescription, alternates: { canonical: `/services/${r.c.slug}/${r.k.slug}` }, openGraph: { images: [r.k.imageUrl] } };
}

export default async function CoursePage({ params }: Props) {
  const p = await params;
  const r = await find(p.category, p.course);
  if (!r) notFound();
  const { c, k } = r;
  const related = c.courses.filter((x) => x.slug !== k.slug).slice(0, 4);
  const inquiry = `/contact?type=${encodeURIComponent("Course Inquiry")}&course=${encodeURIComponent(k.slug)}`;
  const facts = [
    { icon: Clock, l: "Duration", v: k.duration || "Confirmed on enquiry" },
    { icon: MonitorPlay, l: "Delivery", v: k.deliveryMode },
    { icon: CalendarClock, l: "Default certificate validity", v: `${k.defaultValidityMonths} months` },
  ];
  return (
    <>
      <PageHero eyebrow={`${c.code} · ${c.shortName}`} title={k.name} text={k.shortDescription} image={k.imageUrl} crumbs={[{ href: "/services", label: "Services" }, { href: `/services/${c.slug}`, label: c.shortName }, { label: k.name }]}>
        <Link href={inquiry} className="btn-gold mt-8">Request this Course <ArrowRight className="h-4 w-4" aria-hidden /></Link>
      </PageHero>
      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1fr_340px]">
          <article>
            <h2 className="h2">Course overview</h2>
            {k.description.split(/\n+/).map((t, i) => <p key={i} className="mt-4 leading-relaxed text-ink/85">{t}</p>)}
            <h2 className="mt-10 flex items-center gap-3 font-heading text-xl font-bold text-navy-dark"><Users className="h-5 w-5 text-gold" aria-hidden />Who should attend</h2>
            {k.whoShouldAttend.split(/\n+/).map((t, i) => <p key={i} className="mt-3 leading-relaxed text-ink/85">{t}</p>)}
            <div className="relative mt-10 aspect-[16/8] overflow-hidden rounded-[10px]">
              <SafeImage src={k.imageUrl} alt={k.name} fill sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
            </div>
          </article>
          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <dl className="card divide-y divide-black/5">
              {facts.map(({ icon: Icon, l, v }) => (
                <div key={l} className="flex gap-4 p-5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
                  <div><dt className="text-xs font-medium uppercase tracking-wider text-muted">{l}</dt><dd className="mt-1 text-sm font-semibold text-ink">{v}</dd></div>
                </div>
              ))}
            </dl>
            <div className="card bg-navy p-6 text-white">
              <h2 className="font-heading text-lg font-bold">Enrol or request on-site delivery</h2>
              <p className="mt-2 text-sm text-white/75">Final outline, schedule and pricing are confirmed with you before enrolment.</p>
              <Link href={inquiry} className="btn-gold mt-5 w-full">Request this Course</Link>
            </div>
          </aside>
        </div>
      </section>
      {related.length > 0 && (
        <section className="bg-cream py-14">
          <div className="container-x">
            <h2 className="h2">Related courses</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((x) => (
                <li key={x.slug}>
                  <Link href={`/services/${c.slug}/${x.slug}`} className="card group flex h-full flex-col p-5 hover:border-gold/60">
                    <h3 className="font-heading text-sm font-bold leading-snug text-navy-dark">{x.name}</h3>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-semibold text-gold">View course <ArrowRight className="h-3.5 w-3.5" aria-hidden /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
