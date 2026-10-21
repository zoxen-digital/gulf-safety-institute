"use client";
import { useActionState, useEffect, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { ActionForm, Checkbox, SubmitButton, TextArea, TextField } from "@/components/admin/Form";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { toast } from "@/components/admin/Toast";
import type { SiteSettings } from "@/lib/catalog";
import { cleanupOrphanUploads, saveLegal, saveSettings } from "./actions";

function Section({ title, children, cols = true }: { title: string; children: React.ReactNode; cols?: boolean }) {
  return (
    <fieldset className="rounded-[10px] border border-slate-200 bg-white p-5">
      <legend className="px-1 font-heading text-sm font-bold text-navy-dark">{title}</legend>
      <div className={cols ? "grid gap-5 md:grid-cols-2" : "space-y-5"}>{children}</div>
    </fieldset>
  );
}

const HOME_LABELS: Record<string, string> = {
  heroEyebrow: "Hero eyebrow", heroLine1: "Hero heading line 1 (last word is gold)", heroLine2: "Hero heading line 2", heroText: "Hero supporting text",
  categoriesEyebrow: "Categories eyebrow", categoriesHeading: "Categories heading", standardCaption1: "Photo caption line 1", standardCaption2: "Photo caption line 2",
  standardEyebrow: "Standard eyebrow", standardHeading1: "Standard heading line 1", standardHeading2: "Standard heading line 2", industriesHeading: "Industries heading",
  verifyHeading: "Verification heading", locationsHeading: "Locations heading", locationsText: "Locations text", alignmentText: "Contractor strip text",
  alignmentNames: "Contractor names (comma separated)", ctaHeading: "CTA heading", ctaText: "CTA text",
};

export function SettingsForm({ s }: { s: SiteSettings }) {
  return (
    <ActionForm action={saveSettings} className="space-y-6">
      <Section title="Institute identity">
        <TextField name="instituteName" label="Short name" defaultValue={s.instituteName} required />
        <TextField name="instituteFullName" label="Full name" defaultValue={s.instituteFullName} required />
        <TextField name="tagline" label="Tagline" defaultValue={s.tagline} className="md:col-span-2" />
        <TextField name="utilityText" label="Top bar text" defaultValue={s.utilityText} />
        <TextField name="certificatePrefix" label="Certificate number prefix" defaultValue={s.certificatePrefix} help="e.g. GSI → GSI-2026-000001" />
        <TextArea name="footerText" label="Footer description" defaultValue={s.footerText} rows={2} className="md:col-span-2" />
        <AdminImageField name="logoUrl" label="Logo" folder="misc" defaultValue={s.logoUrl} fit="contain" aspect="aspect-square max-w-[140px]" help="Square PNG recommended. PNG/JPEG logos are also embedded in PDFs." />
        <AdminImageField name="faviconUrl" label="Favicon" folder="misc" defaultValue={s.faviconUrl} fit="contain" aspect="aspect-square max-w-[90px]" help="Square PNG, 64px or larger." />
        <AdminImageField name="stampUrl" label="Stamp / seal" folder="misc" defaultValue={s.stampUrl} fit="contain" aspect="aspect-square max-w-[140px]" help="Transparent PNG. Printed on certificates and ID cards." />
      </Section>
      <Section title="Certificate & ID card layout">
        <TextField name="supervisionText" label='"Under the supervision of" text' defaultValue={s.supervisionText} className="md:col-span-2" help="Optional. e.g. the authority you train under. Leave blank to hide the line. Only enter bodies you are actually approved by." />
        <TextField name="certificateWebsite" label="Website shown on certificate" defaultValue={s.certificateWebsite} placeholder="www.gulfsafetyinstitute.com" help="Leave blank to use the site address." />
        <TextField name="signatureLabel" label="Signature caption" defaultValue={s.signatureLabel} />
        <AdminImageField name="signatureUrl" label="Authorized signature" folder="misc" defaultValue={s.signatureUrl} fit="contain" aspect="aspect-[3/1] max-w-[220px]" help="Transparent PNG. Printed in the centre of the certificate." />
        <div className="flex items-end">
          <Checkbox name="publicShowFullId" label="Show full ID / Iqama number on QR page and PDFs" defaultChecked={s.publicShowFullId} help="Off = show a masked number (e.g. 26******77)." />
        </div>
        <div className="md:col-span-2">
          <p className="label">Accreditation / partner logos (bottom row)</p>
          <p className="mb-3 text-xs text-muted">Up to 6 logos, PNG or JPEG. Upload only logos of bodies that have approved GSI.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <AdminImageField key={i} name={`accreditationLogos.${i}`} label={`Logo ${i + 1}`} folder="misc" defaultValue={s.accreditationLogos[i] || ""} fit="contain" aspect="aspect-[5/2] max-w-[200px]" help="PNG or JPEG" />
            ))}
          </div>
        </div>
      </Section>
      <Section title="Contact details">
        <TextField name="phone" label="Phone" defaultValue={s.phone} />
        <TextField name="whatsapp" label="WhatsApp number" defaultValue={s.whatsapp} help="International format, e.g. +966..." />
        <TextField name="email" label="Public email" type="email" defaultValue={s.email} />
        <TextField name="notificationEmail" label="Inquiry notification email" type="email" defaultValue={s.notificationEmail} help="Requires SMTP to be configured on the server." />
        <TextField name="address" label="Head office address" defaultValue={s.address} className="md:col-span-2" />
        {(["linkedin", "facebook", "instagram", "x", "youtube"] as const).map((k) => (
          <TextField key={k} name={`social.${k}`} label={`${k === "x" ? "X" : k[0].toUpperCase() + k.slice(1)} URL`} defaultValue={s.social[k]} placeholder="https://" />
        ))}
      </Section>
      <Section title="Homepage text">
        {Object.entries(HOME_LABELS).map(([k, label]) => (
          <TextField key={k} name={`home.${k}`} label={label} defaultValue={(s.home as Record<string, string>)[k]} />
        ))}
      </Section>
      <Section title="Homepage statistics">
        {s.stats.map((st, i) => (
          <div key={i} className="grid grid-cols-[110px_1fr] gap-3">
            <TextField name={`stats.${i}.value`} label="Value" defaultValue={st.value} help={i < 2 ? '"auto" = live count' : undefined} />
            <TextField name={`stats.${i}.label`} label="Label" defaultValue={st.label} />
          </div>
        ))}
      </Section>
      <Section title="Website images">
        <AdminImageField name="home.heroImage" label="Hero image" folder="pages" defaultValue={s.home.heroImage} aspect="aspect-video" help="Wide photo; subject on the right. At least 1920px wide." />
        <AdminImageField name="home.standardImage" label="Practical training image" folder="pages" defaultValue={s.home.standardImage} />
        <AdminImageField name="home.ctaImage" label="Corporate CTA background" folder="pages" defaultValue={s.home.ctaImage} aspect="aspect-video" />
        <AdminImageField name="home.aboutImage" label="About page header image" folder="pages" defaultValue={s.home.aboutImage} aspect="aspect-video" />
      </Section>
      <Section title="ID card & SEO">
        <TextArea name="idCardDisclaimer" label="ID card disclaimer" defaultValue={s.idCardDisclaimer} rows={3} className="md:col-span-2" />
        <TextField name="seoTitle" label="Default page title" defaultValue={s.seoTitle} className="md:col-span-2" />
        <TextArea name="seoDescription" label="Default meta description" defaultValue={s.seoDescription} rows={2} className="md:col-span-2" />
      </Section>
      <div className="sticky bottom-0 -mx-1 border-t border-slate-200 bg-slate-50/95 px-1 py-3 backdrop-blur"><SubmitButton className="btn-gold">Save settings</SubmitButton></div>
    </ActionForm>
  );
}

export function LegalForm({ slug, title, body }: { slug: string; title: string; body: string }) {
  return (
    <ActionForm action={saveLegal} className="space-y-4 p-5">
      <input type="hidden" name="slug" value={slug} />
      <TextField name="title" label="Title" defaultValue={title} required />
      <TextArea name="body" label="Content" defaultValue={body} rows={10} help="Separate paragraphs with a blank line." />
      <SubmitButton>Save {title}</SubmitButton>
    </ActionForm>
  );
}

export function CleanupButton() {
  const [state, run, pending] = useActionState(cleanupOrphanUploads, { ok: true });
  const last = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (state.at && state.at !== last.current) {
      last.current = state.at;
      toast(state.ok, state.message || "Done");
    }
  }, [state]);
  return (
    <form action={run}>
      <button type="submit" className="btn-outline btn-sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />} Clean up unused images
      </button>
    </form>
  );
}
