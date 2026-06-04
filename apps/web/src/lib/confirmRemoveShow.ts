/**
 * Confirm-before-remove for library shows (Phase 1 action feedback).
 * Uses window.confirm — lowest-risk pattern aligned with existing settings confirms.
 */

import type { MediaType } from '@/components/cards/card.types';
import { guardMutation, isMutationBlocked } from './readOnlyGuard';
import { Library } from './storage';

export const CONFIRM_REMOVE_SHOW_MESSAGE =
  'Remove this show from your library? You can add it again later.';

/** @returns true if the user chose to remove */
export function confirmRemoveShow(): boolean {
  return window.confirm(CONFIRM_REMOVE_SHOW_MESSAGE);
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
  if (!confirmRemoveShow()) {
    return;
  }
  Library.remove(id, mediaType);
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
