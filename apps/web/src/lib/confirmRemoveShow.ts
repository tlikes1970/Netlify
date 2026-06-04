/**
 * Confirm-before-remove for library shows (Phase 1 / 1.5 action feedback).
 */

import type { MediaType } from '@/components/cards/card.types';
import { confirmAction } from '@/state/confirm';
import { guardMutation, isMutationBlocked } from './readOnlyGuard';
import { Library } from './storage';

export const REMOVE_SHOW_CONFIRM = {
  title: 'Remove this show?',
  body: 'This will remove it from your library. You can add it again later if you change your mind.',
  confirmLabel: 'Remove',
  cancelLabel: 'Cancel',
} as const;

/** @deprecated Use REMOVE_SHOW_CONFIRM — kept for tests referencing message text */
export const CONFIRM_REMOVE_SHOW_MESSAGE = `${REMOVE_SHOW_CONFIRM.title} ${REMOVE_SHOW_CONFIRM.body}`;

/** @returns true if the user chose to remove */
export async function confirmRemoveShow(): Promise<boolean> {
  return confirmAction({
    ...REMOVE_SHOW_CONFIRM,
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
