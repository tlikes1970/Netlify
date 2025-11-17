/**
 * Process: DragHandle Accessibility Tests
 * Purpose: Verify keyboard navigation and screen reader support for drag handles
 * Data Source: Component props and ARIA attributes
 * Update Path: Tests verify expected accessibility behavior
 * Dependencies: @testing-library/react, @testing-library/jest-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DragHandle } from '../DragHandle';

describe('DragHandle Accessibility', () => {
  it('should be focusable with Tab key', () => {
    const { container } = render(
      <DragHandle
        itemId="test-1"
        index={0}
        onDragStart={vi.fn()}
      />
    );

    const handle = container.querySelector('.drag-handle');
    expect(handle).toHaveAttribute('tabIndex', '0');
  });

  it('should have aria-grabbed attribute', () => {
    const { container, rerender } = render(
      <DragHandle
        itemId="test-1"
        index={0}
        isDragging={false}
      />
    );

    let handle = container.querySelector('.drag-handle');
    expect(handle).toHaveAttribute('aria-grabbed', 'false');

    rerender(
      <DragHandle
        itemId="test-1"
        index={0}
        isDragging={true}
      />
    );

    handle = container.querySelector('.drag-handle');
    expect(handle).toHaveAttribute('aria-grabbed', 'true');
  });

  it('should have proper aria-label', () => {
    const { container } = render(
      <DragHandle
        itemId="test-1"
        index={0}
        itemTitle="Test Movie"
      />
    );

    const handle = container.querySelector('.drag-handle');
    expect(handle).toHaveAttribute('aria-label');
    expect(handle?.getAttribute('aria-label')).toContain('Test Movie');
    expect(handle?.getAttribute('aria-label')).toContain('Arrow Up or Down');
  });

  it('should have role="button"', () => {
    const { container } = render(
      <DragHandle
        itemId="test-1"
        index={0}
      />
    );

    const handle = container.querySelector('.drag-handle');
    expect(handle).toHaveAttribute('role', 'button');
  });

  it('should call onKeyboardReorder on ArrowUp keypress', async () => {
    const user = userEvent.setup();
    const onKeyboardReorder = vi.fn();

    const { container } = render(
      <DragHandle
        itemId="test-1"
        index={0}
        onKeyboardReorder={onKeyboardReorder}
      />
    );

    const handle = container.querySelector('.drag-handle') as HTMLElement;
    handle.focus();

    await user.keyboard('{ArrowUp}');
    expect(onKeyboardReorder).toHaveBeenCalledWith('up');
  });

  it('should call onKeyboardReorder on ArrowDown keypress', async () => {
    const user = userEvent.setup();
    const onKeyboardReorder = vi.fn();

    const { container } = render(
      <DragHandle
        itemId="test-1"
        index={0}
        onKeyboardReorder={onKeyboardReorder}
      />
    );

    const handle = container.querySelector('.drag-handle') as HTMLElement;
    handle.focus();

    await user.keyboard('{ArrowDown}');
    expect(onKeyboardReorder).toHaveBeenCalledWith('down');
  });

  it('should prevent default behavior on Arrow keys', async () => {
    const user = userEvent.setup();
    const onKeyboardReorder = vi.fn();
    const preventDefault = vi.fn();

    const { container } = render(
      <DragHandle
        itemId="test-1"
        index={0}
        onKeyboardReorder={onKeyboardReorder}
      />
    );

    const handle = container.querySelector('.drag-handle') as HTMLElement;
    handle.focus();

    // Simulate keydown event
    const keyDownEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(keyDownEvent, 'preventDefault', {
      value: preventDefault,
    });

    handle.dispatchEvent(keyDownEvent);

    // The handler should prevent default
    expect(preventDefault).toHaveBeenCalled();
  });
});


















