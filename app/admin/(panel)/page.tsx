import Link from "next/link";
import { AlertTriangle, Award, Ban, Clock, MessageSquare, ScanSearch, ShieldCheck, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Certificate, Inquiry, Trainee, VerificationLog } from "@/lib/models";
import { certificateScope, fmtDate, traineeScope } from "@/lib/admin";
import { can } from "@/lib/permissions";
import { displayStatus } from "@/lib/verify-core";
import { Badge, Empty, PageHeader, Panel, Table, td, th } from "@/components/admin/ui";
import { MonthlyBars } from "@/components/admin/MonthlyBars";

export const metadata = { title: "Dashboard" };

function months() {
  const out: { key: string; month: string }[] = [];
  const d = new Date();
  d.setUTCDate(1);
  for (let i = 11; i >= 0; i--) {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - i, 1));
    out.push({ key: `${x.getUTCFullYear()}-${x.getUTCMonth() + 1}`, month: x.toLocaleString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }) });
  }
  return out;
}

async function monthly(model: typeof Certificate | typeof VerificationLog, match: Record<string, unknown>, field: string) {
  const ms = months();
  const start = new Date(Date.now() - 366 * 86400_000);
  const rows = await (model as typeof Certificate).aggregate<{ _id: { y: number; m: number }; n: number }>([
    { $match: { ...match, [field]: { $gte: start } } },
    { $group: { _id: { y: { $year: `$${field}` }, m: { $month: `$${field}` } }, n: { $sum: 1 } } },
  ]);
  return ms.map((m) => ({ month: m.month, value: rows.find((r) => `${r._id.y}-${r._id.m}` === m.key)?.n || 0 }));
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const u = await requireUser("dashboard");
  await connectDb();
  const { denied } = await searchParams;
  const scope = certificateScope(u);
  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 86400_000);
  const full = u.role !== "STAFF";

  const [total, valid, expiring, expired, revoked, suspended, trainees, recent, expiringList, issued] = await Promise.all([
    Certificate.countDocuments(scope),
    Certificate.countDocuments({ ...scope, status: "VALID", expiryDate: { $gte: now } }),
    Certificate.countDocuments({ ...scope, status: "VALID", expiryDate: { $gte: now, $lte: soon } }),
    Certificate.countDocuments({ ...scope, status: "VALID", expiryDate: { $lt: now } }),
    Certificate.countDocuments({ ...scope, status: "REVOKED" }),
    Certificate.countDocuments({ ...scope, status: "SUSPENDED" }),
    Trainee.countDocuments(await traineeScope(u)),
    Certificate.find(scope).sort({ createdAt: -1 }).limit(6).populate("trainee", "fullName").populate("course", "name").lean(),
    Certificate.find({ ...scope, status: "VALID", expiryDate: { $gte: now, $lte: soon } }).sort({ expiryDate: 1 }).limit(6).populate("trainee", "fullName").populate("course", "name").lean(),
    full ? monthly(Certificate, scope, "issueDate") : Promise.resolve(null),
  ]);
  const showInq = can(u.role, "inquiries.manage");
  const showVer = can(u.role, "logs.verification");
  const [newInq, latestInq, verMonth, verChart] = await Promise.all([
    showInq ? Inquiry.countDocuments({ status: "NEW" }) : 0,
    showInq ? Inquiry.find().sort({ createdAt: -1 }).limit(5).lean() : [],
    showVer ? VerificationLog.countDocuments({ createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } }) : 0,
    showVer ? monthly(VerificationLog, {}, "createdAt") : null,
  ]);

  const tiles = [
    { label: "Total certificates", value: total, icon: Award, href: "/admin/certificates" },
    { label: "Valid", value: valid, icon: ShieldCheck, href: "/admin/certificates?status=VALID", tone: "text-success" },
    { label: "Expiring in 30 days", value: expiring, icon: Clock, href: "/admin/certificates?status=EXPIRING", tone: expiring ? "text-warning" : "" },
    { label: "Expired", value: expired, icon: AlertTriangle, href: "/admin/certificates?status=EXPIRED" },
    { label: "Revoked / suspended", value: revoked + suspended, icon: Ban, href: "/admin/certificates?status=REVOKED", tone: revoked + suspended ? "text-danger" : "" },
    { label: "Trainees", value: trainees, icon: Users, href: "/admin/trainees" },
    ...(showInq ? [{ label: "New inquiries", value: newInq, icon: MessageSquare, href: "/admin/inquiries?status=NEW", tone: newInq ? "text-navy" : "" }] : []),
    ...(showVer ? [{ label: "Verifications this month", value: verMonth, icon: ScanSearch, href: "/admin/verification-logs" }] : []),
  ];

  const certRow = (c: (typeof recent)[number], showExpiry = false) => {
    const t = c.trainee as unknown as { fullName: string } | null;
    const co = c.course as unknown as { name: string } | null;
    return (
      <tr key={String(c._id)}>
        <td className={td}><Link href={`/admin/certificates/${c._id}`} className="font-mono text-xs font-bold text-navy hover:underline">{c.certificateNumber}</Link></td>
        <td className={td}><p className="font-medium">{t?.fullName}</p><p className="line-clamp-1 text-xs text-muted">{co?.name}</p></td>
        <td className={`${td} whitespace-nowrap text-xs`}>{fmtDate(showExpiry ? c.expiryDate : c.issueDate)}</td>
        <td className={td}><Badge value={displayStatus(c.status, c.expiryDate)} /></td>
      </tr>
    );
  };

  return (
    <>
      <PageHeader title={`Welcome, ${u.name.split(" ")[0]}`} description={u.role === "SUPER_ADMIN" ? "Overview of all locations" : "Overview of your assigned locations"} />
      {denied && <p role="alert" className="mb-5 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm text-danger">You do not have access to that page.</p>}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, href, tone }) => (
          <li key={label}>
            <Link href={href} className="flex h-full flex-col rounded-[10px] border border-slate-200 bg-white p-4 transition hover:border-navy/30">
              <span className="flex items-center justify-between text-xs font-medium text-muted">{label}<Icon className="h-4 w-4 text-gold" aria-hidden /></span>
              <span className={`mt-2 font-heading text-[28px] font-extrabold text-navy-dark ${tone || ""}`}>{value.toLocaleString()}</span>
            </Link>
          </li>
        ))}
      </ul>

      {full && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Certificates issued per month">{issued && <MonthlyBars data={issued} label="Certificates issued per month" />}</Panel>
          {verChart && <Panel title="Verification searches per month"><MonthlyBars data={verChart} label="Verification searches per month" /></Panel>}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recently issued" actions={<Link href="/admin/certificates" className="text-xs font-semibold text-navy">View all</Link>}>
          {recent.length ? <Table caption="Recently issued certificates"><thead className="bg-slate-50"><tr><th className={th}>No.</th><th className={th}>Trainee</th><th className={th}>Issued</th><th className={th}>Status</th></tr></thead><tbody className="divide-y divide-slate-100">{recent.map((c) => certRow(c))}</tbody></Table> : <Empty title="No certificates yet" action={can(u.role, "certificates.edit") ? <Link href="/admin/certificates/new" className="btn-navy btn-sm">Issue certificate</Link> : undefined} />}
        </Panel>
        <Panel title="Expiring in the next 30 days" actions={<Link href="/admin/certificates?status=EXPIRING" className="text-xs font-semibold text-navy">View all</Link>}>
          {expiringList.length ? <Table caption="Certificates expiring soon"><thead className="bg-slate-50"><tr><th className={th}>No.</th><th className={th}>Trainee</th><th className={th}>Expires</th><th className={th}>Status</th></tr></thead><tbody className="divide-y divide-slate-100">{expiringList.map((c) => certRow(c, true))}</tbody></Table> : <Empty title="Nothing expiring soon" />}
        </Panel>
      </div>

      {showInq && (
        <Panel title="Latest inquiries" className="mt-6" actions={<Link href="/admin/inquiries" className="text-xs font-semibold text-navy">View all</Link>}>
          {latestInq.length ? (
            <Table caption="Latest inquiries">
              <thead className="bg-slate-50"><tr><th className={th}>Received</th><th className={th}>From</th><th className={th}>Type</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {latestInq.map((i) => (
                  <tr key={String(i._id)}>
                    <td className={`${td} text-xs`}>{fmtDate(i.createdAt)}</td>
                    <td className={td}><Link href={`/admin/inquiries?id=${i._id}`} className="font-medium text-navy hover:underline">{i.name}</Link><p className="text-xs text-muted">{i.company}</p></td>
                    <td className={td}>{i.type}</td>
                    <td className={td}><Badge value={i.status} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : <Empty title="No inquiries yet" />}
        </Panel>
      )}
    </>
  );
}
