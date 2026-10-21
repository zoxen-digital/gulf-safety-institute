import "server-only";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { connectDb } from "./db";
import { RateLimit } from "./models";

/** Privacy-preserving client id: salted hash of the IP, never the raw address. */
export async function clientId(req?: Request) {
  const h = req ? req.headers : await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${process.env.AUTH_SECRET || "gistra"}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Fixed-window counter stored in MongoDB so the limit holds across serverless instances.
 * Returns true when the request is allowed.
 */
export async function rateLimit(bucket: string, id: string, limit: number, windowSec: number) {
  await connectDb();
  const windowStart = Math.floor(Date.now() / (windowSec * 1000));
  const key = `${bucket}:${id}:${windowStart}`;
  const doc = await RateLimit.findOneAndUpdate(
    { key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((windowStart + 1) * windowSec * 1000 + 60_000) } },
    { upsert: true, new: true },
  ).lean();
  return (doc?.count ?? 0) <= limit;
}
