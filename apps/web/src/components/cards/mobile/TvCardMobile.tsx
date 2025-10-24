import React from 'react';
import type { MediaItem, CardActionHandlers } from '../card.types';
import { CardBaseMobile } from './CardBaseMobile';
import { getShowStatusInfo } from '../../../utils/showStatus';

/**
 * Process: TV Mobile Card
 * Purpose: TV-specific mobile card wrapper using CardBaseMobile
 * Data Source: MediaItem with TV-specific metadata
 * Update Path: Props passed from parent components
 * Dependencies: CardBaseMobile, getShowStatusInfo
 */

export interface TvCardMobileProps {
  item: MediaItem;
  actions?: CardActionHandlers;
  tabType?: 'watching' | 'want' | 'watched' | 'discovery';
}

export function TvCardMobile({ item, actions, tabType = 'watching' }: TvCardMobileProps) {
  const { title, year, posterUrl, synopsis, showStatus } = item;
  
  // Get TV-specific meta information
  const getMetaText = () => {
    const yearText = year || 'TBA';
    return `${yearText} • TV Show`;
  };

  // Get TV-specific chips/badges
  const getChips = () => {
    const chips = [];
    
    // Add TV SERIES badge
    chips.push(
      <span
        key="tv-series"
        className="badge"
        style={{
          fontSize: 'var(--font-xs, 10px)',
          fontWeight: '600',
          color: 'var(--muted)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-sm, 4px)',
          padding: '2px 6px'
        }}
      >
        TV SERIES
      </span>
    );
    
    // Add show status badge if available
    const statusInfo = getShowStatusInfo(showStatus);
    if (statusInfo) {
      chips.push(
        <span
          key="status"
          className="badge"
          style={{
            fontSize: 'var(--font-xs, 10px)',
            fontWeight: '600',
            color: statusInfo.color,
            backgroundColor: statusInfo.backgroundColor,
            border: `1px solid ${statusInfo.backgroundColor}`,
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '2px 6px'
          }}
        >
          {statusInfo.badge}
        </span>
      );
    }
    
    return chips;
  };

  // Get TV-specific actions
  const getActions = () => {
    const actionButtons = [];
    
    // Add primary action based on tab type
    switch (tabType) {
      case 'watching':
        actionButtons.push(
          <button
            key="watched"
            onClick={() => actions?.onWatched?.(item)}
            className="action-button"
            style={{
              fontSize: 'var(--font-xs, 11px)',
              padding: '4px 8px',
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm, 4px)',
              cursor: 'pointer'
            }}
          >
            Mark Watched
          </button>
        );
        break;
      case 'want':
        actionButtons.push(
          <button
            key="watching"
            onClick={() => {
              if (item.id && item.mediaType) {
                // Move to watching list
                const { Library } = require('../../../lib/storage');
                Library.move(item.id, item.mediaType, 'watching');
              }
            }}
            className="action-button"
            style={{
              fontSize: 'var(--font-xs, 11px)',
              padding: '4px 8px',
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm, 4px)',
              cursor: 'pointer'
            }}
          >
            Start Watching
          </button>
        );
        break;
      case 'watched':
        actionButtons.push(
          <button
            key="watching"
            onClick={() => {
              if (item.id && item.mediaType) {
                const { Library } = require('../../../lib/storage');
                Library.move(item.id, item.mediaType, 'watching');
              }
            }}
            className="action-button"
            style={{
              fontSize: 'var(--font-xs, 11px)',
              padding: '4px 8px',
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm, 4px)',
              cursor: 'pointer'
            }}
          >
            Rewatch
          </button>
        );
        break;
      case 'discovery':
        actionButtons.push(
          <button
            key="want"
            onClick={() => actions?.onWant?.(item)}
            className="action-button"
            style={{
              fontSize: 'var(--font-xs, 11px)',
              padding: '4px 8px',
              backgroundColor: 'var(--accent)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius-sm, 4px)',
              cursor: 'pointer'
            }}
          >
            Add to Want
          </button>
        );
        break;
    }
    
    return actionButtons;
  };

  // Get swipe configuration based on tab type
  const getSwipeConfig = () => {
    switch (tabType) {
      case 'watching':
        return {
          leftAction: {
            label: 'Want',
            action: () => actions?.onWant?.(item)
          },
          rightAction: {
            label: 'Watched',
            action: () => actions?.onWatched?.(item)
          }
        };
      case 'want':
        return {
          leftAction: {
            label: 'Watching',
            action: () => {
              if (item.id && item.mediaType) {
                const { Library } = require('../../../lib/storage');
                Library.move(item.id, item.mediaType, 'watching');
              }
            }
          },
          rightAction: {
            label: 'Watched',
            action: () => actions?.onWatched?.(item)
          }
        };
      case 'watched':
        return {
          leftAction: {
            label: 'Want',
            action: () => actions?.onWant?.(item)
          },
          rightAction: {
            label: 'Watching',
            action: () => {
              if (item.id && item.mediaType) {
                const { Library } = require('../../../lib/storage');
                Library.move(item.id, item.mediaType, 'watching');
              }
            }
          }
        };
      case 'discovery':
        return {
          leftAction: {
            label: 'Want',
            action: () => actions?.onWant?.(item)
          },
          rightAction: {
            label: 'Watching',
            action: () => actions?.onWant?.(item)
          }
        };
      default:
        return {};
    }
  };

  // Get providers for "where to watch"
  const getProviders = () => {
    const providers = [];
    
    // Add network info if available
    if (item.networkInfo?.networks && item.networkInfo.networks.length > 0) {
      item.networkInfo.networks.forEach(network => {
        providers.push({ name: network, url: '#' });
      });
    }
    
    // Add streaming services if available
    if (item.streamingInfo?.providers && item.streamingInfo.providers.length > 0) {
      item.streamingInfo.providers.forEach(provider => {
        providers.push({ name: provider.name, url: provider.url || '#' });
      });
    }
    
    return providers;
  };

  return (
    <CardBaseMobile
      posterUrl={posterUrl}
      title={title}
      meta={getMetaText()}
      summary={synopsis}
      chips={
        <div style={{ display: 'flex', gap: 'var(--space-xs, 4px)', flexWrap: 'wrap' }}>
          {getChips()}
        </div>
      }
      actions={
        <div style={{ display: 'flex', gap: 'var(--space-xs, 4px)', flexWrap: 'wrap' }}>
          {getActions()}
        </div>
      }
      swipeConfig={getSwipeConfig()}
      testId={`tv-card-mobile-${item.id}`}
      item={item}
      onDelete={() => actions?.onDelete?.(item)}
      draggable={tabType === 'watching'}
      providers={getProviders()}
    />
  );
}
