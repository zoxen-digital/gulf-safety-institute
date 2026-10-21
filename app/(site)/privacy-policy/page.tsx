import type { Metadata } from "next";
import { getLegalPage } from "@/lib/site-data";
import { LegalBody } from "@/components/site/LegalBody";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy" } };
export const revalidate = 300;

export default async function PrivacyPage() {
  const p = await getLegalPage("privacy-policy");
  return <LegalBody title={p.title} body={p.body} />;
}
