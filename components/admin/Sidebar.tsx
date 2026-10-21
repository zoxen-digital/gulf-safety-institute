"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity, Award, BookOpen, FileUp, FolderTree, GraduationCap, LayoutDashboard, LogOut, MapPin, Menu, MessageSquare,
  ScanSearch, Settings, UserCog, Users, X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/(auth)/actions";

const ICONS = { LayoutDashboard, Award, FileUp, Users, BookOpen, FolderTree, MapPin, GraduationCap, MessageSquare, UserCog, Settings, Activity, ScanSearch };
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export function Sidebar({ items, user }: { items: NavItem[]; user: { name: string; role: string } }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (h: string) => (h === "/admin" ? path === "/admin" : path.startsWith(h));

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
      <ul className="space-y-0.5">
        {items.map((i) => {
          const Icon = ICONS[i.icon];
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active(i.href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${active(i.href) ? "bg-white/10 font-semibold text-white shadow-[inset_3px_0_0_var(--gold)]" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
              >
                <Icon className={`h-4 w-4 ${active(i.href) ? "text-gold" : ""}`} aria-hidden />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
  const footer = (
    <div className="border-t border-white/10 p-4">
      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
      <p className="text-xs text-gold">{user.role.replace("_", " ")}</p>
      <form action={logoutAction} className="mt-3">
        <button type="submit" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
          <LogOut className="h-4 w-4" aria-hidden /> Log out
        </button>
      </form>
    </div>
  );
  const brand = (
    <Link href="/admin" className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
      <Image src="/brand/gsi-icon.png" alt="" width={40} height={40} className="rounded bg-white p-1" />
      <span>
        <span className="block font-heading text-lg font-extrabold leading-none text-white">GSI</span>
        <span className="text-[11px] text-gold">Admin Panel</span>
      </span>
    </Link>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy-dark lg:flex">{brand}{nav}{footer}</aside>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-navy-dark px-4 lg:hidden">
        <Link href="/admin" className="font-heading text-lg font-extrabold text-white">GSI <span className="text-xs font-semibold text-gold">Admin</span></Link>
        <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} className="rounded p-2 text-white hover:bg-white/10"><Menu className="h-5 w-5" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button className="absolute inset-0 bg-black/50" aria-label="Close navigation" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-navy-dark">
            <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="absolute right-3 top-4 rounded p-2 text-white hover:bg-white/10"><X className="h-5 w-5" /></button>
            {brand}{nav}{footer}
          </aside>
        </div>
      )}
    </>
  );
}
