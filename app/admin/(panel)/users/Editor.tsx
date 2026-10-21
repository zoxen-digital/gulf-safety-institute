"use client";
import Link from "next/link";
import { ActionForm, Checkbox, SelectField, SubmitButton, TextField } from "@/components/admin/Form";
import { saveUser } from "./actions";

export type UserForm = { id?: string; name: string; email: string; role: string; locations: string[]; isActive: boolean };

export function UserEditor({ v, locations }: { v: UserForm; locations: { value: string; label: string }[] }) {
  return (
    <ActionForm action={saveUser} successHref="/admin/users" className="grid gap-5 p-5 md:grid-cols-2">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <TextField name="name" label="Full name" defaultValue={v.name} required />
      <TextField name="email" label="Email" type="email" defaultValue={v.email} required autoComplete="off" />
      <SelectField name="role" label="Role" defaultValue={v.role} required options={[
        { value: "SUPER_ADMIN", label: "Super Admin – full access" },
        { value: "MANAGER", label: "Manager – assigned locations, revoke, import" },
        { value: "STAFF", label: "Staff – data entry for assigned locations" },
      ]} />
      <TextField name="password" label={v.id ? "Set new password" : "Initial password"} type="password" autoComplete="new-password" required={!v.id} help={v.id ? "Leave blank to keep the current password. Changing it signs the user out." : "At least 10 characters with a letter and a number. Share it securely."} />
      <fieldset className="md:col-span-2">
        <legend className="label">Assigned locations</legend>
        <p className="mb-2 text-xs text-muted">Required for Managers and Staff. Super Admins see all locations.</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {locations.map((l) => (
            <label key={l.value} className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="locations" value={l.value} defaultChecked={v.locations.includes(l.value)} className="h-4 w-4 accent-[var(--navy)]" /> {l.label}
            </label>
          ))}
        </div>
      </fieldset>
      <Checkbox name="isActive" label="Active" defaultChecked={v.isActive} />
      <div className="flex gap-2 md:col-span-2"><SubmitButton /><Link href="/admin/users" className="btn-outline">Cancel</Link></div>
    </ActionForm>
  );
}
