import { t as coreText, useLanguage } from "@/lib/language";
import { useId } from 'react';
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

const sortOptions = [
  { value: 'date-newest', label: 'coreNewest' },
  { value: 'date-oldest', label: 'coreOldest' },
  { value: 'alphabetical-az', label: 'coreAZ' },
  { value: 'alphabetical-za', label: 'coreZA' },
  { value: 'streaming-service', label: 'coreNetwork' },
  { value: 'custom', label: 'coreCustomOrder' },
] as const;

export default function SortDropdown({ value, onChange, disabled = false }: SortDropdownProps) {
  useLanguage();
  const id = useId();
  return (
    <div className="library-sort-control flex items-center gap-2">
      <label htmlFor={id} className="text-sm" style={{ color: 'var(--muted)' }}>{coreText("coreSort")}</label>
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
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as SortMode)}
          disabled={disabled}
          className="sort-dropdown-select library-filter-control px-3 py-1.5 rounded text-sm border transition font-medium"
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
              {coreText(option.label)}
              {value === option.value && option.value !== 'custom' ? ' ✓' : ''}
            </option>
          ))}
        </select>
      </>
      {value === 'custom' && (
        <span
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
        >{coreText("coreCustom")}</span>
      )}
    </div>
  );
}

