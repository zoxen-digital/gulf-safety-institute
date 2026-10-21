"use client";
import { ActionForm, SelectField, SubmitButton, TextArea } from "@/components/admin/Form";
import { updateInquiry } from "./actions";

export function InquiryEditor({ id, status, notes }: { id: string; status: string; notes: string }) {
  return (
    <ActionForm action={updateInquiry} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <SelectField name="status" label="Status" defaultValue={status} options={[{ value: "NEW", label: "New" }, { value: "IN_PROGRESS", label: "In progress" }, { value: "CLOSED", label: "Closed" }]} />
      <TextArea name="notes" label="Internal notes" defaultValue={notes} rows={4} help="Visible to admin users only." />
      <SubmitButton>Update</SubmitButton>
    </ActionForm>
  );
}
