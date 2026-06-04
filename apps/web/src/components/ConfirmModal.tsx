import { useEffect, useId, useRef } from 'react';
import ModalPortal from './ModalPortal';
import type { ConfirmDialogOptions } from '@/state/confirm';

export type ConfirmModalProps = ConfirmDialogOptions & {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Reusable Flicklet confirmation dialog (Phase 1.5 action feedback).
 */
export default function ConfirmModal({
  isOpen,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => {
      const cancelBtn = panelRef.current?.querySelector<HTMLButtonElement>(
        '[data-confirm-cancel]'
      );
      cancelBtn?.focus();
    }, 0);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-modal backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
        onClick={onCancel}
        role="presentation"
      >
        <div
          ref={panelRef}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={bodyId}
          className="w-full max-w-md rounded-xl p-6 shadow-xl"
          style={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--line)',
            marginBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id={titleId}
            className="text-lg font-semibold mb-3"
            style={{ color: 'var(--text)' }}
          >
            {title}
          </h2>
          <p
            id={bodyId}
            className="text-sm mb-6 leading-relaxed"
            style={{ color: 'var(--muted)' }}
          >
            {body}
          </p>
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              data-confirm-cancel
              onClick={onCancel}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg transition-colors min-h-[44px]"
              style={{
                backgroundColor: 'var(--btn)',
                color: 'var(--text)',
                border: '1px solid var(--line)',
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              data-confirm-ok
              onClick={onConfirm}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg transition-colors min-h-[44px] font-medium"
              style={{
                backgroundColor: destructive ? '#dc2626' : 'var(--accent)',
                color: '#fff',
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
