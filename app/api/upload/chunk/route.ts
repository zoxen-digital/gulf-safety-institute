import { NextResponse } from "next/server";
import { AuthError, assertSameOrigin, assertUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { UploadChunk } from "@/lib/models";
import { rateLimit } from "@/lib/rate-limit";
import { storeImage } from "@/lib/uploads";
import { binaryToBuffer, CHUNK_SIZE, isUploadFolder, MAX_UPLOAD_BYTES } from "@/lib/upload-core";
import { activityForUpload, uploadPermission } from "@/lib/upload-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Chunked upload fallback for images larger than the host's single-request body limit (Vercel ~4.5MB).
 * Chunks are kept in MongoDB with an owner and a 1-hour TTL, then assembled and validated like a normal upload.
 */
export async function POST(req: Request) {
  try {
    await assertSameOrigin(req);
    const fd = await req.formData().catch(() => null);
    if (!fd) return NextResponse.json({ success: false, error: "Expected multipart form data" }, { status: 400 });
    const folder = fd.get("folder");
    if (!isUploadFolder(folder)) return NextResponse.json({ success: false, error: "Invalid folder" }, { status: 400 });
    const user = await assertUser(uploadPermission(folder));
    await connectDb();
    if (!(await rateLimit("upload-chunk", user.id, 120, 600))) return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429 });

    const uploadId = String(fd.get("uploadId") || "");
    const index = Number(fd.get("index"));
    const total = Number(fd.get("total"));
    const chunk = fd.get("chunk");
    if (!/^[a-f0-9]{32}$/.test(uploadId) || !Number.isInteger(index) || !Number.isInteger(total) || total < 1 || total > Math.ceil(MAX_UPLOAD_BYTES / CHUNK_SIZE) || index < 0 || index >= total)
      return NextResponse.json({ success: false, error: "Invalid chunk metadata" }, { status: 400 });
    if (!(chunk instanceof Blob) || chunk.size === 0 || chunk.size > CHUNK_SIZE) return NextResponse.json({ success: false, error: "Invalid chunk" }, { status: 400 });

    // Another user's upload id cannot be appended to.
    const foreign = await UploadChunk.exists({ uploadId, owner: { $ne: user.id } });
    if (foreign) return NextResponse.json({ success: false, error: "Invalid upload" }, { status: 403 });

    await UploadChunk.updateOne(
      { uploadId, index },
      { $set: { data: Buffer.from(await chunk.arrayBuffer()), owner: user.id, expiresAt: new Date(Date.now() + 3600_000) } },
      { upsert: true },
    );

    if (index < total - 1) return NextResponse.json({ success: true, received: index });

    const parts = await UploadChunk.find({ uploadId, owner: user.id }).sort({ index: 1 }).lean();
    if (parts.length !== total || parts.some((p, i) => p.index !== i)) return NextResponse.json({ success: false, error: "Missing chunks; please retry" }, { status: 409 });
    const buf = Buffer.concat(parts.map((p) => binaryToBuffer(p.data)));
    await UploadChunk.deleteMany({ uploadId });
    if (buf.length > MAX_UPLOAD_BYTES) return NextResponse.json({ success: false, error: "Image exceeds the 8MB limit" }, { status: 413 });

    const r = await storeImage(buf, String(fd.get("name") || ""), String(fd.get("mime") || ""), folder, user.id);
    if (!r.ok) return NextResponse.json({ success: false, error: r.error }, { status: r.status });
    await activityForUpload(user, r.url, r.size);
    return NextResponse.json({ success: true, url: r.url, filename: r.filename, size: r.size, folder: r.folder }, { status: 201 });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ success: false, error: e.message }, { status: e.status });
    console.error("chunk upload failed", e);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
