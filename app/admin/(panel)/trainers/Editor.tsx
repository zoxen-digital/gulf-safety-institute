"use client";
import Link from "next/link";
import { ActionForm, Checkbox, SelectField, SubmitButton, TextField } from "@/components/admin/Form";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { saveTrainer } from "./actions";

export type TrainerForm = { id?: string; name: string; designation: string; type: string; signatureUrl: string; location: string; isActive: boolean };

export function TrainerEditor({ v, locations, allowShared }: { v: TrainerForm; locations: { value: string; label: string }[]; allowShared: boolean }) {
  return (
    <ActionForm action={saveTrainer} successHref="/admin/trainers" className="grid gap-5 p-5 md:grid-cols-2">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <TextField name="name" label="Name" defaultValue={v.name} required />
      <TextField name="designation" label="Designation" defaultValue={v.designation} />
      <SelectField name="type" label="Type" defaultValue={v.type} options={[{ value: "TRAINER", label: "Trainer" }, { value: "APPROVER", label: "Approver" }]} required />
      <SelectField name="location" label="Location" defaultValue={v.location} options={locations} placeholder={allowShared ? "All locations (shared)" : "Select location"} required={!allowShared} />
      <div className="md:col-span-2"><AdminImageField name="signatureUrl" label="Signature" folder="misc" defaultValue={v.signatureUrl} aspect="aspect-[3/1]" fit="contain" help="PNG with transparent background works best on certificates." /></div>
      <Checkbox name="isActive" label="Active" defaultChecked={v.isActive} />
      <div className="flex gap-2 md:col-span-2"><SubmitButton /><Link href="/admin/trainers" className="btn-outline">Cancel</Link></div>
    </ActionForm>
  );
}
