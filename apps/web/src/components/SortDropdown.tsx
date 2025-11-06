/**
 * Process: Sort Dropdown Component
 * Purpose: Display sort options for tabbed lists with visual indicator
 * Data Source: Sort mode from props
 * Update Path: N/A - display component
 * Dependencies: None
 */

export type SortMode = 'date-newest' | 'date-oldest' | 'alphabetical-az' | 'alphabetical-za' | 'streaming-service' | 'custom';

interface SortDropdownProps {
  value: SortMode;
  onChange: (mode: SortMode) => void;
  disabled?: boolean;
}

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: 'date-newest', label: 'Date Added (newest → oldest)' },
  { value: 'date-oldest', label: 'Date Added (oldest → newest)' },
  { value: 'alphabetical-az', label: 'Alphabetical (A → Z)' },
  { value: 'alphabetical-za', label: 'Alphabetical (Z → A)' },
  { value: 'streaming-service', label: 'Streaming Service' },
  { value: 'custom', label: 'Custom Order' },
];

export default function SortDropdown({ value, onChange, disabled = false }: SortDropdownProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm" style={{ color: 'var(--muted)' }}>
        Sort:
      </label>
      <>
        <style>{`
          .sort-dropdown-select {
            background-color: var(--menu-bg) !important;
            color: var(--menu-text) !important;
            border-color: var(--menu-border) !important;
          }
          .sort-dropdown-select:focus-visible {
            outline: 2px solid var(--menu-focus) !important;
            outline-offset: 2px !important;
          }
          .sort-dropdown-select:disabled {
            background-color: var(--menu-bg) !important;
            color: var(--menu-text-disabled) !important;
            cursor: not-allowed !important;
          }
          .sort-dropdown-select option {
            background-color: var(--menu-bg) !important;
            color: var(--menu-text) !important;
          }
          .sort-dropdown-select option:checked,
          .sort-dropdown-select option[selected] {
            background-color: var(--menu-hover) !important;
            color: var(--menu-text) !important;
          }
          .sort-dropdown-select option:disabled {
            color: var(--menu-text-disabled) !important;
          }
        `}</style>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortMode)}
          disabled={disabled}
          className="sort-dropdown-select px-3 py-1.5 rounded text-sm border transition font-medium"
          style={{
            backgroundColor: 'var(--menu-bg)',
            borderColor: value === 'custom' ? 'var(--accent-primary)' : 'var(--menu-border)',
            color: disabled ? 'var(--menu-text-disabled)' : 'var(--menu-text)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: 500,
          }}
        >
          {sortOptions.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              style={{
                backgroundColor: value === option.value ? 'var(--menu-hover)' : 'var(--menu-bg)',
                color: value === option.value ? 'var(--menu-text)' : 'var(--menu-text)',
                fontWeight: value === option.value ? 600 : 500,
              }}
            >
              {option.label}
              {value === option.value && option.value !== 'custom' ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </>
      {value === 'custom' && (
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
        >
          Custom
        </span>
      )}
    </div>
  );
}

