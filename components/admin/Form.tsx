"use client";
import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "./Toast";

export type ActionResult = { ok: boolean; message?: string; errors?: Record<string, string>; id?: string; at?: number };
type Action = (prev: ActionResult, fd: FormData) => Promise<ActionResult>;

const ErrCtx = createContext<{ errors: Record<string, string>; pending: boolean }>({ errors: {}, pending: false });

export function ActionForm({
  action, children, className = "space-y-5", successHref, onSuccessRefresh = true, resetOnSuccess = false, successMessage,
}: {
  action: Action; children: React.ReactNode; className?: string; successHref?: string | ((id?: string) => string);
  onSuccessRefresh?: boolean; resetOnSuccess?: boolean; successMessage?: string;
}) {
  const [state, run, pending] = useActionState(action, { ok: true });
  const router = useRouter();
  const ref = useRef<HTMLFormElement>(null);
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!state.at || state.at === last.current) return;
    last.current = state.at;
    toast(state.ok, state.message || (state.ok ? successMessage || "Saved" : "Could not save"));
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      if (successHref) router.push(typeof successHref === "function" ? successHref(state.id) : successHref);
      else if (onSuccessRefresh) router.refresh();
    }
  }, [state, router, successHref, onSuccessRefresh, resetOnSuccess, successMessage]);
  return (
    <ErrCtx.Provider value={{ errors: state.errors || {}, pending }}>
      <form
        ref={ref}
        className={className}
        noValidate
        onSubmit={(e) => {
          // Submit manually so React does not reset uncontrolled fields when validation fails.
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => run(fd));
        }}
      >
        {!state.ok && state.message && <p role="alert" className="rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{state.message}</p>}
        {children}
      </form>
    </ErrCtx.Provider>
  );
}

export function useFormErrors() {
  return useContext(ErrCtx);
}

function Err({ name }: { name: string }) {
  const { errors } = useFormErrors();
  return errors[name] ? <p id={`err-${name}`} className="mt-1 text-xs text-danger">{errors[name]}</p> : null;
}

type Common = { name: string; label: string; help?: string; required?: boolean; className?: string };

export function TextField({ name, label, help, required, className = "", ...rest }: Common & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const { errors } = useFormErrors();
  return (
    <div className={className}>
      <label htmlFor={`fld-${name}`} className="label">{label}{required && <span className="text-danger"> *</span>}</label>
      <input id={`fld-${name}`} name={name} required={required} aria-invalid={Boolean(errors[name]) || undefined} aria-describedby={errors[name] ? `err-${name}` : undefined} className="input" {...rest} />
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
      <Err name={name} />
    </div>
  );
}

export function TextArea({ name, label, help, required, className = "", ...rest }: Common & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const { errors } = useFormErrors();
  return (
    <div className={className}>
      <label htmlFor={`fld-${name}`} className="label">{label}{required && <span className="text-danger"> *</span>}</label>
      <textarea id={`fld-${name}`} name={name} rows={4} required={required} aria-invalid={Boolean(errors[name]) || undefined} className="input" {...rest} />
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
      <Err name={name} />
    </div>
  );
}

export function SelectField({ name, label, help, required, className = "", options, placeholder, ...rest }: Common & { options: { value: string; label: string }[]; placeholder?: string } & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const { errors } = useFormErrors();
  return (
    <div className={className}>
      <label htmlFor={`fld-${name}`} className="label">{label}{required && <span className="text-danger"> *</span>}</label>
      <select id={`fld-${name}`} name={name} required={required} aria-invalid={Boolean(errors[name]) || undefined} className="input" {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {help && <p className="mt-1 text-xs text-muted">{help}</p>}
      <Err name={name} />
    </div>
  );
}

export function Checkbox({ name, label, defaultChecked, help }: { name: string; label: string; defaultChecked?: boolean; help?: string }) {
  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-slate-300 accent-[var(--navy)]" />
        {label}
      </label>
      {help && <p className="ml-6 mt-0.5 text-xs text-muted">{help}</p>}
    </div>
  );
}

export function SubmitButton({ children = "Save", className = "btn-navy" }: { children?: React.ReactNode; className?: string }) {
  const { pending } = useFormErrors();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {children}
    </button>
  );
}

/** Small inline form that posts a server action after a confirmation dialog. */
export function ConfirmAction({
  action, fields, label, confirmText, title = "Are you sure?", className = "btn-outline btn-sm", danger = false, reasonField, successHref,
}: {
  action: Action; fields: Record<string, string>; label: React.ReactNode; confirmText: string; title?: string; className?: string; danger?: boolean; reasonField?: { name: string; label: string }; successHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const dlg = useRef<HTMLDialogElement>(null);
  const [state, run, pending] = useActionState(action, { ok: true });
  const router = useRouter();
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (open) dlg.current?.showModal();
    else dlg.current?.close();
  }, [open]);
  useEffect(() => {
    if (!state.at || state.at === last.current) return;
    last.current = state.at;
    toast(state.ok, state.message || (state.ok ? "Done" : "Failed"));
    if (state.ok) {
      setOpen(false);
      if (successHref) router.push(successHref);
      else router.refresh();
    }
  }, [state, router, successHref]);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      <dialog ref={dlg} onClose={() => setOpen(false)} className="m-auto w-[min(92vw,440px)] rounded-[10px] p-0 shadow-2xl backdrop:bg-navy-dark/50">
        <form action={run} className="space-y-4 p-6">
          {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <h2 className="font-heading text-lg font-bold text-navy-dark">{title}</h2>
          <p className="text-sm text-muted">{confirmText}</p>
          {reasonField && (
            <div>
              <label htmlFor="cf-reason" className="label">{reasonField.label} <span className="text-danger">*</span></label>
              <textarea id="cf-reason" name={reasonField.name} required minLength={3} rows={3} className="input" />
            </div>
          )}
          {!state.ok && state.message && <p role="alert" className="text-sm text-danger">{state.message}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" disabled={pending} className={danger ? "btn-danger" : "btn-navy"}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Confirm
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
