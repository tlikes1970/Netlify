export type ToastAction = { label: string; onClick: () => void };
export type ToastCallback = (
  message: string,
  type: 'success' | 'error' | 'info',
  action?: ToastAction,
) => void;

let callback: ToastCallback | null = null;

export function setGlobalToastCallback(next: ToastCallback): void {
  callback = next;
}

export function getGlobalToastCallback(): ToastCallback | null {
  return callback;
}
