import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import {
  setConfirmHandler,
  type ConfirmDialogOptions,
} from '@/state/confirm';

type PendingConfirm = ConfirmDialogOptions & { key: string };

/**
 * Registers the global confirm handler and renders the active dialog.
 * Mount once near the app root (alongside toasts).
 */
export default function ConfirmHost() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setPending(null);
  }, []);

  useEffect(() => {
    setConfirmHandler((options) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setPending({
          ...options,
          key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        });
      });
    });

    return () => {
      setConfirmHandler(null);
      resolveRef.current?.(false);
      resolveRef.current = null;
    };
  }, []);

  if (!pending) {
    return null;
  }

  return (
    <ConfirmModal
      key={pending.key}
      isOpen
      title={pending.title}
      body={pending.body}
      confirmLabel={pending.confirmLabel}
      cancelLabel={pending.cancelLabel}
      destructive={pending.destructive}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );
}
