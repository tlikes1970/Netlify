/**
 * Process: Swipe Maps
 * Purpose: Centralized swipe action configuration per tab type
 * Data Source: Tab type and media type combinations
 * Update Path: Update action mappings here when swipe behavior changes
 * Dependencies: CardActionHandlers, MediaItem
 */

import type { MediaItem, CardActionHandlers } from '../components/cards/card.types';
import { Library } from './storage';

export interface SwipeAction {
  label: string;
  action: (item: MediaItem, actions?: CardActionHandlers) => void;
}

export interface SwipeConfig {
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
}

export type TabType = 'watching' | 'want' | 'watched' | 'discovery';

/**
 * Get swipe configuration for a specific tab type
 * @param tabKey - The current tab context (watching|watched|wishlist)
 * @param item - The media item
 * @returns Swipe configuration with left and right actions
 */
export function getSwipeConfig(
  tabKey: 'watching' | 'watched' | 'wishlist',
  item: MediaItem
): SwipeConfig {
  switch (tabKey) {
    case 'watching':
      return {
        leftAction: {
          label: 'Watched',
          action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watched');
            }
          }
        },
        rightAction: {
          label: 'Wishlist',
          action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'wishlist');
            }
          }
        }
      };

    case 'watched':
      return {
        leftAction: {
          label: 'Watching',
          action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }
        },
        rightAction: {
          label: 'Wishlist',
          action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'wishlist');
            }
          }
        }
      };

    case 'wishlist':
      return {
        leftAction: {
          label: 'Watching',
          action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }
        },
        rightAction: {
          label: 'Watched',
          action: () => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watched');
            }
          }
        }
      };

    default:
      return {};
  }
}

/**
 * Get all available swipe actions for a tab type (for overflow menu)
 * @param tabType - The current tab context
 * @param mediaType - The media type (tv or movie)
 * @param actions - Action handlers for the card
 * @returns Array of all available actions
 */
export function getAllSwipeActions(
  tabType: TabType,
  _mediaType: 'tv' | 'movie',
  actions?: CardActionHandlers
): SwipeAction[] {

  switch (tabType) {
    case 'watching':
      return [
        {
          label: 'Want to Watch',
          action: (item: MediaItem) => actions?.onWant?.(item)
        },
        {
          label: 'Mark as Watched',
          action: (item: MediaItem) => actions?.onWatched?.(item)
        },
        {
          label: 'Not Interested',
          action: (item: MediaItem) => actions?.onNotInterested?.(item)
        }
      ];

    case 'want':
      return [
        {
          label: 'Start Watching',
          action: (item: MediaItem) => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }
        },
        {
          label: 'Mark as Watched',
          action: (item: MediaItem) => actions?.onWatched?.(item)
        },
        {
          label: 'Not Interested',
          action: (item: MediaItem) => actions?.onNotInterested?.(item)
        }
      ];

    case 'watched':
      return [
        {
          label: 'Want to Watch',
          action: (item: MediaItem) => actions?.onWant?.(item)
        },
        {
          label: 'Start Watching',
          action: (item: MediaItem) => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }
        },
        {
          label: 'Not Interested',
          action: (item: MediaItem) => actions?.onNotInterested?.(item)
        }
      ];

    case 'discovery':
      return [
        {
          label: 'Want to Watch',
          action: (item: MediaItem) => actions?.onWant?.(item)
        },
        {
          label: 'Start Watching',
          action: (item: MediaItem) => actions?.onWant?.(item)
        },
        {
          label: 'Mark as Watched',
          action: (item: MediaItem) => actions?.onWatched?.(item)
        },
        {
          label: 'Not Interested',
          action: (item: MediaItem) => actions?.onNotInterested?.(item)
        }
      ];

    default:
      return [];
  }
}

/**
 * Get human-readable swipe hint labels for a specific tab type
 * @param tabKey - The current tab context (watching|watched|wishlist)
 * @returns Object with leftLabel and rightLabel for swipe hints
 */
export function getSwipeLabels(tabKey: 'watching' | 'watched' | 'wishlist') {
  switch (tabKey) {
    case 'watching':
      return { leftLabel: 'Move to Wishlist', rightLabel: '' };
    case 'watched':
      return { leftLabel: 'Move to Wishlist', rightLabel: '' };
    case 'wishlist':
      return { leftLabel: 'Mark Watched', rightLabel: '' };
    default:
      return { leftLabel: '', rightLabel: '' };
  }
}
