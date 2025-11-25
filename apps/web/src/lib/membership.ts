/**
 * Process: Membership Info Helper
 * Purpose: Centralized helper to get list membership information for a media item
 * Data Source: Library.getCurrentList() is the canonical check
 * Update Path: Library.upsert(), Library.move(), Library.remove()
 * Dependencies: Library storage, getListDisplayName()
 */

import type { MediaType } from "../components/cards/card.types";
import type { ListName } from "../state/library.types";
import { Library } from "./storage";
import { getListDisplayName } from "./storage";

export interface MembershipInfo {
  list: ListName | null;
  displayName: string | null;
}

/**
 * Get membership information for a media item.
 * Returns the list name and human-readable display name, or null if not in any list.
 */
export function getMembershipInfo(item: {
  id: string | number;
  mediaType: MediaType;
}): MembershipInfo {
  const list = Library.getCurrentList(item.id, item.mediaType);

  if (list === null) {
    return { list: null, displayName: null };
  }

  const displayName = getListDisplayName(list);
  return { list, displayName };
}




