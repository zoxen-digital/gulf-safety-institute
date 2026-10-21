import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/admin/ui";
import { ImportClient } from "./ImportClient";

export const metadata = { title: "Bulk Import" };

export default async function ImportPage() {
  await requireUser("import");
  return (
    <>
      <PageHeader title="Bulk import certificates" description="Import a training batch from Excel or CSV. Trainees are matched by ID number or created automatically." />
      <ImportClient />
    </>
  );
}
