import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, Eye, Globe2, ScanSearch, Target, Truck } from "lucide-react";
import { ABOUT, INDUSTRIES } from "@/lib/catalog";
import { getSiteData } from "@/lib/site-data";
import { PageHero } from "@/components/site/PageHero";
import { SafeImage } from "@/components/SafeImage";
import { IndustryIcon } from "@/components/site/IndustryIcon";

export const metadata: Metadata = {
  title: "About Us",
  description: "About GSI: a third-party industrial safety and technical training and certification institute serving Saudi Arabia and the GCC.",
  alternates: { canonical: "/about" },
};
export const revalidate = 300;

const WHY_ICONS = [BadgeCheck, Globe2, Building2, ScanSearch, Truck];
const REGION = ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Oman", "Bahrain"];

export default async function AboutPage() {
  const { settings: s } = await getSiteData();
  return (
    <>
      <PageHero eyebrow="About GSI" title="Bridging industrial standards and workforce execution." text={s.tagline} image={s.home.aboutImage} crumbs={[{ label: "About Us" }]} />

      <section className="section">
        <div className="container-x grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
          <div>
            <p className="eyebrow">Who we are</p>
            <h2 className="h2 mt-3">{s.instituteFullName}</h2>
            {ABOUT.intro.map((p, i) => (
              <p key={i} className="mt-5 leading-relaxed text-ink/85">{p}</p>
            ))}
          </div>
          <div className="relative min-h-[320px] overflow-hidden rounded-[10px] shadow-xl">
            <SafeImage src={s.home.standardImage} alt="Practical industrial safety training" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-cream py-16 sm:py-20">
        <div className="container-x grid gap-6 md:grid-cols-2">
          {[
            { icon: Target, t: "Our Mission", d: ABOUT.mission },
            { icon: Eye, t: "Our Vision", d: ABOUT.vision },
          ].map(({ icon: Icon, t, d }) => (
            <article key={t} className="card border-t-4 border-t-gold p-8">
              <Icon className="h-9 w-9 text-gold" aria-hidden />
              <h2 className="mt-4 font-heading text-xl font-bold text-navy-dark">{t}</h2>
              <p className="mt-3 leading-relaxed text-ink/85">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <p className="eyebrow">Why choose GSI</p>
          <h2 className="h2 mt-3">What sets our training apart.</h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ABOUT.why.map((w, i) => {
              const Icon = WHY_ICONS[i];
              return (
                <li key={w.title} className="card p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-navy text-gold">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-heading text-base font-bold text-navy-dark">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{w.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-navy-dark py-16 text-white">
        <div className="container-x grid gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Industries we serve</p>
            <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {INDUSTRIES.map((n) => (
                <li key={n} className="flex items-center gap-3">
                  <IndustryIcon name={n} className="h-10 w-10 shrink-0 text-gold" />
                  <span className="text-sm font-semibold">{n}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Region coverage</p>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {REGION.map((r) => (
                <li key={r} className="rounded-md border border-white/15 px-4 py-3 text-sm font-medium">{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-x flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <h2 className="font-heading text-2xl font-extrabold text-navy-dark">Ready to train your workforce?</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/services" className="btn-navy">Browse courses</Link>
            <Link href="/request-quote" className="btn-gold">Request corporate training <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
