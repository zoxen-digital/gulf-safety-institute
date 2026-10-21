import "server-only";
import type { SessionUser } from "./auth";
import { logActivity } from "./activity";
import type { Permission } from "./permissions";
import type { UploadFolder } from "./upload-core";

/** Public content imagery needs content rights; trainee photos and signatures go to "misc". */
export function uploadPermission(folder: UploadFolder): Permission {
  return folder === "misc" ? "uploads.people" : "uploads.content";
}

export async function activityForUpload(user: SessionUser, url: string, size: number) {
  await logActivity(user, "upload", "StoredUpload", url, { size });
}
