import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/admin/AuthForms";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser().catch(() => null)) redirect("/admin");
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
