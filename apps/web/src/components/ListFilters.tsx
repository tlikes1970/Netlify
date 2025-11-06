/**
 * Process: List Filters Component
 * Purpose: Display type and provider filters for tabbed lists with persistence
 * Data Source: Filter state from props, localStorage for persistence
 * Update Path: N/A - controlled component
 * Dependencies: Filter state management in parent
 */

import { useState } from 'react';

export type FilterType = 'all' | 'movie' | 'tv';
export interface ListFiltersState {
  type: FilterType;
  providers: string[];
}

interface ListFiltersProps {
  value: ListFiltersState;
  onChange: (filters: ListFiltersState) => void;
  availableProviders: string[];
  disabled?: boolean;
}

export default function ListFilters({ 
  value, 
  onChange, 
  availableProviders,
  disabled = false 
}: ListFiltersProps) {
  const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);

  const handleTypeChange = (type: FilterType) => {
    onChange({ ...value, type });
  };

  const handleProviderToggle = (provider: string) => {
    const newProviders = value.providers.includes(provider)
      ? value.providers.filter(p => p !== provider)
      : [...value.providers, provider];
    onChange({ ...value, providers: newProviders });
  };

  const handleClearAll = () => {
    onChange({ type: 'all', providers: [] });
    setIsProviderMenuOpen(false);
  };

  const activeFilterCount = (value.type !== 'all' ? 1 : 0) + value.providers.length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Type Filter */}
      <div className="flex items-center gap-2">
        <label className="text-sm" style={{ color: 'var(--muted)' }}>
          Type:
        </label>
        <select
          value={value.type}
          onChange={(e) => handleTypeChange(e.target.value as FilterType)}
          disabled={disabled}
          className="px-2 py-1 rounded text-sm border transition font-medium"
          style={{
            backgroundColor: 'var(--menu-bg)',
            borderColor: value.type !== 'all' ? 'var(--accent-primary)' : 'var(--menu-border)',
            color: disabled ? 'var(--menu-text-disabled)' : 'var(--menu-text)',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <option value="all">All</option>
          <option value="movie">Movie</option>
          <option value="tv">TV</option>
        </select>
      </div>

      {/* Provider Filter */}
      {availableProviders.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsProviderMenuOpen(!isProviderMenuOpen)}
            disabled={disabled}
            className="px-2 py-1 rounded text-sm border transition font-medium flex items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: value.providers.length > 0 ? 'var(--accent-primary)' : 'var(--menu-bg)',
              borderColor: value.providers.length > 0 ? 'var(--accent-primary)' : 'var(--menu-border)',
              color: disabled 
                ? 'var(--menu-text-disabled)' 
                : value.providers.length > 0 
                  ? 'white' 
                  : 'var(--menu-text)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              outlineColor: 'var(--menu-focus)',
            }}
          >
            <span>Provider{value.providers.length > 0 ? ` (${value.providers.length})` : ''}</span>
            <span className="text-xs">{isProviderMenuOpen ? '▲' : '▼'}</span>
          </button>

          {/* Provider Dropdown Menu */}
          {isProviderMenuOpen && !disabled && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsProviderMenuOpen(false)}
              />
              <div
                className="absolute top-full left-0 mt-1 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto min-w-[200px]"
                style={{
                  backgroundColor: 'var(--menu-bg)',
                  border: '1px solid var(--menu-border)',
                }}
              >
                <div className="p-2">
                  <div className="text-xs font-medium mb-2" style={{ color: 'var(--menu-text-muted)' }}>
                    Select providers:
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {availableProviders.map(provider => (
                      <label
                        key={provider}
                        className="flex items-center gap-2 p-2 rounded cursor-pointer transition-colors"
                        style={{ color: 'var(--menu-text)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--menu-hover)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={value.providers.includes(provider)}
                          onChange={() => handleProviderToggle(provider)}
                          className="rounded"
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <span className="text-sm">{provider}</span>
                      </label>
                    ))}
                  </div>
                  {value.providers.length > 0 && (
                    <button
                      onClick={() => onChange({ ...value, providers: [] })}
                      className="w-full mt-2 px-2 py-1 text-xs rounded border border-dashed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        color: 'var(--menu-text-muted)',
                        borderColor: 'var(--menu-border)',
                        backgroundColor: 'transparent',
                        outlineColor: 'var(--menu-focus)',
                      }}
                    >
                      Clear Providers
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filters Active Pill */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
          >
            Filters Active ({activeFilterCount})
          </span>
          <button
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs px-2 py-1 rounded transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: 'var(--btn)',
              color: disabled ? 'var(--menu-text-disabled)' : 'var(--text)',
              borderColor: 'var(--line)',
              border: '1px solid',
              cursor: disabled ? 'not-allowed' : 'pointer',
              outlineColor: 'var(--menu-focus)',
            }}
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}

