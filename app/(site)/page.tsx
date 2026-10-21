import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleCheck, FileText, Lock, MapPin, QrCode, Settings2, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { getSiteData, statValue } from "@/lib/site-data";
import { INDUSTRIES } from "@/lib/catalog";
import { SafeImage } from "@/components/SafeImage";
import { IndustryIcon } from "@/components/site/IndustryIcon";
import { VerifyForm } from "@/components/site/VerifyForm";

export const revalidate = 300;

export default async function HomePage() {
  const data = await getSiteData();
  const s = data.settings;
  const h = s.home;
  // The last word of the first heading line is highlighted in gold ("Safety.").
  const words = h.heroLine1.trim().split(/\s+/);
  const highlight = words.pop() || "";
  const lead = words.length ? words.join(" ") + " " : "";
  const names = h.alignmentNames.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <>
      {/* 3. Hero */}
      <section className="relative isolate overflow-hidden bg-navy-dark text-white">
        <SafeImage src={h.heroImage} alt="Industrial worker in PPE at a Gulf processing plant" fill priority sizes="100vw" className="hero-zoom -z-20 object-cover object-[70%_center]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-dark via-navy-dark/85 to-navy-dark/10 max-md:bg-navy-dark/70" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-navy-dark/60 to-transparent" />
        <div className="container-x pb-36 pt-16 sm:pb-40 sm:pt-20 lg:pb-44 lg:pt-24">
          <p className="eyebrow reveal">{h.heroEyebrow}</p>
          <h1 className="mt-5 max-w-2xl font-heading text-[38px] font-extrabold leading-[1.05] sm:text-[54px] lg:text-[64px] reveal reveal-delay-1">
            {lead}
            <span className="text-gold">{highlight}</span>
            <br />
            {h.heroLine2}
          </h1>
          <p className="mt-5 max-w-md text-base text-white/85 sm:text-lg reveal reveal-delay-2">{h.heroText}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row reveal reveal-delay-3">
            <Link href="/services" className="btn-gold px-6 py-3.5">
              Explore Our Courses <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/verify" className="btn-outline-light px-6 py-3.5">
              Verify a Certificate
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Quick verification bar */}
      <section aria-labelledby="qv-title" className="relative z-10 -mt-24 sm:-mt-20">
        <div className="container-x">
          <div className="card mx-auto grid max-w-5xl items-center gap-5 p-5 sm:p-7 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy text-white">
                <ShieldCheck className="h-7 w-7" aria-hidden />
              </span>
              <div>
                <h2 id="qv-title" className="font-heading text-lg font-bold text-navy-dark">Trust starts with verification.</h2>
                <p className="text-sm text-muted">Check a worker&apos;s credentials in seconds.</p>
              </div>
            </div>
            <VerifyForm />
            <p className="flex items-center gap-2 text-xs text-muted lg:max-w-[110px]">
              <Lock className="h-5 w-5 shrink-0 text-navy" aria-hidden /> 24/7 secure verification
            </p>
          </div>
        </div>
      </section>

      {/* 5. Statistics */}
      <section aria-label="Key figures" className="pb-12 pt-10 sm:pt-12">
        <dl className="container-x grid max-w-5xl grid-cols-2 gap-y-8 lg:grid-cols-4">
          {s.stats.map((st, i) => (
            <div key={i} className={`px-4 text-center ${i % 2 === 1 ? "border-l border-gold/40" : ""} ${i > 0 ? "lg:border-l lg:border-gold/40" : ""}`}>
              <dt className="sr-only">{st.label}</dt>
              <dd className="font-heading text-[32px] font-extrabold text-navy-dark sm:text-[38px]">{statValue(st.value, data, i)}</dd>
              <dd className="mt-1 text-sm text-ink/80">{st.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 6. Training categories */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">{h.categoriesEyebrow}</p>
              <h2 className="h2 mt-3">{h.categoriesHeading}</h2>
            </div>
            <Link href="/services" className="link-gold">
              View all courses <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {data.categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/services/${c.slug}`} className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <SafeImage src={c.imageUrl} alt={c.shortName} fill sizes="(min-width:1024px) 20vw, (min-width:640px) 45vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="font-heading text-2xl font-extrabold text-gold">{c.code}</span>
                    <h3 className="mt-1 font-heading text-[17px] font-bold leading-snug text-navy-dark">{c.shortName}</h3>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-gold">
                      Explore courses <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" aria-hidden />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. The GSI standard */}
      <section className="section bg-white">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] shadow-xl">
            <SafeImage src={h.standardImage} alt="Trainees in PPE during practical industrial training" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
            <div className="absolute bottom-6 left-6 border-l-4 border-gold bg-navy-dark/90 px-6 py-5 sm:bottom-8 sm:left-8">
              <p className="font-heading text-lg font-bold leading-snug text-white sm:text-xl">
                {h.standardCaption1}
                <br />
                {h.standardCaption2}
              </p>
            </div>
          </div>
          <div>
            <p className="eyebrow">{h.standardEyebrow}</p>
            <h2 className="h2 mt-3">
              {h.standardHeading1}
              <br />
              {h.standardHeading2}
            </h2>
            <ul className="mt-8 space-y-6">
              {[
                { icon: UserRound, t: "Independent competency assessment", d: "Objective assessment to confirm skill and understanding." },
                { icon: Settings2, t: "Built around Gulf industry requirements", d: "Relevant, up-to-date training for real operational demands." },
                { icon: UsersRound, t: "Training at your site or ours", d: "Flexible delivery tailored to your operational needs." },
              ].map(({ icon: Icon, t, d }) => (
                <li key={t} className="flex gap-5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy text-gold">
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <div className="pt-1.5">
                    <h3 className="font-heading text-base font-bold text-navy-dark">{t}</h3>
                    <p className="mt-1 text-sm text-muted">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 8. Industries */}
      <section className="bg-navy-dark py-14 text-white sm:py-16">
        <div className="container-x">
          <h2 className="font-heading text-[24px] font-extrabold sm:text-[30px]">{h.industriesHeading}</h2>
          <ul className="mt-10 grid grid-cols-2 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {INDUSTRIES.map((n, i) => (
              <li key={n} className={`flex flex-col items-center gap-3 px-2 text-center ${i > 0 ? "lg:border-l lg:border-white/15" : ""}`}>
                <IndustryIcon name={n} className="h-14 w-14 text-gold" />
                <span className="font-heading text-sm font-semibold sm:text-base">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9. Verification process */}
      <section className="section bg-white">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-12">
          <div>
            <p className="eyebrow">Certificate Verification</p>
            <h2 className="h2 mt-3">{h.verifyHeading}</h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-0">
              {[
                { icon: FileText, t: "Find the certificate number", d: "Locate the unique certificate number on the worker's card." },
                { icon: QrCode, t: "Enter it or scan the QR code", d: "Type the number above or scan the QR code." },
                { icon: CircleCheck, t: "View verified credentials", d: "Instantly see the certificate details and status." },
              ].map(({ icon: Icon, t, d }, i) => (
                <li key={t} className={`sm:px-6 ${i > 0 ? "sm:border-l sm:border-black/10" : "sm:pl-0"}`}>
                  <div className="flex items-center gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-cream font-heading text-sm font-extrabold text-gold">{String(i + 1).padStart(2, "0")}</span>
                    <Icon className="h-8 w-8 text-navy-dark" strokeWidth={1.4} aria-hidden />
                  </div>
                  <h3 className="mt-5 font-heading text-[15px] font-bold text-navy-dark">{t}</h3>
                  <p className="mt-2 text-sm text-muted">{d}</p>
                </li>
              ))}
            </ol>
          </div>
          <figure className="lg:border-l lg:border-black/10 lg:pl-10">
            <figcaption className="text-xs font-medium text-muted">Sample result (illustration only)</figcaption>
            <div className="card mt-2 p-5" aria-hidden="true">
              <div className="flex items-start justify-between">
                <div className="relative h-14 w-28">
                  <SafeImage src={s.logoUrl || "/brand/gsi-logo.png"} alt="" fill sizes="112px" className="object-contain" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-bold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED
                </span>
              </div>
              <p className="mt-1 font-heading text-sm font-extrabold text-navy">{s.instituteName}</p>
              <dl className="mt-3 grid grid-cols-[100px_1fr] gap-y-1.5 text-xs">
                <dt className="text-muted">Name</dt><dd className="text-ink">Sample Trainee</dd>
                <dt className="text-muted">Course</dt><dd className="text-ink">Working at Height</dd>
                <dt className="text-muted">Certificate No.</dt><dd className="text-ink">{s.certificatePrefix}-0000-000000</dd>
                <dt className="text-muted">Issue Date</dt><dd className="text-ink">DD MMM YYYY</dd>
                <dt className="text-muted">Status</dt><dd className="font-semibold text-success">Valid</dd>
              </dl>
            </div>
          </figure>
        </div>
      </section>

      {/* 10. Locations */}
      <section className="bg-cream py-16 sm:py-20">
        <div className="container-x">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow">Our Locations</p>
              <h2 className="h2 mt-3">{h.locationsHeading}</h2>
            </div>
            <p className="max-w-xs text-sm text-muted">{h.locationsText}</p>
          </div>
          {data.locations.length === 0 ? (
            <p className="mt-8 text-muted">Locations will be published soon.</p>
          ) : (
            <ul className="mt-10 grid gap-5 md:grid-cols-2">
              {data.locations.slice(0, 4).map((l) => (
                <li key={l.id} className="card flex flex-col overflow-hidden sm:flex-row">
                  <div className="relative aspect-[16/9] sm:aspect-auto sm:w-[42%] sm:shrink-0">
                    <SafeImage src={l.imageUrl} alt={`${l.city}, ${l.country}`} fill sizes="(min-width:768px) 22vw, 100vw" className="object-cover" />
                  </div>
                  <div className="flex gap-3 p-5 sm:p-6">
                    <MapPin className="mt-0.5 h-6 w-6 shrink-0 text-gold" aria-hidden />
                    <div>
                      <h3 className="font-heading text-base font-bold text-navy-dark">{l.name}</h3>
                      <p className="text-xs text-muted">{[l.label, l.country].filter(Boolean).join(" · ")}</p>
                      {l.description && <p className="mt-3 text-sm text-ink/80">{l.description}</p>}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 11. Industry requirements strip */}
      {names.length > 0 && (
        <section aria-label="Contractor requirements" className="bg-white py-8">
          <div className="container-x text-center">
            <p className="text-xs text-muted">{h.alignmentText}</p>
            <div className="mx-auto mt-3 h-px max-w-md bg-black/10" />
            <p className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-heading text-sm font-semibold tracking-[0.12em] text-navy-dark">
              {names.map((n, i) => (
                <span key={n} className="flex items-center gap-5">
                  {i > 0 && <span className="text-gold" aria-hidden>•</span>}
                  {n}
                </span>
              ))}
            </p>
            <p className="sr-only">These names indicate contractor requirements our training is designed around; they do not indicate a partnership or accreditation.</p>
          </div>
        </section>
      )}

      {/* 12. Corporate training CTA */}
      <section className="relative isolate overflow-hidden bg-navy-dark text-white">
        <SafeImage src={h.ctaImage} alt="" fill sizes="100vw" className="-z-20 object-cover object-right" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-dark via-navy-dark/85 to-navy-dark/20" />
        <div className="container-x py-16 sm:py-20">
          <h2 className="font-heading text-[28px] font-extrabold sm:text-[38px]">{h.ctaHeading}</h2>
          <p className="mt-2 text-base text-white/85 sm:text-lg">{h.ctaText}</p>
          <Link href="/request-quote" className="btn-gold mt-7 px-6 py-3.5">
            Request Corporate Training <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
