/**
 * Process: My List Toggle Button
 * Purpose: Action button to add/change list membership for a media item
 * Data Source: getMembershipInfo() helper function (canonical source for membership)
 * Update Path: Library.upsert(), Library.move(), Library.remove()
 * Dependencies: membership.ts helper, Library storage, ListSelectorModal
 * 
 * USAGE:
 * - CardV2: Shows on poster overlay (top-right)
 * - TabCard: Shows on poster overlay (top-right)
 * - SearchResults: Shows in action area
 * 
 * NOTE: This is the ACTION surface for list membership.
 * ListMembershipBadge is the read-only visual indicator.
 */

import { useState, useEffect } from 'react';
import ListSelectorModal from './ListSelectorModal';
import type { MediaItem } from './cards/card.types';
import type { ListName } from '../state/library.types';
import { getMembershipInfo } from '../lib/membership';
import { Library } from '../lib/storage';

interface MyListToggleProps {
  item: MediaItem;
  /**
   * Optional: The list context of the current page/tab.
   * If provided and matches the item's list, shows "My List +" instead of "In list: X"
   * because the context already implies membership.
   * 
   * Examples:
   * - On "Currently Watching" tab: currentListContext="watching"
   * - On "Want to Watch" tab: currentListContext="wishlist"
   * - On search/home (mixed): currentListContext=undefined (show "In list: X" if in list)
   */
  currentListContext?: ListName;
}

export default function MyListToggle({ item, currentListContext }: MyListToggleProps) {
  const [showModal, setShowModal] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Reactive membership state - updates when library changes
  const [membershipInfo, setMembershipInfo] = useState(() => getMembershipInfo(item));

  // Subscribe to library changes to update button text
  useEffect(() => {
    const updateMembership = () => {
      setMembershipInfo(getMembershipInfo(item));
    };

    // Update immediately
    updateMembership();

    // Subscribe to library changes
    const unsubscribe = Library.subscribe(updateMembership);

    return () => {
      unsubscribe();
    };
  }, [item.id, item.mediaType]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent triggering parent poster click
    setIsPressed(true);
    // Always show modal for list selection
    setShowModal(true);
    setTimeout(() => setIsPressed(false), 200);
  };

  const handleLongPress = () => {
    setShowModal(true);
  };

  const getButtonText = () => {
    // If we're on a list-specific page, always show "My List +" (context already implies membership)
    // This prevents redundant "In list: Currently Watching" text on list pages
    if (currentListContext) {
      return 'My List +';
    }
    
    // If not in any list, show "My List +"
    if (membershipInfo.displayName === null) {
      return 'My List +';
    }
    
    // Otherwise, show "In list: <DisplayName>" (useful in mixed contexts like search/home)
    return `In list: ${membershipInfo.displayName}`;
  };

  const getButtonTitle = () => {
    // If not in any list
    if (membershipInfo.displayName === null) {
      return 'Add to one of your lists';
    }
    
    // If we're on a list-specific page, show simple tooltip (context already implies membership)
    if (currentListContext) {
      return 'Click to change lists';
    }
    
    // Otherwise, show full info
    return `Currently in list: ${membershipInfo.displayName}. Click to change lists.`;
  };

  return (
    <>
      <button
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Prevent triggering parent poster click
          handleLongPress();
        }}
        className={`absolute right-1.5 top-1.5 rounded-full border bg-background/80 px-2 py-0.5 text-[11px] leading-none backdrop-blur transition hover:bg-accent hover:text-accent-foreground ${
          isPressed ? 'scale-95 opacity-80' : 'hover:scale-105 hover:opacity-90'
        } cursor-pointer`}
        style={{ 
          backgroundColor: isPressed ? 'var(--accent)' : 'rgba(0,0,0,0.8)', 
          color: 'white', 
          borderColor: 'rgba(255,255,255,0.15)', 
          border: '1px solid' 
        }}
        disabled={isPressed}
        title={getButtonTitle()}
        data-testid="cardv2-mylist"
      >
        {getButtonText()}
      </button>

      <ListSelectorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        item={item}
      />
    </>
  );
}
