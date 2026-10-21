import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";
import { Sidebar, type NavItem } from "@/components/admin/Sidebar";
import { Toaster } from "@/components/admin/Toast";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | GSI Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const NAV: (NavItem & { perm: Permission })[] = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard", perm: "dashboard" },
  { href: "/admin/certificates", label: "Certificates", icon: "Award", perm: "certificates.view" },
  { href: "/admin/import", label: "Bulk Import", icon: "FileUp", perm: "import" },
  { href: "/admin/trainees", label: "Trainees", icon: "Users", perm: "trainees.view" },
  { href: "/admin/courses", label: "Courses", icon: "BookOpen", perm: "catalog.manage" },
  { href: "/admin/categories", label: "Categories", icon: "FolderTree", perm: "catalog.manage" },
  { href: "/admin/locations", label: "Locations", icon: "MapPin", perm: "locations.manage" },
  { href: "/admin/trainers", label: "Trainers & Approvers", icon: "GraduationCap", perm: "trainers.manage" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "MessageSquare", perm: "inquiries.manage" },
  { href: "/admin/users", label: "Users", icon: "UserCog", perm: "users.manage" },
  { href: "/admin/settings", label: "Site Settings", icon: "Settings", perm: "settings.manage" },
  { href: "/admin/activity-logs", label: "Activity Logs", icon: "Activity", perm: "logs.activity" },
  { href: "/admin/verification-logs", label: "Verification Logs", icon: "ScanSearch", perm: "logs.verification" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = NAV.filter((n) => can(user.role, n.perm)).map(({ perm: _p, ...n }) => n);
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar items={items} user={{ name: user.name, role: user.role }} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
