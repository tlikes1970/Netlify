/**
 * Process: Swipe Maps
 * Purpose: Centralized swipe action configuration per tab type
 * Data Source: Tab type and media type combinations
 * Update Path: Update action mappings here when swipe behavior changes
 * Dependencies: CardActionHandlers, MediaItem
 */

import type { MediaItem, CardActionHandlers } from '../components/cards/card.types';

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
 * @param tabType - The current tab context
 * @param mediaType - The media type (tv or movie)
 * @param actions - Action handlers for the card
 * @returns Swipe configuration with left and right actions
 */
export function getSwipeConfig(
  tabType: TabType,
  mediaType: 'tv' | 'movie',
  actions?: CardActionHandlers
): SwipeConfig {
  const { Library } = require('../lib/storage');

  switch (tabType) {
    case 'watching':
      return {
        leftAction: {
          label: 'Want',
          action: (item: MediaItem) => actions?.onWant?.(item)
        },
        rightAction: {
          label: 'Watched',
          action: (item: MediaItem) => actions?.onWatched?.(item)
        }
      };

    case 'want':
      return {
        leftAction: {
          label: 'Watching',
          action: (item: MediaItem) => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }
        },
        rightAction: {
          label: 'Watched',
          action: (item: MediaItem) => actions?.onWatched?.(item)
        }
      };

    case 'watched':
      return {
        leftAction: {
          label: 'Want',
          action: (item: MediaItem) => actions?.onWant?.(item)
        },
        rightAction: {
          label: 'Watching',
          action: (item: MediaItem) => {
            if (item.id && item.mediaType) {
              Library.move(item.id, item.mediaType, 'watching');
            }
          }
        }
      };

    case 'discovery':
      return {
        leftAction: {
          label: 'Want',
          action: (item: MediaItem) => actions?.onWant?.(item)
        },
        rightAction: {
          label: 'Watching',
          action: (item: MediaItem) => actions?.onWant?.(item) // Discovery uses onWant for "start watching"
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
  mediaType: 'tv' | 'movie',
  actions?: CardActionHandlers
): SwipeAction[] {
  const { Library } = require('../lib/storage');

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
