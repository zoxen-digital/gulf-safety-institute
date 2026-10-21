import Link from "next/link";
import { Lock, QrCode, Search, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "./PageHero";
import { VerifyForm } from "./VerifyForm";
import { VerifyResult } from "./VerifyResult";
import type { LookupOutcome } from "@/lib/verify-service";

/**
 * `compact` is the QR landing page (/verify/NUMBER): only the certificate details, no search hero.
 */
export function VerifyPageBody({ query, outcome, instituteName, compact = false }: { query: string; outcome: LookupOutcome; instituteName: string; compact?: boolean }) {
  if (compact)
    return (
      <section className="bg-slate-50 py-6 sm:py-10">
        <div className="container-x max-w-3xl space-y-4">
          <div aria-live="polite">
            <VerifyResult outcome={outcome} instituteName={instituteName} />
          </div>
          <p className="no-print text-center">
            <Link href="/verify" className="link-gold"><Search className="h-4 w-4" aria-hidden /> Verify another certificate</Link>
          </p>
        </div>
      </section>
    );
  return (
    <>
      <section className="bg-navy-dark pb-28 pt-12 text-white sm:pt-16">
        <div className="container-x max-w-4xl">
          <Breadcrumbs items={[{ label: "Certificate Verification" }]} light />
          <p className="eyebrow mt-6">Certificate verification</p>
          <h1 className="mt-3 font-heading text-[30px] font-extrabold leading-tight sm:text-[42px]">Verify a {instituteName} certificate</h1>
          <p className="mt-3 max-w-2xl text-white/80">Enter the certificate number printed on the card or certificate, or scan its QR code. Results come directly from {instituteName} records.</p>
        </div>
      </section>
      <section className="-mt-20 pb-20">
        <div className="container-x max-w-4xl space-y-6">
          <div className="card p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-navy" aria-hidden />
              <h2 className="font-heading text-lg font-bold text-navy-dark">Certificate Verification</h2>
            </div>
            <VerifyForm defaultValue={query} size="lg" buttonLabel="Verify" autoFocus={!query} />
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              <span className="flex items-center gap-1.5"><QrCode className="h-3.5 w-3.5" aria-hidden /> QR codes open the result page automatically</span>
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" aria-hidden /> Results come only from official records</span>
            </p>
          </div>
          <div aria-live="polite">
            <VerifyResult outcome={outcome} instituteName={instituteName} />
          </div>
        </div>
      </section>
    </>
  );
}
