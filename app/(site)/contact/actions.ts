"use server";
import { createHash } from "crypto";
import { z } from "zod";
import { connectDb, isDbConfigured } from "@/lib/db";
import { Course, GCC_COUNTRIES, Inquiry, Setting } from "@/lib/models";
import { clientId, rateLimit } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mail";
import { INQUIRY_TYPES } from "@/lib/inquiry";

export type InquiryState = { status: "idle" | "success" | "error"; message?: string; errors?: Record<string, string>; values?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(120),
  company: z.string().trim().max(160).optional().default(""),
  email: z.string().trim().email("Please enter a valid email address").max(160),
  phone: z.string().trim().min(6, "Please enter a phone or WhatsApp number").max(30).regex(/^[+\d\s()-]+$/, "Use digits, spaces and + only"),
  country: z.union([z.enum(GCC_COUNTRIES), z.literal("Other"), z.literal("")]).default(""),
  type: z.enum(INQUIRY_TYPES),
  course: z.string().trim().max(100).optional().default(""),
  traineesCount: z.union([z.literal(""), z.coerce.number().int().min(1, "Must be at least 1").max(10000)]).optional(),
  message: z.string().trim().min(10, "Please add a few details (at least 10 characters)").max(4000),
});

export async function submitInquiry(_prev: InquiryState, fd: FormData): Promise<InquiryState> {
  // Honeypot: bots fill hidden fields. Respond neutrally without saving.
  if (String(fd.get("website") || "")) return { status: "success", message: "Thank you. Your inquiry has been received." };

  const raw = Object.fromEntries(["name", "company", "email", "phone", "country", "type", "course", "traineesCount", "message"].map((k) => [k, String(fd.get(k) ?? "")]));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { status: "error", message: "Please correct the highlighted fields.", errors, values: raw };
  }
  if (!isDbConfigured()) return { status: "error", message: "Online inquiries are not available yet. Please contact us by phone or email." };

  try {
    await connectDb();
    const cid = await clientId();
    if (!(await rateLimit("inquiry", cid, 5, 600))) return { status: "error", message: "Too many submissions. Please try again in a few minutes." };

    const d = parsed.data;
    const fingerprint = createHash("sha256").update(`${d.email.toLowerCase()}|${d.message}`).digest("hex");
    if (await Inquiry.exists({ fingerprint, createdAt: { $gt: new Date(Date.now() - 24 * 3600_000) } }))
      return { status: "success", message: "We already received this inquiry. Our team will contact you shortly." };

    const course = d.course ? await Course.findOne({ slug: d.course }).select("name").lean() : null;
    const inq = await Inquiry.create({
      name: d.name, company: d.company, email: d.email, phone: d.phone, country: d.country, type: d.type,
      course: course?._id, courseName: course?.name || "", traineesCount: typeof d.traineesCount === "number" ? d.traineesCount : null,
      message: d.message, fingerprint,
    });

    const s = await Setting.findOne({ key: "site" }).lean();
    const to = (s?.value as { notificationEmail?: string })?.notificationEmail || process.env.NOTIFICATION_EMAIL || "";
    await sendMail(
      to,
      `New ${d.type}: ${d.name}${d.company ? ` (${d.company})` : ""}`,
      [`Name: ${d.name}`, `Company: ${d.company}`, `Email: ${d.email}`, `Phone: ${d.phone}`, `Country: ${d.country}`, `Type: ${d.type}`, `Course: ${course?.name || "-"}`, `Trainees: ${d.traineesCount || "-"}`, "", d.message, "", `Admin: ${process.env.APP_URL || ""}/admin/inquiries?id=${inq._id}`].join("\n"),
    );
    return { status: "success", message: "Thank you. Your inquiry has been received and our team will contact you shortly." };
  } catch (e) {
    console.error("inquiry failed", (e as Error).message);
    return { status: "error", message: "We could not submit your inquiry right now. Please try again or contact us directly." };
  }
}
