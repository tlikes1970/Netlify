import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  REMOVE_SHOW_CONFIRM,
  confirmRemoveShow,
  removeShowWithConfirmation,
} from '../confirmRemoveShow';
import { Library } from '../storage';
import * as readOnlyGuard from '../readOnlyGuard';
import * as confirmBridge from '@/state/confirm';

describe('confirmRemoveShow', () => {
  beforeEach(() => {
    vi.spyOn(confirmBridge, 'confirmAction');
    vi.spyOn(Library, 'remove');
    vi.spyOn(readOnlyGuard, 'isMutationBlocked').mockReturnValue(false);
    vi.spyOn(readOnlyGuard, 'guardMutation');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the agreed remove-show copy via confirmAction', async () => {
    vi.mocked(confirmBridge.confirmAction).mockResolvedValue(false);
    await confirmRemoveShow();
    expect(confirmBridge.confirmAction).toHaveBeenCalledWith({
      ...REMOVE_SHOW_CONFIRM,
      destructive: true,
    });
  });

  it('does not remove when the user cancels', async () => {
    vi.mocked(confirmBridge.confirmAction).mockResolvedValue(false);
    removeShowWithConfirmation(1, 'tv');
    await vi.waitFor(() => {
      expect(confirmBridge.confirmAction).toHaveBeenCalled();
    });
    expect(Library.remove).not.toHaveBeenCalled();
  });

  it('removes when the user confirms', async () => {
    vi.mocked(confirmBridge.confirmAction).mockResolvedValue(true);
    removeShowWithConfirmation(42, 'movie');
    await vi.waitFor(() => {
      expect(Library.remove).toHaveBeenCalledWith(42, 'movie');
    });
  });

  it('blocks read-only users before showing confirm', () => {
    vi.mocked(readOnlyGuard.isMutationBlocked).mockReturnValue(true);
    removeShowWithConfirmation(1, 'tv');
    expect(confirmBridge.confirmAction).not.toHaveBeenCalled();
    expect(readOnlyGuard.guardMutation).toHaveBeenCalled();
    expect(Library.remove).not.toHaveBeenCalled();
  });
});
