import "server-only";
import { ActivityLog } from "./models";
import type { SessionUser } from "./auth";

const SENSITIVE = /password|token|secret|hash|data/i;

function scrub(v: unknown): unknown {
  if (!v || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(scrub);
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).filter(([k]) => !SENSITIVE.test(k)).map(([k, x]) => [k, scrub(x)]));
}

export async function logActivity(user: Pick<SessionUser, "id" | "email"> | null, action: string, entity: string, entityId?: string, details?: unknown) {
  try {
    await ActivityLog.create({ user: user?.id, userEmail: user?.email, action, entity, entityId, details: scrub(details) });
  } catch (e) {
    console.error("activity log failed", e);
  }
}
