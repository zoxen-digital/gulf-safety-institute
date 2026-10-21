import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { connectDb } from "./db";
import { siteUrl } from "./site-url";
import { User, type Role } from "./models";
import { can, type Actor, type Permission } from "./permissions";

export const SESSION_COOKIE = "gistra_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set (at least 32 characters)");
  return new TextEncoder().encode(s);
}

export async function createSession(userId: string, sessionVersion: number) {
  const token = await new SignJWT({ sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export type SessionUser = Actor & { name: string; email: string };

/** Loads the user on every request so deactivation, role changes and resets apply immediately. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    await connectDb();
    const u = await User.findById(payload.sub).lean();
    if (!u || !u.isActive || u.sessionVersion !== payload.sv) return null;
    return { id: String(u._id), name: u.name, email: u.email, role: u.role as Role, locations: (u.locations || []).map(String) };
  } catch {
    return null;
  }
}

export async function requireUser(permission?: Permission): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  if (permission && !can(u.role, permission)) redirect("/admin?denied=1");
  return u;
}

export class AuthError extends Error {
  constructor(public status: 401 | 403, msg: string) {
    super(msg);
  }
}

/** For route handlers / actions: throws instead of redirecting. */
export async function assertUser(permission?: Permission): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new AuthError(401, "Not signed in");
  if (permission && !can(u.role, permission)) throw new AuthError(403, "Not allowed");
  return u;
}

/** CSRF protection for route handlers: require same-origin Origin/Referer on mutations. */
export async function assertSameOrigin(req?: Request) {
  const h = req ? req.headers : await headers();
  const origin = h.get("origin") || h.get("referer");
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!origin || !host) throw new AuthError(403, "Missing origin");
  try {
    const o = new URL(origin);
    const allowed = new Set([host]);
    allowed.add(new URL(siteUrl()).host);
    if (!allowed.has(o.host)) throw new Error();
  } catch {
    throw new AuthError(403, "Cross-origin request rejected");
  }
}
