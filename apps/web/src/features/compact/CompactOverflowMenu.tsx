import { useState, useRef, useEffect } from 'react';
import { ActionItem, ActionContext, getAllActions } from './actionsMap';
import { isCompactMobileV1, isActionsSplit } from '../../lib/mobileFlags';

interface CompactOverflowMenuProps {
  item: ActionItem;
  context: ActionContext;
}

export function CompactOverflowMenu({ item, context }: CompactOverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Compute conditional values after hooks
  const gate = isCompactMobileV1();
  const flagEnabled = isActionsSplit();
  
  if (!gate || !flagEnabled) {
    return null;
  }

  const actions = getAllActions(item, context);
  
  if (actions.length === 0) {
    return null;
  }

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleActionClick = (action: any) => {
    action.onClick();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="compact-overflow-trigger"
        style={{
          padding: 'var(--space-2, 8px)',
          borderRadius: 'var(--radius, 12px)',
          fontSize: 'var(--font-sm, 13px)',
          backgroundColor: 'var(--muted, #f5f5f5)',
          color: 'var(--text, #000000)',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          marginTop: 'var(--space-2, 8px)',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-1, 4px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--muted-hover, #e5e5e5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--muted, #f5f5f5)';
        }}
      >
        More
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="compact-overflow-menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg, #ffffff)',
            border: '1px solid var(--line, #e0e0e0)',
            borderRadius: 'var(--radius, 12px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            marginTop: 'var(--space-1, 4px)',
            overflow: 'hidden'
          }}
        >
          {actions.map((action, index) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              role="menuitem"
              style={{
                width: '100%',
                padding: 'var(--space-3, 12px)',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text, #000000)',
                fontSize: 'var(--font-sm, 13px)',
                textAlign: 'left',
                cursor: 'pointer',
                borderBottom: index < actions.length - 1 ? '1px solid var(--line, #e0e0e0)' : 'none',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted, #f5f5f5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

