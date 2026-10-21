import Link from "next/link";
import { ResetForm } from "@/components/admin/AuthForms";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token || !/^[A-Za-z0-9_-]{20,100}$/.test(token))
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-xl font-bold text-navy-dark">Invalid link</h1>
        <p className="text-sm text-muted">This password reset link is missing or malformed.</p>
        <Link href="/admin/forgot-password" className="btn-navy w-full">Request a new link</Link>
      </div>
    );
  return <ResetForm token={token} />;
}
