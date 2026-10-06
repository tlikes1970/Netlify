import { Capacitor, registerPlugin } from "@capacitor/core";
import type { Backup } from "./backup";

export type BackupDeliveryResult =
  | { status: "saved" }
  | { status: "cancelled" }
  | { status: "failed" }
  | { status: "download-started" };

interface BackupDocumentsPlugin {
  saveBackup(options: {
    filename: string;
    json: string;
  }): Promise<{ status: "saved" | "cancelled" | "failed" }>;
}
const BackupDocuments =
  registerPlugin<BackupDocumentsPlugin>("BackupDocuments");

/** Native success means the document stream was written and closed, not just opened.
 * Browser downloads cannot report retention; callers must not treat initiation as proof. */
export async function downloadBackup(
  backup: Backup,
): Promise<BackupDeliveryResult> {
  try {
    const json = JSON.stringify(backup, null, 2);
    const filename = `flicklet-backup-${backup.createdAt.slice(0, 10)}.json`;
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      const result = await BackupDocuments.saveBackup({ filename, json });
      if (result.status === "saved" || result.status === "cancelled")
        return result;
      return { status: "failed" };
    }
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" }),
    );
    const link = document.createElement("a");
    try {
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
    } finally {
      link.remove();
      URL.revokeObjectURL(url);
    }
    return { status: "download-started" };
  } catch {
    return { status: "failed" };
  }
}
