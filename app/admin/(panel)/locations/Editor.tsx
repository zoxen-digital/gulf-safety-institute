"use client";
import Link from "next/link";
import { ActionForm, Checkbox, SelectField, SubmitButton, TextArea, TextField } from "@/components/admin/Form";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { saveLocation } from "./actions";

const COUNTRIES = ["Saudi Arabia", "UAE", "Qatar", "Kuwait", "Oman", "Bahrain"].map((c) => ({ value: c, label: c }));

export type LocationForm = {
  id?: string; name: string; label: string; city: string; country: string; description: string; address: string; phone: string;
  email: string; mapUrl: string; imageUrl: string; isHeadOffice: boolean; isActive: boolean; sortOrder: number;
};

export function LocationEditor({ v }: { v: LocationForm }) {
  return (
    <ActionForm action={saveLocation} successHref="/admin/locations" className="grid gap-5 p-5 md:grid-cols-2">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <TextField name="name" label="Location name" defaultValue={v.name} required />
      <TextField name="label" label="Label" defaultValue={v.label} help="e.g. Head Office, Training Center" />
      <TextField name="city" label="City" defaultValue={v.city} required />
      <SelectField name="country" label="Country" defaultValue={v.country || "Saudi Arabia"} options={COUNTRIES} required />
      <TextArea name="description" label="Short description" defaultValue={v.description} className="md:col-span-2" rows={2} />
      <TextField name="address" label="Full address" defaultValue={v.address} className="md:col-span-2" />
      <TextField name="phone" label="Phone" defaultValue={v.phone} />
      <TextField name="email" label="Email" type="email" defaultValue={v.email} />
      <TextField name="mapUrl" label="Google Maps link" defaultValue={v.mapUrl} placeholder="https://maps.google.com/..." className="md:col-span-2" />
      <div className="md:col-span-2"><AdminImageField name="imageUrl" label="Photo" folder="pages" defaultValue={v.imageUrl} /></div>
      <TextField name="sortOrder" label="Sort order" type="number" min={0} defaultValue={v.sortOrder} />
      <div className="flex flex-col justify-end gap-3">
        <Checkbox name="isHeadOffice" label="Head office" defaultChecked={v.isHeadOffice} />
        <Checkbox name="isActive" label="Active (shown on website and in forms)" defaultChecked={v.isActive} />
      </div>
      <div className="flex gap-2 md:col-span-2">
        <SubmitButton>{v.id ? "Save changes" : "Create location"}</SubmitButton>
        <Link href="/admin/locations" className="btn-outline">Cancel</Link>
      </div>
    </ActionForm>
  );
}
