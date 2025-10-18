import { ActionItem, ActionContext, getPrimaryAction } from './actionsMap';

interface CompactPrimaryActionProps {
  item: ActionItem;
  context: ActionContext;
}

export function CompactPrimaryAction({ item, context }: CompactPrimaryActionProps) {
  const gate = document.documentElement.dataset.compactMobileV1 === 'true';
  const flagEnabled = document.documentElement.dataset.actionsSplit === 'true';
  
  if (!gate || !flagEnabled) {
    return null;
  }

  const primaryAction = getPrimaryAction(item, context);
  
  if (!primaryAction) {
    return null;
  }

  return (
    <button
      onClick={primaryAction.onClick}
      className="compact-primary-action"
      style={{
        padding: 'var(--space-2, 8px)',
        borderRadius: 'var(--radius, 12px)',
        fontSize: 'var(--font-sm, 13px)',
        backgroundColor: 'var(--accent, #007AFF)',
        color: 'var(--bg, #ffffff)',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '500',
        width: '100%',
        marginTop: 'var(--space-2, 8px)',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--accent-hover, #0056CC)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--accent, #007AFF)';
      }}
    >
      {primaryAction.label}
    </button>
  );
}

