import "server-only";
import { isValidObjectId, Types } from "mongoose";
import { revalidateTag } from "next/cache";
import { ZodError } from "zod";
import { AuthError, assertUser, type SessionUser } from "./auth";
import { connectDb } from "./db";
import { Certificate } from "./models";
import { locationScope, type Permission } from "./permissions";
import { SITE_TAG } from "./site-data";

export type ActionResult = { ok: boolean; message?: string; errors?: Record<string, string>; id?: string; at?: number };

/** Wraps every admin server action: authenticates, authorises, and converts errors into safe messages. */
export async function guarded(perm: Permission, fn: (u: SessionUser) => Promise<ActionResult>): Promise<ActionResult> {
  try {
    const u = await assertUser(perm);
    await connectDb();
    return { ...(await fn(u)), at: Date.now() };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, message: e.status === 401 ? "Your session has expired. Please sign in again." : "You do not have permission for this action.", at: Date.now() };
    if (e instanceof ZodError) {
      const errors: Record<string, string> = {};
      for (const i of e.issues) errors[String(i.path.join("."))] ??= i.message;
      return { ok: false, message: "Please correct the highlighted fields.", errors, at: Date.now() };
    }
    if ((e as { code?: number }).code === 11000) {
      const key = Object.keys((e as { keyPattern?: object }).keyPattern || {})[0] || "value";
      return { ok: false, message: `That ${key} is already in use.`, errors: { [key]: "Already in use" }, at: Date.now() };
    }
    if (e instanceof ClientError) return { ok: false, message: e.message, at: Date.now() };
    console.error("admin action failed", e);
    return { ok: false, message: "Something went wrong. Please try again.", at: Date.now() };
  }
}

/** An error whose message is safe to show to the admin user. */
export class ClientError extends Error {}

export function oid(v: unknown): Types.ObjectId {
  if (typeof v !== "string" || !isValidObjectId(v)) throw new ClientError("Invalid identifier");
  return new Types.ObjectId(v);
}
export const optOid = (v: unknown) => (v ? oid(v) : undefined);

export function revalidateSite() {
  revalidateTag(SITE_TAG);
}

export function str(fd: FormData, k: string, max = 2000) {
  return String(fd.get(k) ?? "").trim().slice(0, max);
}
export function bool(fd: FormData, k: string) {
  const v = fd.get(k);
  return v === "on" || v === "true" || v === "1";
}

export type ListParams = { q: string; page: number; perPage: number; sort: string; dir: 1 | -1 };

export function listParams(sp: Record<string, string | string[] | undefined>, defSort = "createdAt"): ListParams {
  const g = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined)) || "";
  return {
    q: g("q").slice(0, 100),
    page: Math.max(1, Math.min(10_000, parseInt(g("page")) || 1)),
    perPage: 25,
    sort: /^[a-zA-Z.]{1,40}$/.test(g("sort")) ? g("sort") : defSort,
    dir: g("dir") === "asc" ? 1 : -1,
  };
}

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Base filter for certificates visible to this actor (soft-deleted excluded). */
export function certificateScope(u: SessionUser): Record<string, unknown> {
  const scope = locationScope(u);
  return scope === null ? { deletedAt: null } : { deletedAt: null, location: { $in: scope.map((x) => new Types.ObjectId(x)) } };
}

/** Trainees visible to a scoped user: those with a certificate in their locations, or whose home location is theirs. */
export async function traineeScope(u: SessionUser): Promise<Record<string, unknown>> {
  const scope = locationScope(u);
  if (scope === null) return {};
  const ids = scope.map((x) => new Types.ObjectId(x));
  const viaCerts = await Certificate.distinct("trainee", { deletedAt: null, location: { $in: ids } });
  return { $or: [{ _id: { $in: viaCerts } }, { homeLocation: { $in: ids } }] };
}

export function toDate(v: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export const dateInput = (d?: Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const fmtDate = (d?: Date | string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "-");
