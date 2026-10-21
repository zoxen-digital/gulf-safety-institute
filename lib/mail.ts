import "server-only";
import nodemailer from "nodemailer";

export const isMailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);

export async function sendMail(to: string, subject: string, text: string) {
  if (!isMailConfigured() || !to) return false;
  const t = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
    return true;
  } catch (e) {
    console.error("mail failed", (e as Error).message);
    return false;
  }
}
