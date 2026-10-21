import { NextResponse } from "next/server";
import { AuthError, assertSameOrigin, assertUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { storeImage } from "@/lib/uploads";
import { isUploadFolder, MAX_UPLOAD_BYTES } from "@/lib/upload-core";
import { activityForUpload, uploadPermission } from "@/lib/upload-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const fd = await req.formData().catch(() => null);
    if (!fd) return NextResponse.json({ success: false, error: "Expected multipart form data" }, { status: 400 });
    const folder = fd.get("folder");
    if (!isUploadFolder(folder)) return NextResponse.json({ success: false, error: "Invalid folder" }, { status: 400 });
    const user = await assertUser(uploadPermission(folder));
    await connectDb();
    if (!(await rateLimit("upload", user.id, 60, 600))) return NextResponse.json({ success: false, error: "Too many uploads. Try again shortly." }, { status: 429 });

    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ success: false, error: "Image exceeds the 8MB limit" }, { status: 413 });

    const buf = Buffer.from(await file.arrayBuffer());
    const r = await storeImage(buf, file.name, file.type, folder, user.id);
    if (!r.ok) return NextResponse.json({ success: false, error: r.error }, { status: r.status });
    await activityForUpload(user, r.url, r.size);
    return NextResponse.json({ success: true, url: r.url, filename: r.filename, size: r.size, folder: r.folder }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    console.error("upload failed", e);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
