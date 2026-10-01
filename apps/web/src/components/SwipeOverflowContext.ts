import { createContext } from 'react';

// A card-local channel for its nested overflow menu, including its portal.
export const SwipeOverflowContext = createContext<((open: boolean) => void) | null>(null);
