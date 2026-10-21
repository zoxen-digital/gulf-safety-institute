import "server-only";
import { headers } from "next/headers";
import { connectDb, isDbConfigured } from "./db";
import { VerificationLog } from "./models";
import { loadCertificate } from "./certificates";
import { getSettings } from "./site-data";
import { clientId, rateLimit } from "./rate-limit";
import { displayStatus, normalizeCertificateNumber, toPublicResult, type PublicResult } from "./verify-core";

export type LookupOutcome =
  | { kind: "EMPTY" }
  | { kind: "INVALID"; searched: string }
  | { kind: "RATE_LIMITED" }
  | { kind: "UNAVAILABLE" }
  | { kind: "RESULT"; result: PublicResult; verifiedAt: string };

export async function publicLookup(input: string | undefined): Promise<LookupOutcome> {
  if (!input || !input.trim()) return { kind: "EMPTY" };
  const number = normalizeCertificateNumber(input);
  if (!number) return { kind: "INVALID", searched: input.slice(0, 40) };
  if (!isDbConfigured()) return { kind: "UNAVAILABLE" };
  try {
    await connectDb();
    const cid = await clientId();
    if (!(await rateLimit("verify", cid, 30, 60))) return { kind: "RATE_LIMITED" };
    const rec = await loadCertificate({ certificateNumber: number });
    const settings = await getSettings();
    const result = toPublicResult(rec, number, new Date(), { showFullId: settings.publicShowFullId });
    const ua = (await headers()).get("user-agent")?.slice(0, 300) || "";
    await VerificationLog.create({
      searchedNumber: number,
      certificate: rec ? rec.id : undefined,
      result: rec ? displayStatus(rec.status, rec.expiryDate) : "NOT_FOUND",
      clientId: cid,
      userAgent: ua,
    });
    return { kind: "RESULT", result, verifiedAt: new Date().toISOString() };
  } catch (e) {
    console.error("verify failed", (e as Error).message);
    return { kind: "UNAVAILABLE" };
  }
}
