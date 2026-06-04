import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CONFIRM_REMOVE_SHOW_MESSAGE,
  confirmRemoveShow,
  removeShowWithConfirmation,
} from '../confirmRemoveShow';
import { Library } from '../storage';
import * as readOnlyGuard from '../readOnlyGuard';

describe('confirmRemoveShow', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm');
    vi.spyOn(Library, 'remove');
    vi.spyOn(readOnlyGuard, 'isMutationBlocked').mockReturnValue(false);
    vi.spyOn(readOnlyGuard, 'guardMutation');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses the agreed plain-language confirm copy', () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    confirmRemoveShow();
    expect(window.confirm).toHaveBeenCalledWith(CONFIRM_REMOVE_SHOW_MESSAGE);
  });

  it('does not remove when the user cancels', () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    removeShowWithConfirmation(1, 'tv');
    expect(Library.remove).not.toHaveBeenCalled();
  });

  it('removes when the user confirms', () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    removeShowWithConfirmation(42, 'movie');
    expect(Library.remove).toHaveBeenCalledWith(42, 'movie');
  });

  it('blocks read-only users before showing confirm', () => {
    vi.mocked(readOnlyGuard.isMutationBlocked).mockReturnValue(true);
    removeShowWithConfirmation(1, 'tv');
    expect(window.confirm).not.toHaveBeenCalled();
    expect(readOnlyGuard.guardMutation).toHaveBeenCalled();
    expect(Library.remove).not.toHaveBeenCalled();
  });
});
