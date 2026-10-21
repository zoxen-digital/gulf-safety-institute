import type { Metadata } from "next";
import { publicLookup } from "@/lib/verify-service";
import { getSettings } from "@/lib/site-data";
import { VerifyPageBody } from "@/components/site/VerifyPageBody";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Certificate Verification Result", robots: { index: false, follow: false } };

type Props = { params: Promise<{ certificateNumber: string }> };

/** QR code landing page: shows only the certificate details. */
export default async function VerifyNumberPage({ params }: Props) {
  const { certificateNumber } = await params;
  let raw = certificateNumber;
  try {
    raw = decodeURIComponent(certificateNumber);
  } catch {
    /* keep raw */
  }
  const [outcome, s] = await Promise.all([publicLookup(raw), getSettings()]);
  return <VerifyPageBody query={raw.trim().toUpperCase()} outcome={outcome} instituteName={s.instituteFullName} compact />;
}
