import type { Backup } from "./backup";
/** Shared browser/native-WebView export path. Download initiation is not retention proof. */
export function downloadBackup(backup: Backup): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `flicklet-backup-${backup.createdAt.slice(0, 10)}.json`;
  document.body.appendChild(link);
  try { link.click(); } finally { link.remove(); URL.revokeObjectURL(url); }
}
