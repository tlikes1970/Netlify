import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Tabs from '@/components/Tabs';
import MobileTabs from '@/components/MobileTabs';

vi.mock('@/lib/language', async (importOriginal) => ({...await importOriginal<typeof import("@/lib/language")>(), useTranslations: () => ({ home: 'Home', discovery: 'Discovery' }) }));
vi.mock('@/lib/capacitorEnv', () => ({ isCapacitorNative: () => false, isCapacitorAndroid: () => false }));
vi.mock('@/lib/mobileViewportLayout', () => ({
  KEYBOARD_DISMISS_EVENT: 'keyboard-dismiss', KEYBOARD_OPEN_THRESHOLD: 50, useNavViewportLift: () => false,
}));

describe('primary navigation remains unchanged', () => {
  it('keeps mobile Home, Library, Discovery and Settings', () => {
    const onChange = vi.fn();
    const onSettingsClick = vi.fn();
    render(<MobileTabs current="library" onChange={onChange} onSettingsClick={onSettingsClick} />);
    expect(screen.getAllByRole('button').map(button => button.getAttribute('aria-label') || button.textContent?.trim()))
      .toEqual(['Home', 'Library', 'Discovery', 'Open Settings']);
    for (const label of ['Home', 'Library', 'Discovery']) fireEvent.click(screen.getByRole('button', { name: label }));
    expect(onChange.mock.calls.map(call => call[0])).toEqual(['home', 'library', 'discovery']);
    expect(screen.getByRole('button', { name: 'Open Settings' }).querySelector('svg')).toBeNull();
    expect(screen.getByRole('button', { name: 'Library' })).toHaveAttribute('aria-current','page');
    fireEvent.click(screen.getByRole('button', { name: 'Open Settings' }));
    expect(onSettingsClick).toHaveBeenCalledOnce();
  });

  it('keeps desktop Home, Library and Discovery', () => {
    const onChange = vi.fn();
    render(<Tabs current="library" onChange={onChange} />);
    expect(screen.getAllByRole('tab').map(tab => tab.textContent?.trim())).toEqual(['Home', 'Library', 'Discovery']);
    fireEvent.click(screen.getByRole('tab', { name: 'Library' }));
    expect(onChange).toHaveBeenCalledWith('library');
  });
});
