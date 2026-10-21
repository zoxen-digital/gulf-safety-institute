"use client";
import Link from "next/link";
import { ActionForm, Checkbox, SelectField, SubmitButton, TextArea, TextField } from "@/components/admin/Form";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { saveCourse } from "./actions";

export type CourseForm = {
  id?: string; category: string; name: string; slug: string; shortDescription: string; description: string; whoShouldAttend: string; duration: string;
  defaultValidityMonths: number; deliveryMode: string; imageUrl: string; showOnWebsite: boolean; isActive: boolean; sortOrder: number;
};

export function CourseEditor({ v, categories }: { v: CourseForm; categories: { value: string; label: string }[] }) {
  return (
    <ActionForm action={saveCourse} successHref="/admin/courses" className="grid gap-5 p-5 md:grid-cols-2">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <TextField name="name" label="Course name" defaultValue={v.name} required className="md:col-span-2" />
      <SelectField name="category" label="Category" defaultValue={v.category} options={categories} placeholder="Select category" required />
      <TextField name="slug" label="URL slug" defaultValue={v.slug} help="Leave blank to generate from the name" />
      <TextArea name="shortDescription" label="Short description" defaultValue={v.shortDescription} rows={2} className="md:col-span-2" />
      <TextArea name="description" label="Overview" defaultValue={v.description} rows={5} className="md:col-span-2" />
      <TextArea name="whoShouldAttend" label="Who should attend" defaultValue={v.whoShouldAttend} rows={3} className="md:col-span-2" />
      <TextField name="duration" label="Duration" defaultValue={v.duration} placeholder="e.g. 3 days" />
      <TextField name="defaultValidityMonths" label="Default certificate validity (months)" type="number" min={1} max={120} defaultValue={v.defaultValidityMonths} required />
      <TextField name="deliveryMode" label="Delivery mode" defaultValue={v.deliveryMode} />
      <TextField name="sortOrder" label="Sort order" type="number" min={0} defaultValue={v.sortOrder} />
      <div className="md:col-span-2"><AdminImageField name="imageUrl" label="Course image" folder="products" defaultValue={v.imageUrl} help="Optional. The category image is used when empty." /></div>
      <div className="flex flex-col gap-3 md:col-span-2">
        <Checkbox name="showOnWebsite" label="Show on website" defaultChecked={v.showOnWebsite} />
        <Checkbox name="isActive" label="Active (available for new certificates)" defaultChecked={v.isActive} />
      </div>
      <div className="flex gap-2 md:col-span-2"><SubmitButton /><Link href="/admin/courses" className="btn-outline">Cancel</Link></div>
    </ActionForm>
  );
}
