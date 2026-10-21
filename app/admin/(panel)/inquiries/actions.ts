"use server";
import { z } from "zod";
import { ClientError, guarded, oid, str, type ActionResult } from "@/lib/admin";
import { INQUIRY_STATUSES, Inquiry } from "@/lib/models";
import { logActivity } from "@/lib/activity";

export async function updateInquiry(_: ActionResult, fd: FormData): Promise<ActionResult> {
  return guarded("inquiries.manage", async (u) => {
    const status = z.enum(INQUIRY_STATUSES).parse(str(fd, "status"));
    const notes = str(fd, "notes", 4000);
    const doc = await Inquiry.findByIdAndUpdate(oid(str(fd, "id")), { status, notes }, { new: true }).lean();
    if (!doc) throw new ClientError("Inquiry not found");
    await logActivity(u, "update", "Inquiry", String(doc._id), { status });
    return { ok: true, message: "Inquiry updated" };
  });
}
