import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { PageContent, Setting } from "@/lib/models";
import { DEFAULT_LEGAL, DEFAULT_SETTINGS, type SiteSettings } from "@/lib/catalog";
import { isMailConfigured } from "@/lib/mail";
import { PageHeader, Panel } from "@/components/admin/ui";
import { CleanupButton, LegalForm, SettingsForm } from "./SettingsForms";

export const metadata = { title: "Site Settings" };

export default async function SettingsPage() {
  await requireUser("settings.manage");
  await connectDb();
  const [doc, legal] = await Promise.all([Setting.findOne({ key: "site" }).lean(), PageContent.find({ slug: { $in: ["privacy-policy", "terms"] } }).lean()]);
  const v = (doc?.value || {}) as Partial<SiteSettings>;
  const s: SiteSettings = { ...DEFAULT_SETTINGS, ...v, social: { ...DEFAULT_SETTINGS.social, ...(v.social || {}) }, home: { ...DEFAULT_SETTINGS.home, ...(v.home || {}) }, stats: v.stats?.length ? v.stats : DEFAULT_SETTINGS.stats };
  const page = (slug: "privacy-policy" | "terms") => {
    const p = legal.find((x) => x.slug === slug);
    return { slug, title: p?.title || DEFAULT_LEGAL[slug].title, body: p ? String(p.body) : DEFAULT_LEGAL[slug].body };
  };
  return (
    <>
      <PageHeader title="Site settings" description="Branding, contact details, homepage content and images. Changes go live as soon as you save." actions={<CleanupButton />} />
      {!isMailConfigured() && <p className="mb-6 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm">Email is not configured on the server (SMTP_HOST / EMAIL_FROM). Inquiries are still saved here, but no notification emails or password reset emails are sent.</p>}
      <SettingsForm s={s} />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Privacy Policy"><LegalForm {...page("privacy-policy")} /></Panel>
        <Panel title="Terms of Use"><LegalForm {...page("terms")} /></Panel>
      </div>
    </>
  );
}
