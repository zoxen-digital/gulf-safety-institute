"use server";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDb, isDbConfigured } from "@/lib/db";
import { PasswordResetToken, User } from "@/lib/models";
import { createSession, destroySession, getSessionUser } from "@/lib/auth";
import { clientId, rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { logActivity } from "@/lib/activity";

export type AuthState = { error?: string; message?: string };

// Equalises timing when the email does not exist.
let dummyHash: string | null = null;
const getDummyHash = async () => (dummyHash ??= await bcrypt.hash(randomBytes(16).toString("hex"), 12));

export async function loginAction(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isDbConfigured() || !process.env.AUTH_SECRET) return { error: "The admin panel is not configured yet (MONGODB_URI / AUTH_SECRET)." };
  const email = String(fd.get("email") || "").trim().toLowerCase().slice(0, 160);
  const password = String(fd.get("password") || "").slice(0, 200);
  if (!email || !password) return { error: "Enter your email and password." };
  await connectDb();
  const cid = await clientId();
  if (!(await rateLimit("login-ip", cid, 10, 900)) || !(await rateLimit("login-email", email, 8, 900)))
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  const u = await User.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, u?.passwordHash || (await getDummyHash()));
  if (!u || !ok || !u.isActive) return { error: "Invalid email or password." };
  u.lastLoginAt = new Date();
  await u.save();
  await createSession(String(u._id), u.sessionVersion);
  await logActivity({ id: String(u._id), email: u.email }, "login", "User", String(u._id));
  const next = String(fd.get("next") || "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction() {
  const u = await getSessionUser();
  if (u) await logActivity(u, "logout", "User", u.id);
  await destroySession();
  redirect("/admin/login");
}

const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
const GENERIC = "If an active account exists for that email, a reset link has been sent.";

export async function forgotPasswordAction(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isDbConfigured()) return { error: "Not configured." };
  const email = String(fd.get("email") || "").trim().toLowerCase().slice(0, 160);
  if (!z.string().email().safeParse(email).success) return { error: "Enter a valid email address." };
  await connectDb();
  if (!(await rateLimit("forgot", await clientId(), 5, 900))) return { message: GENERIC };
  const u = await User.findOne({ email, isActive: true }).lean();
  if (u) {
    const token = randomBytes(32).toString("base64url");
    await PasswordResetToken.deleteMany({ user: u._id, usedAt: null });
    await PasswordResetToken.create({ user: u._id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 60 * 60 * 1000) });
    const link = `${(process.env.APP_URL || "").replace(/\/$/, "")}/admin/reset-password?token=${token}`;
    const sent = await sendMail(u.email, "GSI admin password reset", `A password reset was requested for your GSI admin account.\n\nReset link (valid for 1 hour, single use):\n${link}\n\nIf you did not request this, ignore this email.`);
    if (!sent) console.warn("Password reset requested but SMTP is not configured; no email sent.");
  }
  return { message: GENERIC };
}

const pwSchema = z.string().min(10, "Password must be at least 10 characters").max(200).regex(/[A-Za-z]/, "Include a letter").regex(/\d/, "Include a number");

export async function resetPasswordAction(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isDbConfigured()) return { error: "Not configured." };
  const token = String(fd.get("token") || "");
  const pw = String(fd.get("password") || "");
  if (pw !== String(fd.get("confirm") || "")) return { error: "Passwords do not match." };
  const v = pwSchema.safeParse(pw);
  if (!v.success) return { error: v.error.issues[0].message };
  await connectDb();
  if (!(await rateLimit("reset", await clientId(), 10, 900))) return { error: "Too many attempts. Try again later." };
  // Atomically claim the token so it can be used only once.
  const t = await PasswordResetToken.findOneAndUpdate(
    { tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  ).lean();
  if (!t) return { error: "This reset link is invalid or has expired. Request a new one." };
  const u = await User.findOneAndUpdate(
    { _id: t.user, isActive: true },
    { $set: { passwordHash: await bcrypt.hash(pw, 12) }, $inc: { sessionVersion: 1 } },
  );
  if (!u) return { error: "This account is not active." };
  await logActivity({ id: String(u._id), email: u.email }, "password_reset", "User", String(u._id));
  return { message: "Your password has been updated. You can now sign in." };
}
