import { t as coreText } from "./language";
/**
 * Confirm-before-remove for library shows (Phase 1 / 1.5 action feedback).
 */

import type { MediaType } from '@/components/cards/card.types';
import { confirmAction } from '@/state/confirm';
import { guardMutation, isMutationBlocked } from './readOnlyGuard';
import { Library } from './storage';

export const REMOVE_SHOW_CONFIRM = {
  title: 'Remove this title?',
  body: 'This removes the title from your Library, including its saved notes, tags, personal rating, and custom-list memberships. Adding it again will not restore those details.',
  confirmLabel: 'Remove',
  cancelLabel: 'Cancel',
} as const;

/** @deprecated Use REMOVE_SHOW_CONFIRM — kept for tests referencing message text */
export const CONFIRM_REMOVE_SHOW_MESSAGE = `${REMOVE_SHOW_CONFIRM.title} ${REMOVE_SHOW_CONFIRM.body}`;

/** @returns true if the user chose to remove */
export async function confirmRemoveShow(): Promise<boolean> {
  return confirmAction({
    title: coreText('coreRemoveTitle'),
    body: coreText('coreRemoveBody'),
    confirmLabel: coreText('coreRemove'),
    cancelLabel: coreText('coreCancel'),
    destructive: true,
  });
}

/**
 * Blocks read-only users before the dialog; removes only after confirm.
 */
export function removeShowWithConfirmation(
  id: string | number,
  mediaType: MediaType
): void {
  if (isMutationBlocked()) {
    guardMutation();
    return;
  }
  void confirmRemoveShow().then((confirmed) => {
    if (confirmed) {
      Library.remove(id, mediaType);
    }
  });
}

export function removeMediaItemWithConfirmation(item: {
  id?: string | number;
  mediaType?: MediaType;
}): void {
  if (item.id == null || !item.mediaType) {
    return;
  }
  removeShowWithConfirmation(item.id, item.mediaType);
}

/** Awaitable removal for management UIs; confirmation and mutation are separate phases. */
export async function removeShowWithResult(
  id: string | number,
  mediaType: MediaType,
  options: { title: string; body: string; confirmLabel: string; cancelLabel: string },
  onRemoving: () => void,
): Promise<'removed' | 'cancelled' | 'blocked'> {
  if (!guardMutation()) return 'blocked';
  if (!await confirmAction({ ...options, destructive: true })) return 'cancelled';
  if (!guardMutation()) return 'blocked';
  onRemoving();
  await Library.remove(id, mediaType);
  return 'removed';
}
