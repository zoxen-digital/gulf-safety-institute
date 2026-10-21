import Link from "next/link";
import { AlertOctagon, BadgeCheck, Clock3, Download, FileWarning, IdCard, SearchX, TriangleAlert } from "lucide-react";
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

export function VerifyResult({ outcome }: { outcome: LookupOutcome }) {
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
  const rows: [string, string][] = [
    ["Full name", r.fullName],
    ["ID / Iqama / Passport", r.maskedId],
    ["Nationality", r.nationality],
    ["Employer", r.employer],
    ["Course", r.course],
    ["Category", r.category],
    ["Level / Equipment class", r.level],
    ["Certificate No.", r.certificateNumber],
    ["Issue date", fmt(r.issueDate)],
    ["Expiry date", fmt(r.expiryDate)],
    ["Training location", r.location],
    ["Trainer", r.trainer],
    ["Approved by", r.approver],
  ].filter(([, v]) => v) as [string, string][];
  const n = encodeURIComponent(r.certificateNumber);

  return (
    <article className="card overflow-hidden" aria-labelledby="res-title">
      {r.isDemo && <p className="bg-danger px-6 py-2 text-center text-xs font-bold tracking-wide text-white">DEMO RECORD FOR TESTING - NOT A REAL CREDENTIAL</p>}
      <header className={`flex flex-wrap items-center justify-between gap-3 px-6 py-4 ${valid ? "bg-success/10" : "bg-warning/10"}`}>
        <h2 id="res-title" className={`flex items-center gap-2 font-heading text-lg font-extrabold ${valid ? "text-success" : "text-warning"}`}>
          {valid ? <BadgeCheck className="h-6 w-6" aria-hidden /> : <FileWarning className="h-6 w-6" aria-hidden />}
          {valid ? "VERIFIED – VALID" : "EXPIRED"}
        </h2>
        <p className="text-xs text-muted">Verified on {new Date(outcome.verifiedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" })} (KSA)</p>
      </header>
      {!valid && <p className="border-b border-warning/20 bg-warning/5 px-6 py-3 text-sm text-ink">This certificate was issued by GSI but expired on <strong>{fmt(r.expiryDate)}</strong>.</p>}
      <div className="grid gap-6 p-6 sm:grid-cols-[150px_1fr] sm:p-8">
        <div className="relative mx-auto aspect-[3/4] w-[150px] overflow-hidden rounded-md border border-black/10 bg-cream">
          <SafeImage src={r.photoUrl} alt={`Photo of ${r.fullName}`} fill sizes="150px" className="object-cover" />
        </div>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted">{k}</dt>
              <dd className={`mt-0.5 font-semibold ${k === "Certificate No." ? "font-mono text-navy" : "text-ink"}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <footer className="no-print flex flex-wrap gap-3 border-t border-black/5 bg-cream/60 px-6 py-4">
        <a href={`/api/public/certificates/${n}/certificate`} className="btn-navy btn-sm"><Download className="h-4 w-4" aria-hidden /> Certificate (PDF)</a>
        <a href={`/api/public/certificates/${n}/id-card`} className="btn-outline btn-sm"><IdCard className="h-4 w-4" aria-hidden /> ID Card (PDF)</a>
        <PrintButton />
      </footer>
    </article>
  );
}
