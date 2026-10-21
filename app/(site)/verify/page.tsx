import type { Metadata } from "next";
import { publicLookup } from "@/lib/verify-service";
import { VerifyPageBody } from "@/components/site/VerifyPageBody";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: "Verify a Certificate",
    description: "Verify a GSI training certificate or operator ID card online, 24/7, using the certificate number or QR code.",
    alternates: { canonical: "/verify" },
    // The search form is indexable; personal results are not.
    robots: q ? { index: false, follow: false } : undefined,
  };
}

export default async function VerifyPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q) || "";
  const outcome = await publicLookup(query);
  return <VerifyPageBody query={query.trim().toUpperCase()} outcome={outcome} />;
}
