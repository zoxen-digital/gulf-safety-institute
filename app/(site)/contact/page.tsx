import type { Metadata } from "next";
import { getSiteData } from "@/lib/site-data";
import { INQUIRY_TYPES } from "@/lib/inquiry";
import { PageHero } from "@/components/site/PageHero";
import { ContactBody } from "@/components/site/ContactPage";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact GSI about safety training, operator courses, corporate on-site training or certificate verification.",
  alternates: { canonical: "/contact" },
};

type Props = { searchParams: Promise<{ type?: string; course?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const sp = await searchParams;
  const data = await getSiteData();
  const type = (INQUIRY_TYPES as readonly string[]).includes(sp.type || "") ? sp.type! : "Course Inquiry";
  const course = data.categories.some((c) => c.courses.some((k) => k.slug === sp.course)) ? sp.course : "";
  return (
    <>
      <PageHero eyebrow="Contact us" title="Talk to our training team." text="Send us your course requirements, number of trainees and preferred location. We respond to every inquiry." image={data.settings.home.standardImage} crumbs={[{ label: "Contact Us" }]} />
      <ContactBody data={data} defaultType={type} defaultCourse={course} />
    </>
  );
}
