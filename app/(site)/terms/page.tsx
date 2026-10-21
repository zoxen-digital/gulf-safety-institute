import type { Metadata } from "next";
import { getLegalPage } from "@/lib/site-data";
import { LegalBody } from "@/components/site/LegalBody";

export const metadata: Metadata = { title: "Terms of Use", alternates: { canonical: "/terms" } };
export const revalidate = 300;

export default async function TermsPage() {
  const p = await getLegalPage("terms");
  return <LegalBody title={p.title} body={p.body} />;
}
