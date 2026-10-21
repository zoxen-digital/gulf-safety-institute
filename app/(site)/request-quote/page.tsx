import type { Metadata } from "next";
import { getSiteData } from "@/lib/site-data";
import { PageHero } from "@/components/site/PageHero";
import { ContactBody } from "@/components/site/ContactPage";

export const metadata: Metadata = {
  title: "Request Corporate Training",
  description: "Request on-site corporate safety and technical training for your project site, refinery or shutdown turnaround.",
  alternates: { canonical: "/request-quote" },
};

export default async function RequestQuotePage() {
  const data = await getSiteData();
  return (
    <>
      <PageHero eyebrow="Corporate training" title={data.settings.home.ctaHeading} text="Tell us about your team, site and schedule. We will prepare a training plan and quotation for on-site or centre-based delivery." image={data.settings.home.ctaImage} crumbs={[{ label: "Request Corporate Training" }]} />
      <ContactBody data={data} defaultType="Corporate On-Site Training" />
    </>
  );
}
