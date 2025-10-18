import { flag } from '../../lib/flags';

export interface ActionDescriptor {
  id: string;
  label: string;
  onClick: () => void;
}

export interface ActionItem {
  id: string;
  title: string;
  status?: string;
  // Add other properties as needed based on existing card data structure
}

export type ActionContext = 'home' | 'tab';

/**
 * Get the primary action for an item based on context
 * Uses existing handlers - no new business logic
 */
export function getPrimaryAction(item: ActionItem, context: ActionContext): ActionDescriptor | null {
  void context; // keep signature stable, mute TS6133
  // Check if the actions split feature is enabled
  const gate = document.documentElement.dataset.compactMobileV1 === 'true';
  const flagEnabled = flag('mobile_actions_split_v1');
  
  if (!gate || !flagEnabled) {
    return null;
  }

  // Determine primary action based on current status and context
  const currentStatus = item.status || 'none';
  
  switch (currentStatus) {
    case 'watching':
      return {
        id: 'mark-watched',
        label: 'Mark Watched',
        onClick: () => {
          // Call existing handler - this would be wired to the actual handler
          console.log('Mark as watched:', item.id);
          // In real implementation, this would call the existing markAsWatched handler
        }
      };
    
    case 'want':
    case 'wishlist':
      return {
        id: 'mark-watching',
        label: 'Start Watching',
        onClick: () => {
          console.log('Start watching:', item.id);
          // In real implementation, this would call the existing addToWatching handler
        }
      };
    
    case 'watched':
      return {
        id: 'mark-want',
        label: 'Want to Watch',
        onClick: () => {
          console.log('Add to want list:', item.id);
          // In real implementation, this would call the existing addToWishlist handler
        }
      };
    
    default:
      // For items not in any list, primary action is "Want to Watch"
      return {
        id: 'mark-want',
        label: 'Want to Watch',
        onClick: () => {
          console.log('Add to want list:', item.id);
          // In real implementation, this would call the existing addToWishlist handler
        }
      };
  }
}

/**
 * Get all available actions for an item (for overflow menu)
 * Uses existing handlers - no new business logic
 */
export function getAllActions(item: ActionItem, context: ActionContext): ActionDescriptor[] {
  void context; // keep signature stable, mute TS6133
  const gate = document.documentElement.dataset.compactMobileV1 === 'true';
  const flagEnabled = flag('mobile_actions_split_v1');
  
  if (!gate || !flagEnabled) {
    return [];
  }

  const currentStatus = item.status || 'none';
  const actions: ActionDescriptor[] = [];

  // Add actions based on current status
  switch (currentStatus) {
    case 'watching':
      actions.push(
        {
          id: 'mark-watched',
          label: 'Mark Watched',
          onClick: () => console.log('Mark as watched:', item.id)
        },
        {
          id: 'mark-want',
          label: 'Move to Want List',
          onClick: () => console.log('Move to want list:', item.id)
        },
        {
          id: 'remove',
          label: 'Remove',
          onClick: () => console.log('Remove from list:', item.id)
        }
      );
      break;
    
    case 'want':
    case 'wishlist':
      actions.push(
        {
          id: 'mark-watching',
          label: 'Start Watching',
          onClick: () => console.log('Start watching:', item.id)
        },
        {
          id: 'mark-watched',
          label: 'Mark Watched',
          onClick: () => console.log('Mark as watched:', item.id)
        },
        {
          id: 'remove',
          label: 'Remove',
          onClick: () => console.log('Remove from list:', item.id)
        }
      );
      break;
    
    case 'watched':
      actions.push(
        {
          id: 'mark-want',
          label: 'Want to Watch',
          onClick: () => console.log('Add to want list:', item.id)
        },
        {
          id: 'mark-watching',
          label: 'Start Watching',
          onClick: () => console.log('Start watching:', item.id)
        },
        {
          id: 'remove',
          label: 'Remove',
          onClick: () => console.log('Remove from list:', item.id)
        }
      );
      break;
    
    default:
      // For items not in any list
      actions.push(
        {
          id: 'mark-want',
          label: 'Want to Watch',
          onClick: () => console.log('Add to want list:', item.id)
        },
        {
          id: 'mark-watching',
          label: 'Start Watching',
          onClick: () => console.log('Start watching:', item.id)
        }
      );
      break;
  }

  return actions;
}

