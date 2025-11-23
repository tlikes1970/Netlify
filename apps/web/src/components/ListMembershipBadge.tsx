/**
 * Process: List Membership Badge Display
 * Purpose: Read-only visual indicator showing which list a media item belongs to
 * Data Source: getMembershipInfo() helper function
 * Update Path: Library.upsert(), Library.move(), Library.remove()
 * Dependencies: membership.ts helper, Library storage
 */

import type { MediaType } from "./cards/card.types";
import { getMembershipInfo } from "../lib/membership";

export interface ListMembershipBadgeProps {
  item: {
    id: string | number;
    mediaType: MediaType;
  };
  className?: string;
}

/**
 * ListMembershipBadge - Read-only badge showing list membership
 * Returns null if item is not in any list (Phase 1: no "Not in any list" indicator)
 */
export function ListMembershipBadge({
  item,
  className = "",
}: ListMembershipBadgeProps): JSX.Element | null {
  const { list, displayName } = getMembershipInfo(item);

  // Phase 1: Return null if not in any list
  if (list === null || displayName === null) {
    return null;
  }

  const label = `In list: ${displayName}`;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${className}`}
      style={{
        backgroundColor: "var(--accent)",
        color: "white",
        border: "1px solid var(--accent)",
      }}
      title={label}
    >
      {label}
    </span>
  );
}

