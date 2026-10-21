import { Lock, QrCode, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "./PageHero";
import { VerifyForm } from "./VerifyForm";
import { VerifyResult } from "./VerifyResult";
import type { LookupOutcome } from "@/lib/verify-service";

export function VerifyPageBody({ query, outcome }: { query: string; outcome: LookupOutcome }) {
  return (
    <>
      <section className="bg-navy-dark pb-28 pt-12 text-white sm:pt-16">
        <div className="container-x max-w-4xl">
          <Breadcrumbs items={[{ label: "Certificate Verification" }]} light />
          <p className="eyebrow mt-6">Certificate verification</p>
          <h1 className="mt-3 font-heading text-[30px] font-extrabold leading-tight sm:text-[42px]">Verify a GSI certificate</h1>
          <p className="mt-3 max-w-2xl text-white/80">Enter the certificate number printed on the card or certificate, or scan its QR code. Results come directly from GSI records.</p>
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
              <span className="flex items-center gap-1.5"><QrCode className="h-3.5 w-3.5" aria-hidden /> QR codes open this page automatically</span>
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" aria-hidden /> Personal details are partially masked</span>
            </p>
          </div>
          <div aria-live="polite">
            <VerifyResult outcome={outcome} />
          </div>
        </div>
      </section>
    </>
  );
}
