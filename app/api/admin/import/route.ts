import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { AuthError, assertSameOrigin, assertUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { commitRows, readRows, templateWorkbook, validateRows } from "@/lib/import";
import { logActivity } from "@/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_FILE = 4 * 1024 * 1024;

export async function GET() {
  try {
    await assertUser("import");
    const buf = XLSX.write(templateWorkbook(), { type: "buffer", bookType: "xlsx" }) as Buffer;
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="gistra-certificate-import-template.xlsx"' },
    });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const u = await assertUser("import");
    await connectDb();
    const fd = await req.formData();
    const file = fd.get("file");
    const mode = fd.get("mode") === "commit" ? "commit" : "preview";
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a file" }, { status: 400 });
    if (file.size > MAX_FILE) return NextResponse.json({ error: "File is larger than 4MB. Split it into smaller files." }, { status: 413 });
    if (!/\.(xlsx|csv)$/i.test(file.name)) return NextResponse.json({ error: "Upload a .xlsx or .csv file" }, { status: 415 });

    const { rows, error } = readRows(Buffer.from(await file.arrayBuffer()));
    if (error) return NextResponse.json({ error }, { status: 422 });
    if (!rows.length) return NextResponse.json({ error: "The file contains no data rows" }, { status: 422 });
    const validated = await validateRows(u, rows);
    const preview = validated.map(({ row, data, errors }) => ({ row, data, errors }));
    const valid = validated.filter((r) => !r.errors.length).length;

    if (mode === "preview") return NextResponse.json({ total: rows.length, valid, invalid: rows.length - valid, rows: preview });

    // Commit: only rows that are valid at commit time are written; invalid rows are reported back, never silently dropped.
    const { inserted, failed } = await commitRows(u, validated);
    const rejected = [...validated.filter((r) => r.errors.length).map((r) => ({ row: r.row, error: r.errors.join("; ") })), ...failed];
    await logActivity(u, "import", "Certificate", undefined, { file: file.name, total: rows.length, inserted, rejected: rejected.length });
    return NextResponse.json({ total: rows.length, inserted, rejected });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("import failed", e);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
