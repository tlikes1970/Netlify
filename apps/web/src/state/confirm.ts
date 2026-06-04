/**
 * Global confirm dialog bridge (mirrors toast callback in state/actions.ts).
 * App mounts ConfirmHost to register the handler.
 */

export type ConfirmDialogOptions = {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

let confirmHandler: ((options: ConfirmDialogOptions) => Promise<boolean>) | null =
  null;

export function setConfirmHandler(
  handler: ((options: ConfirmDialogOptions) => Promise<boolean>) | null
): void {
  confirmHandler = handler;
}

export async function confirmAction(
  options: ConfirmDialogOptions
): Promise<boolean> {
  if (confirmHandler) {
    return confirmHandler(options);
  }
  return window.confirm(`${options.title}\n\n${options.body}`);
}
