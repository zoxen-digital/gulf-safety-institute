"use client";
import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, FileSpreadsheet, Loader2, TriangleAlert, Upload } from "lucide-react";
import { toast } from "@/components/admin/Toast";

type Preview = { total: number; valid: number; invalid: number; rows: { row: number; data: Record<string, string>; errors: string[] }[] };
type Report = { total: number; inserted: number; rejected: { row: number; error: string }[] };

export function ImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [onlyErrors, setOnlyErrors] = useState(false);

  async function send(mode: "preview" | "commit") {
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("mode", mode);
    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Import failed");
      if (mode === "preview") setPreview(j);
      else {
        setReport(j);
        setPreview(null);
        toast(true, `${j.inserted} certificate(s) imported`);
      }
    } catch (e) {
      toast(false, (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const reset = () => { setFile(null); setPreview(null); setReport(null); };

  if (report)
    return (
      <section className="rounded-[10px] border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-navy-dark"><CheckCircle2 className="h-5 w-5 text-success" aria-hidden /> Import complete</h2>
        <p className="mt-2 text-sm">{report.inserted} of {report.total} row(s) imported. {report.rejected.length} rejected.</p>
        {report.rejected.length > 0 && (
          <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto rounded-md bg-danger/5 p-4 text-sm">
            {report.rejected.map((r, i) => <li key={i}><strong>Row {r.row}:</strong> {r.error}</li>)}
          </ul>
        )}
        <div className="mt-5 flex gap-2"><Link href="/admin/certificates" className="btn-navy">View certificates</Link><button type="button" className="btn-outline" onClick={reset}>Import another file</button></div>
      </section>
    );

  const shown = preview ? (onlyErrors ? preview.rows.filter((r) => r.errors.length) : preview.rows) : [];
  return (
    <div className="space-y-6">
      <section className="rounded-[10px] border border-slate-200 bg-white p-6">
        <ol className="mb-5 list-decimal space-y-1 pl-5 text-sm text-ink/85">
          <li>Download the template and fill one row per certificate. Required: trainee_name, id_number, course, location, issue_date.</li>
          <li>Use exact course and location names from the admin panel. Dates as YYYY-MM-DD. Leave certificate_number blank to auto-generate; leave expiry_date blank to use the course validity.</li>
          <li>Upload, review the validation preview, then confirm. Only valid rows are imported; every rejected row is listed.</li>
        </ol>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="/api/admin/import" className="btn-outline"><Download className="h-4 w-4" aria-hidden /> Download template</a>
          <label className="btn-outline cursor-pointer">
            <FileSpreadsheet className="h-4 w-4" aria-hidden /> {file ? file.name : "Choose .xlsx or .csv"}
            <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0] || null); setPreview(null); }} />
          </label>
          <button type="button" className="btn-navy" disabled={!file || busy} onClick={() => send("preview")}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />} Validate file
          </button>
        </div>
      </section>

      {preview && (
        <section className="rounded-[10px] border border-slate-200 bg-white">
          <header className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-base font-bold text-navy-dark">Preview</h2>
              <p className="text-sm"><span className="font-semibold text-success">{preview.valid} valid</span> · <span className="font-semibold text-danger">{preview.invalid} with errors</span> · {preview.total} total</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} /> Show errors only</label>
              <button type="button" className="btn-gold" disabled={busy || preview.valid === 0} onClick={() => send("commit")}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Import {preview.valid} valid row(s)
              </button>
            </div>
          </header>
          {preview.invalid > 0 && <p className="flex items-center gap-2 border-b border-slate-100 bg-warning/5 px-5 py-3 text-sm"><TriangleAlert className="h-4 w-4 text-warning" aria-hidden /> Rows with errors will not be imported. Fix them in the file and import them separately.</p>}
          <div className="max-h-[60vh] overflow-auto">
            <table className="w-full min-w-[900px] text-xs">
              <caption className="sr-only">Import preview</caption>
              <thead className="sticky top-0 bg-slate-50"><tr>{["Row", "Certificate No.", "Trainee", "ID", "Course", "Location", "Issue", "Expiry", "Result"].map((h) => <th key={h} className="px-3 py-2 text-left font-semibold text-muted">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r) => (
                  <tr key={r.row} className={r.errors.length ? "bg-danger/5" : ""}>
                    <td className="px-3 py-2">{r.row}</td>
                    <td className="px-3 py-2 font-mono">{r.data.certificate_number || <span className="text-muted">auto</span>}</td>
                    <td className="px-3 py-2">{r.data.trainee_name}</td>
                    <td className="px-3 py-2 font-mono">{r.data.id_number}</td>
                    <td className="px-3 py-2">{r.data.course}</td>
                    <td className="px-3 py-2">{r.data.location}</td>
                    <td className="px-3 py-2">{r.data.issue_date}</td>
                    <td className="px-3 py-2">{r.data.expiry_date || <span className="text-muted">auto</span>}</td>
                    <td className="px-3 py-2">{r.errors.length ? <ul className="text-danger">{r.errors.map((e, i) => <li key={i}>{e}</li>)}</ul> : <span className="font-semibold text-success">OK</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
