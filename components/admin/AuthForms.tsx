"use client";
import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { forgotPasswordAction, loginAction, resetPasswordAction, type AuthState } from "@/app/admin/(auth)/actions";

function Msg({ s }: { s: AuthState }) {
  if (s.error) return <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm text-danger">{s.error}</p>;
  if (s.message) return <p role="status" className="rounded-md bg-success/10 p-3 text-sm text-success">{s.message}</p>;
  return null;
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={pending} className="btn-navy w-full">
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {children}
    </button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [s, a, p] = useActionState(loginAction, {});
  return (
    <form action={a} className="space-y-4">
      <h1 className="font-heading text-xl font-bold text-navy-dark">Sign in</h1>
      <Msg s={s} />
      <input type="hidden" name="next" value={next || ""} />
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required className="input" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="input" /></div>
      <Submit pending={p}>Sign in</Submit>
      <p className="text-center text-sm"><Link href="/admin/forgot-password" className="text-navy underline">Forgot password?</Link></p>
    </form>
  );
}

export function ForgotForm() {
  const [s, a, p] = useActionState(forgotPasswordAction, {});
  return (
    <form action={a} className="space-y-4">
      <h1 className="font-heading text-xl font-bold text-navy-dark">Reset password</h1>
      <p className="text-sm text-muted">Enter your account email. If it exists, we will send a single-use reset link valid for one hour.</p>
      <Msg s={s} />
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" required className="input" /></div>
      <Submit pending={p}>Send reset link</Submit>
      <p className="text-center text-sm"><Link href="/admin/login" className="text-navy underline">Back to sign in</Link></p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [s, a, p] = useActionState(resetPasswordAction, {});
  if (s.message) return (<div className="space-y-4"><Msg s={s} /><Link href="/admin/login" className="btn-navy w-full">Sign in</Link></div>);
  return (
    <form action={a} className="space-y-4">
      <h1 className="font-heading text-xl font-bold text-navy-dark">Choose a new password</h1>
      <Msg s={s} />
      <input type="hidden" name="token" value={token} />
      <div><label className="label" htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className="input" /><p className="mt-1 text-xs text-muted">At least 10 characters, including a letter and a number.</p></div>
      <div><label className="label" htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="input" /></div>
      <Submit pending={p}>Update password</Submit>
    </form>
  );
}
