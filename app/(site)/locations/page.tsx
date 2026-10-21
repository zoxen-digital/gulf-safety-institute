import type { Metadata } from "next";
import { getSiteData } from "@/lib/site-data";
import { PageHero } from "@/components/site/PageHero";
import { LocationsList } from "@/components/site/LocationsList";

export const metadata: Metadata = {
  title: "Locations",
  description: "GSI training centres and offices across Saudi Arabia and the GCC.",
  alternates: { canonical: "/locations" },
};
export const revalidate = 300;

export default async function LocationsPage() {
  const { locations, settings } = await getSiteData();
  return (
    <>
      <PageHero eyebrow="Our locations" title={settings.home.locationsHeading} text={settings.home.locationsText} image={locations[0]?.imageUrl || settings.home.heroImage} crumbs={[{ label: "Locations" }]} />
      <section className="section bg-cream">
        <div className="container-x">
          <LocationsList locations={locations} />
        </div>
      </section>
    </>
  );
}
