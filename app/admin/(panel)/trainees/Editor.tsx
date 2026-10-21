"use client";
import Link from "next/link";
import { ActionForm, SelectField, SubmitButton, TextField } from "@/components/admin/Form";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { saveTrainee } from "./actions";

export type TraineeForm = { id?: string; fullName: string; idNumber: string; nationality: string; dob: string; phone: string; email: string; company: string; photoUrl: string; homeLocation: string };

export function TraineeFields({ v, locations, requireLocation }: { v: TraineeForm; locations: { value: string; label: string }[]; requireLocation: boolean }) {
  return (
    <>
      <TextField name="fullName" label="Full name" defaultValue={v.fullName} required />
      <TextField name="idNumber" label="ID / Iqama / Passport No." defaultValue={v.idNumber} required help="Stored in full; only a masked version is shown publicly." />
      <TextField name="nationality" label="Nationality" defaultValue={v.nationality} />
      <TextField name="dob" label="Date of birth" type="date" defaultValue={v.dob} />
      <TextField name="phone" label="Phone" defaultValue={v.phone} />
      <TextField name="email" label="Email" type="email" defaultValue={v.email} />
      <TextField name="company" label="Company / Employer" defaultValue={v.company} />
      <SelectField name="homeLocation" label="Registered location" defaultValue={v.homeLocation} options={locations} placeholder={requireLocation ? "Select location" : "Not set"} required={requireLocation} />
      <div className="md:col-span-2"><AdminImageField name="photoUrl" label="Photo" folder="misc" defaultValue={v.photoUrl} aspect="aspect-[3/4] max-w-[150px]" help="Passport-style photo. Shown on the verification result and ID card." /></div>
    </>
  );
}

export function TraineeEditor({ v, locations, requireLocation }: { v: TraineeForm; locations: { value: string; label: string }[]; requireLocation: boolean }) {
  return (
    <ActionForm action={saveTrainee} successHref={(id) => `/admin/trainees/${id}`} className="grid gap-5 p-5 md:grid-cols-2">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <TraineeFields v={v} locations={locations} requireLocation={requireLocation} />
      <div className="flex gap-2 md:col-span-2"><SubmitButton /><Link href={v.id ? `/admin/trainees/${v.id}` : "/admin/trainees"} className="btn-outline">Cancel</Link></div>
    </ActionForm>
  );
}
