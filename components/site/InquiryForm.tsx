"use client";
import { useActionState } from "react";
import { CheckCircle2, Loader2, Send, TriangleAlert } from "lucide-react";
import { submitInquiry, type InquiryState } from "@/app/(site)/contact/actions";
import { INQUIRY_TYPES } from "@/lib/inquiry";

const COUNTRIES = ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Oman", "Bahrain", "Other"];

type Props = { courses: { slug: string; name: string; group: string }[]; defaultType?: string; defaultCourse?: string };

export function InquiryForm({ courses, defaultType = "Course Inquiry", defaultCourse = "" }: Props) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiry, { status: "idle" });
  const e = state.errors || {};
  const groups = Array.from(new Set(courses.map((c) => c.group)));

  if (state.status === "success")
    return (
      <div role="status" className="card flex flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
        <h2 className="font-heading text-xl font-bold text-navy-dark">Inquiry sent</h2>
        <p className="max-w-md text-sm text-muted">{state.message}</p>
      </div>
    );

  const v: Record<string, string> = { type: defaultType, course: defaultCourse, country: "", ...(state.values || {}) };
  const field = (name: string) => ({ id: `f-${name}`, name, defaultValue: v[name], "aria-invalid": Boolean(e[name]) || undefined, "aria-describedby": e[name] ? `e-${name}` : undefined });
  const err = (name: string) => e[name] && <p id={`e-${name}`} className="mt-1 text-xs text-danger">{e[name]}</p>;

  return (
    <form key={JSON.stringify(v)} action={action} className="card space-y-5 p-6 sm:p-8" noValidate>
      {state.status === "error" && state.message && (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {state.message}
        </p>
      )}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="f-website">Website</label>
        <input id="f-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label className="label" htmlFor="f-name">Full name *</label><input {...field("name")} className="input" required autoComplete="name" />{err("name")}</div>
        <div><label className="label" htmlFor="f-company">Company</label><input {...field("company")} className="input" autoComplete="organization" />{err("company")}</div>
        <div><label className="label" htmlFor="f-email">Email *</label><input {...field("email")} type="email" className="input" required autoComplete="email" />{err("email")}</div>
        <div><label className="label" htmlFor="f-phone">Phone / WhatsApp *</label><input {...field("phone")} type="tel" className="input" required autoComplete="tel" />{err("phone")}</div>
        <div>
          <label className="label" htmlFor="f-country">Country</label>
          <select {...field("country")} className="input" >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {err("country")}
        </div>
        <div>
          <label className="label" htmlFor="f-type">Inquiry type *</label>
          <select {...field("type")} className="input" >
            {INQUIRY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          {err("type")}
        </div>
        <div>
          <label className="label" htmlFor="f-course">Course of interest</label>
          <select {...field("course")} className="input" >
            <option value="">Not sure / multiple</option>
            {groups.map((g) => (
              <optgroup key={g} label={g}>
                {courses.filter((c) => c.group === g).map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </optgroup>
            ))}
          </select>
          {err("course")}
        </div>
        <div><label className="label" htmlFor="f-traineesCount">Number of trainees</label><input {...field("traineesCount")} type="number" min={1} max={10000} inputMode="numeric" className="input" />{err("traineesCount")}</div>
      </div>
      <div><label className="label" htmlFor="f-message">Message *</label><textarea {...field("message")} rows={5} className="input" required />{err("message")}</div>
      <button type="submit" className="btn-gold w-full sm:w-auto" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
        {pending ? "Sending..." : "Send inquiry"}
      </button>
    </form>
  );
}
