import Link from "next/link";
import { AlertOctagon, BadgeCheck, Clock3, Download, FileWarning, IdCard, QrCode, SearchX, TriangleAlert } from "lucide-react";
import { SafeImage } from "@/components/SafeImage";
import type { LookupOutcome } from "@/lib/verify-service";
import { PrintButton } from "./PrintButton";

const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "-");

function Notice({ tone, icon: Icon, title, children }: { tone: "danger" | "warning" | "muted"; icon: typeof SearchX; title: string; children: React.ReactNode }) {
  const c = tone === "danger" ? "border-danger/30 bg-danger/5 text-danger" : tone === "warning" ? "border-warning/30 bg-warning/5 text-warning" : "border-black/10 bg-cream text-navy";
  return (
    <div role="alert" className={`rounded-[10px] border p-6 sm:p-8 ${c}`}>
      <div className="flex items-start gap-4">
        <Icon className="h-8 w-8 shrink-0" aria-hidden />
        <div className="text-ink">
          <h2 className={`font-heading text-xl font-bold ${tone === "muted" ? "text-navy" : ""}`} style={{ color: "inherit" }}>{title}</h2>
          <div className="mt-2 text-sm text-ink/85">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function VerifyResult({ outcome, instituteName }: { outcome: LookupOutcome; instituteName: string }) {
  if (outcome.kind === "EMPTY") return null;
  if (outcome.kind === "INVALID")
    return <Notice tone="danger" icon={SearchX} title="Invalid certificate number">Certificate numbers contain only letters, digits and dashes, for example GSI-2026-000123. Please check and try again.</Notice>;
  if (outcome.kind === "RATE_LIMITED")
    return <Notice tone="warning" icon={Clock3} title="Too many searches">Please wait a minute before trying again.</Notice>;
  if (outcome.kind === "UNAVAILABLE")
    return <Notice tone="warning" icon={TriangleAlert} title="Verification temporarily unavailable">We could not reach the verification service. Please try again shortly or <Link className="font-semibold underline" href="/contact">contact GSI</Link>.</Notice>;

  const r = outcome.result;
  if (r.kind === "NOT_FOUND")
    return (
      <Notice tone="danger" icon={SearchX} title="No certificate found">
        <p>No certificate was found with the number <strong className="font-mono">{r.searched}</strong>. Please check the number and try again, or contact GSI for help.</p>
        <div className="mt-4 flex flex-wrap gap-3"><Link href="/verify" className="btn-navy btn-sm">Try again</Link><Link href="/contact?type=Certificate%20Verification%20Help" className="btn-outline btn-sm">Contact GSI</Link></div>
      </Notice>
    );
  if (r.kind !== "VALID" && r.kind !== "EXPIRED")
    return (
      <Notice tone="danger" icon={AlertOctagon} title={r.kind === "REVOKED" ? "Certificate revoked" : "Certificate suspended"}>
        <dl className="mt-1 grid grid-cols-[140px_1fr] gap-y-1">
          <dt className="text-muted">Certificate No.</dt><dd className="font-mono font-semibold">{r.certificateNumber}</dd>
          <dt className="text-muted">Name</dt><dd className="font-semibold">{r.fullName}</dd>
          <dt className="text-muted">Status</dt><dd className="font-bold text-danger">{r.kind}</dd>
        </dl>
        <p className="mt-4">This certificate is {r.kind === "REVOKED" ? "revoked" : "suspended"} and is not currently valid. Please <Link className="font-semibold underline" href="/contact?type=Certificate%20Verification%20Help">contact GSI</Link> for details.</p>
      </Notice>
    );


  const valid = r.kind === "VALID";
  const long = (iso: string) => (iso ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }).replace(/ /g, "-") : "-");
  const rows: [string, string][] = [
    ["Certificate No", r.certificateNumber],
    ["Name", r.fullName.toUpperCase()],
    ["Company Name", (r.employer || "Individual").toUpperCase()],
    ["ID No", r.idDisplay],
    ["Course Name", r.course.toUpperCase()],
    ...(r.level ? ([["Category", r.level.toUpperCase()]] as [string, string][]) : []),
    ["Issue Date", long(r.issueDate)],
    ["Expiry Date", long(r.expiryDate)],
  ];
  const n = encodeURIComponent(r.certificateNumber);

  return (
    <article className="card overflow-hidden" aria-labelledby="res-title">
      {r.isDemo && <p className="bg-danger px-6 py-2 text-center text-xs font-bold tracking-wide text-white">DEMO RECORD FOR TESTING - NOT A REAL CREDENTIAL</p>}
      <header className="px-5 pt-6 text-center sm:px-8">
        <p className="font-heading text-xl font-extrabold uppercase tracking-wide text-navy-dark sm:text-2xl">{instituteName}</p>
        <h2 id="res-title" className={`mt-4 flex items-center justify-center gap-2 rounded-md border px-4 py-3 text-base font-semibold ${valid ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}>
          {valid ? <><span>Certificate Is Verified</span><BadgeCheck className="h-6 w-6" aria-hidden /></> : <><FileWarning className="h-6 w-6" aria-hidden /><span>Certificate Expired on {long(r.expiryDate)}</span></>}
        </h2>
      </header>
      <div className="no-print flex flex-wrap gap-2 px-5 pt-4 sm:px-8">
        <a href={`/api/public/certificates/${n}/qr`} download={`QR-${r.certificateNumber}.png`} className="btn-navy btn-sm"><QrCode className="h-4 w-4" aria-hidden /> Download QR Code</a>
        <a href={`/api/public/certificates/${n}/certificate`} className="btn-outline btn-sm"><Download className="h-4 w-4" aria-hidden /> Certificate (PDF)</a>
        <a href={`/api/public/certificates/${n}/id-card`} className="btn-outline btn-sm"><IdCard className="h-4 w-4" aria-hidden /> ID Card (PDF)</a>
        <PrintButton />
      </div>
      <div className="grid gap-6 px-5 py-6 sm:grid-cols-[1fr_170px] sm:px-8">
        <dl className="space-y-3">
          {rows.map(([k, v]) => (
            <div key={k} className="text-[17px] leading-snug sm:text-lg">
              <dt className="inline font-heading font-bold text-navy-dark">{k}:</dt>{" "}
              <dd className="inline break-words font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-row items-end justify-end gap-4 sm:flex-col sm:items-end">
          <div className="relative aspect-[3/4] w-[140px] overflow-hidden rounded-md bg-cream sm:w-[170px]">
            <SafeImage src={r.photoUrl} alt={`Photo of ${r.fullName}`} fill sizes="170px" className="object-cover" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/public/certificates/${n}/qr`} alt={`QR code for certificate ${r.certificateNumber}`} width={120} height={120} className="h-[110px] w-[110px] sm:h-[120px] sm:w-[120px]" />
        </div>
      </div>
      <p className="border-t border-black/5 px-5 py-3 text-xs text-muted sm:px-8">Verified on {new Date(outcome.verifiedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" })} (KSA) from {instituteName} records.</p>
    </article>
  );
}