"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { ActionForm, SelectField, SubmitButton, TextArea, TextField, useFormErrors } from "@/components/admin/Form";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { saveCertificate } from "./actions";

type Opt = { value: string; label: string };
export type CertFormValues = {
  id?: string; certificateNumber: string; trainee?: { id: string; label: string }; course: string; location: string; trainer: string; approver: string;
  level: string; company: string; project: string; enrollmentNumber: string; trainingStartDate: string; trainingEndDate: string;
  issueDate: string; expiryDate: string; notes: string;
};

function addMonths(iso: string, m: number) {
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return "";
  d.setUTCMonth(d.getUTCMonth() + m);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function TraineePicker({ initial }: { initial?: { id: string; label: string } }) {
  const { errors } = useFormErrors();
  const [sel, setSel] = useState(initial);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ id: string; fullName: string; idNumber: string; company: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(t.current);
    if (q.trim().length < 2) return setRes([]);
    t.current = setTimeout(async () => {
      setLoading(true);
      const r = await fetch(`/api/admin/trainees/search?q=${encodeURIComponent(q)}`).then((x) => x.json()).catch(() => ({ results: [] }));
      setRes(r.results || []);
      setLoading(false);
    }, 250);
  }, [q]);
  return (
    <div className="md:col-span-2">
      <input type="hidden" name="trainee" value={sel?.id || ""} />
      {sel ? (
        <div className="flex items-center justify-between rounded-md border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm">
          <span className="font-medium">{sel.label}</span>
          <button type="button" onClick={() => setSel(undefined)} className="text-muted hover:text-danger" aria-label="Change trainee"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <div className="relative">
          <label htmlFor="tp-q" className="label">Find trainee <span className="text-danger">*</span></label>
          <Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" aria-hidden />
          <input id="tp-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type a name or ID number" className="input pl-9" autoComplete="off" role="combobox" aria-expanded={res.length > 0} aria-controls="tp-list" />
          {(res.length > 0 || loading) && (
            <ul id="tp-list" role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg">
              {loading && <li className="px-3 py-2 text-sm text-muted">Searching...</li>}
              {res.map((r) => (
                <li key={r.id} role="option" aria-selected={false}>
                  <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-cream" onClick={() => { setSel({ id: r.id, label: `${r.fullName} · ${r.idNumber}` }); setQ(""); setRes([]); }}>
                    <span className="font-medium">{r.fullName}</span> <span className="font-mono text-xs text-muted">{r.idNumber}</span> {r.company && <span className="text-xs text-muted">· {r.company}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {errors.trainee && <p className="mt-1 text-xs text-danger">{errors.trainee}</p>}
    </div>
  );
}

export function CertificateForm({ v, courses, locations, trainers, approvers }: { v: CertFormValues; courses: (Opt & { validity: number; name: string })[]; locations: Opt[]; trainers: Opt[]; approvers: Opt[] }) {
  const [mode, setMode] = useState<"existing" | "new">(v.trainee || v.id ? "existing" : "existing");
  const [course, setCourse] = useState(v.course);
  const [issue, setIssue] = useState(v.issueDate);
  const [expiry, setExpiry] = useState(v.expiryDate);
  const [touchedExpiry, setTouchedExpiry] = useState(Boolean(v.id));
  useEffect(() => {
    if (touchedExpiry) return;
    const m = courses.find((c) => c.name.toLowerCase() === course.trim().toLowerCase())?.validity;
    if (m && issue) setExpiry(addMonths(issue, m));
  }, [course, issue, touchedExpiry, courses]);

  return (
    <ActionForm action={saveCertificate} successHref={(id) => `/admin/certificates/${id}`} className="space-y-6">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <input type="hidden" name="traineeMode" value={mode} />
      <fieldset className="rounded-[10px] border border-slate-200 bg-white p-5">
        <legend className="px-1 font-heading text-sm font-bold text-navy-dark">Trainee</legend>
        {!v.id && (
          <div role="radiogroup" aria-label="Trainee source" className="mb-4 flex gap-2">
            {(["existing", "new"] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`btn btn-sm border ${mode === m ? "border-navy bg-navy text-white" : "border-slate-300 bg-white text-navy"}`}>
                {m === "existing" ? "Existing trainee" : "New trainee"}
              </button>
            ))}
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          {mode === "existing" ? (
            <TraineePicker initial={v.trainee} />
          ) : (
            <>
              <TextField name="t_fullName" label="Full name" required />
              <TextField name="t_idNumber" label="ID / Iqama / Passport No." required />
              <TextField name="t_nationality" label="Nationality" />
              <TextField name="t_dob" label="Date of birth" type="date" />
              <TextField name="t_phone" label="Phone" />
              <TextField name="t_email" label="Email" type="email" />
              <TextField name="t_company" label="Trainee company" help="Defaults to the certificate company" />
              <div className="md:col-span-2"><AdminImageField name="t_photoUrl" label="Photo" folder="misc" aspect="aspect-[3/4] max-w-[150px]" /></div>
            </>
          )}
        </div>
      </fieldset>

      <fieldset className="grid gap-5 rounded-[10px] border border-slate-200 bg-white p-5 md:grid-cols-2">
        <legend className="px-1 font-heading text-sm font-bold text-navy-dark">Certification</legend>
        <div className="md:col-span-2">
          <TextField name="courseName" label="Course name" value={course} onChange={(e) => setCourse(e.target.value)} list="course-suggestions" placeholder="Type the course name, e.g. Rigger Level III Training" required autoComplete="off" help="Type any course. Suggestions from the course list appear while typing." />
          <datalist id="course-suggestions">{courses.map((c) => <option key={c.value} value={c.name} />)}</datalist>
        </div>
        <TextField name="level" label="Category (free text)" defaultValue={v.level} placeholder="e.g. Level III, Up to 5 Ton" help="Type anything. Shown on the certificate and QR page." />
        <SelectField name="location" label="Training location" defaultValue={v.location} options={locations} placeholder="Select location" required />
        <TextField name="company" label="Company / Employer" defaultValue={v.company} />
        <TextField name="project" label="Project" defaultValue={v.project} />
        <SelectField name="trainer" label="Trainer" defaultValue={v.trainer} options={trainers} placeholder="Not set" />
        <SelectField name="approver" label="Approved by" defaultValue={v.approver} options={approvers} placeholder="Not set" />
        <TextField name="trainingStartDate" label="Training start" type="date" defaultValue={v.trainingStartDate} />
        <TextField name="trainingEndDate" label="Training end" type="date" defaultValue={v.trainingEndDate} />
        <TextField name="issueDate" label="Issue date" type="date" value={issue} onChange={(e) => setIssue(e.target.value)} required />
        <TextField name="expiryDate" label="Expiry date" type="date" value={expiry} onChange={(e) => { setTouchedExpiry(true); setExpiry(e.target.value); }} required help={touchedExpiry ? undefined : "Suggested from the course's default validity"} />
        <TextField name="enrollmentNumber" label="Enrollment No. (ENR)" defaultValue={v.enrollmentNumber} />
        <TextField name="certificateNumber" label="Certificate number" defaultValue={v.certificateNumber} placeholder="Auto-generated if blank" help={v.id ? "Changing it breaks previously printed QR codes." : "Leave blank to generate GSI-YYYY-000001"} className="uppercase" />
        <TextArea name="notes" label="Internal notes" defaultValue={v.notes} rows={3} className="md:col-span-2" help="Never shown publicly." />
      </fieldset>
      <div className="flex gap-2">
        <SubmitButton className="btn-gold">{v.id ? "Save changes" : "Issue certificate"}</SubmitButton>
        <Link href={v.id ? `/admin/certificates/${v.id}` : "/admin/certificates"} className="btn-outline">Cancel</Link>
      </div>
    </ActionForm>
  );
}
