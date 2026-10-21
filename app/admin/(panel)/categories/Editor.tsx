"use client";
import Link from "next/link";
import { ActionForm, Checkbox, SubmitButton, TextArea, TextField } from "@/components/admin/Form";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { saveCategory } from "./actions";

export type CategoryForm = { id?: string; code: string; name: string; shortName: string; slug: string; description: string; imageUrl: string; isActive: boolean; sortOrder: number };

export function CategoryEditor({ v }: { v: CategoryForm }) {
  return (
    <ActionForm action={saveCategory} successHref="/admin/categories" className="grid gap-5 p-5 md:grid-cols-2">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <TextField name="code" label="Code" defaultValue={v.code} required maxLength={4} help="Letter shown on cards, e.g. A" />
      <TextField name="name" label="Full name" defaultValue={v.name} required />
      <TextField name="shortName" label="Short name" defaultValue={v.shortName} help="Used on cards and menus" />
      <TextField name="slug" label="URL slug" defaultValue={v.slug} help="Leave blank to generate from the name" />
      <TextArea name="description" label="Description" defaultValue={v.description} className="md:col-span-2" rows={3} />
      <div className="md:col-span-2"><AdminImageField name="imageUrl" label="Category image" folder="products" defaultValue={v.imageUrl} /></div>
      <TextField name="sortOrder" label="Sort order" type="number" min={0} defaultValue={v.sortOrder} />
      <div className="flex items-end"><Checkbox name="isActive" label="Active (visible on website)" defaultChecked={v.isActive} /></div>
      <div className="flex gap-2 md:col-span-2"><SubmitButton /><Link href="/admin/categories" className="btn-outline">Cancel</Link></div>
    </ActionForm>
  );
}
