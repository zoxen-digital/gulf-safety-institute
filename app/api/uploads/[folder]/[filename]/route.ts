import { connectDb, isDbConfigured } from "@/lib/db";
import { StoredUpload } from "@/lib/models";
import { binaryToBuffer, isSafeFilename, isUploadFolder } from "@/lib/upload-core";

export const runtime = "nodejs";

const notFound = () => new Response("Not found", { status: 404, headers: { "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" } });

export async function GET(_req: Request, { params }: { params: Promise<{ folder: string; filename: string }> }) {
  const { folder, filename } = await params;
  if (!isUploadFolder(folder) || !isSafeFilename(filename)) return notFound();
  if (!isDbConfigured()) return notFound();
  await connectDb();
  const f = await StoredUpload.findOne({ folder, filename }).select("+data mimeType size").lean();
  if (!f?.data) return notFound();
  const bytes = binaryToBuffer(f.data);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": f.mimeType,
      "Content-Length": String(bytes.length),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
