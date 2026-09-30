// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ScrollToTopArrow, { getScrollElement } from '../ScrollToTopArrow';

vi.mock('../MobileTabs', () => ({ useViewportOffset: () => ({ viewportOffset: 75 }) }));

let height = 800;
let contentHeight = 3000;
let observerCallback: ResizeObserverCallback;
const disconnect = vi.fn();
const observe = vi.fn();
const scrollTo = vi.fn();
let removeScroll: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  height = 800;
  contentHeight = 3000;
  document.body.style.overflowY = 'auto';
  document.documentElement.style.overflowY = 'hidden';
  document.body.scrollTop = 0;
  Object.defineProperties(document.body, {
    clientHeight: { configurable: true, get: () => height },
    scrollHeight: { configurable: true, get: () => contentHeight },
    scrollTo: { configurable: true, value: scrollTo },
  });
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: ResizeObserverCallback) { observerCallback = callback; }
    observe = observe;
    disconnect = disconnect;
  });
  removeScroll = vi.spyOn(document.body, 'removeEventListener');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.body.style.overflowY = '';
  document.documentElement.style.overflowY = '';
});

function move(top: number) {
  document.body.scrollTop = top;
  fireEvent.scroll(document.body);
}
function resizeContent() {
  act(() => observerCallback([], {} as ResizeObserver));
}

describe('scroll navigation', () => {
  it('renders one DOWN button at top with matching icon, action and native clearance', () => {
    render(<ScrollToTopArrow />);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    const button = screen.getByRole('button', { name: 'Scroll to bottom' });
    expect(button.querySelector('path')).toHaveAttribute('d', 'M19 14l-7 7m0 0l-7-7m7 7V3');
    expect(button.style.bottom).toBe('calc(var(--mobile-nav-height, 56px) + 25px + 80px)');
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenCalledWith({ top: 2200, behavior: 'smooth' });
  });

  it('switches at equality and above, keeps the same button, and returns to top', () => {
    render(<ScrollToTopArrow />);
    const button = screen.getByRole('button');
    move(799);
    expect(button).toHaveAccessibleName('Scroll to bottom');
    move(800);
    expect(screen.getByRole('button', { name: 'Scroll to top' })).toBe(button);
    expect(button.querySelector('path')).toHaveAttribute('d', 'M5 10l7-7m0 0l7 7m-7-7v18');
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    move(2200);
    expect(button).toHaveAccessibleName('Scroll to top');
    move(0);
    expect(button).toHaveAccessibleName('Scroll to bottom');
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('caps the threshold for short pages', () => {
    contentHeight = 1000;
    render(<ScrollToTopArrow />);
    move(99);
    expect(screen.getByRole('button')).toHaveAccessibleName('Scroll to bottom');
    move(100);
    expect(screen.getByRole('button')).toHaveAccessibleName('Scroll to top');
  });

  it.each([800, 801, 600])('hides on non-scrollable or negligible overflow (%s)', size => {
    contentHeight = size;
    render(<ScrollToTopArrow />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('recalculates on viewport resize', () => {
    render(<ScrollToTopArrow />);
    move(700);
    height = 600;
    fireEvent(window, new Event('resize'));
    expect(screen.getByRole('button')).toHaveAccessibleName('Scroll to top');
  });

  it('responds to growth and shrinkage while the owner viewport stays fixed', () => {
    contentHeight = 800;
    render(<ScrollToTopArrow />);
    expect(screen.queryByRole('button')).toBeNull();
    contentHeight = 3000;
    resizeContent();
    expect(screen.getByRole('button')).toHaveAccessibleName('Scroll to bottom');
    contentHeight = 800;
    resizeContent();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('preserves explicit threshold overrides', () => {
    render(<ScrollToTopArrow threshold={200} />);
    move(200);
    expect(screen.getByRole('button')).toHaveAccessibleName('Scroll to top');
  });

  it('resolves CSS body scrolling and document scrolling consistently', () => {
    expect(getScrollElement()).toBe(document.body);
    document.body.style.overflowY = 'visible';
    expect(getScrollElement()).toBe(document.scrollingElement || document.documentElement);
  });

  it('uses the document viewport on Android despite body overflow auto', () => {
    document.documentElement.style.overflowY = 'visible';
    const owner = document.scrollingElement || document.documentElement;
    Object.defineProperties(owner, {
      clientHeight: { configurable: true, value: 800 },
      scrollHeight: { configurable: true, value: 3000 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    owner.scrollTop = 0;
    render(<ScrollToTopArrow />);
    expect(getScrollElement()).toBe(owner);
    const button = screen.getByRole('button', { name: 'Scroll to bottom' });
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenCalledWith({ top: 2200, behavior: 'smooth' });
    owner.scrollTop = 800;
    fireEvent.scroll(owner);
    expect(document.body.scrollTop).toBe(0);
    expect(button).toHaveAccessibleName('Scroll to top');
    owner.scrollTop = 2200;
    fireEvent.scroll(window);
    expect(button).toHaveAccessibleName('Scroll to top');
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('uses the desktop owner, 1.25 viewport threshold and placement', () => {
    vi.stubGlobal('innerWidth', 1400);
    const owner = document.scrollingElement || document.documentElement;
    Object.defineProperties(owner, {
      clientHeight: { configurable: true, value: 800 },
      scrollHeight: { configurable: true, value: 3000 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    owner.scrollTop = 999;
    render(<ScrollToTopArrow />);
    const button = screen.getByRole('button');
    expect(button).toHaveAccessibleName('Scroll to bottom');
    owner.scrollTop = 1000;
    fireEvent.scroll(owner);
    expect(button).toHaveAccessibleName('Scroll to top');
    expect(button).toHaveClass('lg:bottom-24', 'lg:right-8');
    expect(button.style.bottom).toBe('');
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('rebinds the owner on a layout breakpoint change and uses it for actions', () => {
    render(<ScrollToTopArrow />);
    const owner = document.scrollingElement || document.documentElement;
    Object.defineProperties(owner, {
      clientHeight: { configurable: true, value: 800 },
      scrollHeight: { configurable: true, value: 3000 },
      scrollTo: { configurable: true, value: scrollTo },
    });
    owner.scrollTop = 1000;
    vi.stubGlobal('innerWidth', 1400);
    fireEvent(window, new Event('resize'));
    expect(removeScroll).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(screen.getByRole('button')).toHaveAccessibleName('Scroll to top');
    fireEvent.click(screen.getByRole('button'));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('cleans up owner/window listeners and the size observer', () => {
    const windowRemove = vi.spyOn(window, 'removeEventListener');
    const main = document.createElement('main');
    main.className = 'flicklet-app-main';
    document.body.append(main);
    const { unmount } = render(<ScrollToTopArrow />);
    expect(observe).toHaveBeenCalledWith(document.body);
    expect(observe).toHaveBeenCalledWith(main);
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(removeScroll).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(windowRemove).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(windowRemove).toHaveBeenCalledWith('scroll', expect.any(Function));
    main.remove();
  });
});
