import { getSiteData } from "@/lib/site-data";
import { siteUrl } from "@/lib/site-url";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Logo } from "@/components/site/Logo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const data = await getSiteData();
  const s = data.settings;
  const appUrl = siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: `${s.instituteName} - ${s.instituteFullName}`,
    alternateName: s.instituteName,
    url: appUrl,
    description: s.seoDescription,
    areaServed: ["Saudi Arabia", "United Arab Emirates", "Qatar", "Kuwait", "Oman", "Bahrain"],
    ...(s.email ? { email: s.email } : {}),
    ...(s.phone ? { telephone: s.phone } : {}),
    ...(s.address ? { address: s.address } : {}),
    sameAs: Object.values(s.social).filter(Boolean),
  };
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded focus:bg-gold focus:px-4 focus:py-2 focus:text-navy-dark">
        Skip to content
      </a>
      <div className="bg-navy-dark text-[11px] text-white sm:text-xs">
        <div className="container-x flex h-9 items-center justify-between gap-4">
          <p className="truncate">{s.utilityText}</p>
          <p className="hidden md:block">Saudi Arabia · UAE · Qatar · Kuwait · Oman · Bahrain</p>
        </div>
      </div>
      <Header
        logo={<Logo logoUrl={s.logoUrl} name={s.instituteName} fullName={s.instituteFullName} />}
        categories={data.categories.map((c) => ({ code: c.code, shortName: c.shortName, slug: c.slug }))}
      />
      <main id="main">{children}</main>
      <Footer data={data} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </>
  );
}
