import Link from "next/link";
import { ChevronLeft, ChevronRight, Inbox, Search } from "lucide-react";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-navy-dark">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  VALID: "bg-success/10 text-success border-success/20",
  ACTIVE: "bg-success/10 text-success border-success/20",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
  EXPIRED: "bg-warning/10 text-warning border-warning/20",
  IN_PROGRESS: "bg-warning/10 text-warning border-warning/20",
  SUSPENDED: "bg-orange-100 text-orange-700 border-orange-200",
  REVOKED: "bg-danger/10 text-danger border-danger/20",
  NOT_FOUND: "bg-danger/10 text-danger border-danger/20",
  INACTIVE: "bg-slate-100 text-slate-600 border-slate-200",
  NEW: "bg-navy/10 text-navy border-navy/20",
  DEMO: "bg-danger text-white border-danger",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${TONES[value] || "border-slate-200 bg-slate-100 text-slate-700"}`}>
      {label || value.replace("_", " ")}
    </span>
  );
}

export function Panel({ title, children, actions, className = "" }: { title?: string; children: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[10px] border border-slate-200 bg-white ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          {title && <h2 className="font-heading text-sm font-bold text-navy-dark">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Empty({ title = "Nothing here yet", text, action }: { title?: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <Inbox className="h-10 w-10 text-slate-300" aria-hidden />
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** GET filter bar; preserves other params passed as hidden fields. */
export function FilterBar({ q, placeholder = "Search...", children, hidden = {} }: { q: string; placeholder?: string; children?: React.ReactNode; hidden?: Record<string, string> }) {
  return (
    <form method="get" className="flex flex-col gap-2 border-b border-slate-100 p-4 md:flex-row md:flex-wrap md:items-end">
      {Object.entries(hidden).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <div className="relative min-w-[220px] flex-1">
        <label htmlFor="flt-q" className="sr-only">Search</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <input id="flt-q" name="q" defaultValue={q} placeholder={placeholder} className="input pl-9" />
      </div>
      {children}
      <button type="submit" className="btn-navy py-2.5">Apply</button>
    </form>
  );
}

export function FilterSelect({ name, label, value, options }: { name: string; label: string; value: string; options: { value: string; label: string }[] }) {
  return (
    <div className="min-w-[150px]">
      <label htmlFor={`flt-${name}`} className="mb-1 block text-xs font-medium text-muted">{label}</label>
      <select id={`flt-${name}`} name={name} defaultValue={value} className="input py-2.5">
        <option value="">All</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Pagination({ page, total, perPage, params }: { page: number; total: number; perPage: number; params: Record<string, string> }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const href = (p: number) => "?" + new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), page: String(p) }).toString();
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm">
      <p className="text-muted">{total === 0 ? "No results" : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}`}</p>
      <div className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className="btn-outline btn-sm" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Link> : <span className="btn-outline btn-sm opacity-40" aria-hidden><ChevronLeft className="h-4 w-4" /></span>}
        <span className="px-2 py-2 text-xs text-muted">Page {page} / {pages}</span>
        {page < pages ? <Link href={href(page + 1)} className="btn-outline btn-sm" aria-label="Next page"><ChevronRight className="h-4 w-4" /></Link> : <span className="btn-outline btn-sm opacity-40" aria-hidden><ChevronRight className="h-4 w-4" /></span>}
      </div>
    </nav>
  );
}

export function SortLink({ field, label, sort, dir, params }: { field: string; label: string; sort: string; dir: 1 | -1; params: Record<string, string> }) {
  const next = sort === field && dir === -1 ? "asc" : "desc";
  const href = "?" + new URLSearchParams({ ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)), sort: field, dir: next }).toString();
  return (
    <Link href={href} className="inline-flex items-center gap-1 hover:text-navy" aria-sort={sort === field ? (dir === 1 ? "ascending" : "descending") : undefined}>
      {label}
      {sort === field && <span aria-hidden>{dir === 1 ? "▲" : "▼"}</span>}
    </Link>
  );
}

export const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted";
export const td = "px-4 py-3 align-middle";

export function Table({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}
