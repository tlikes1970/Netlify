// import type { User } from 'firebase/auth'; // Unused

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserSettings {
  /** Private, non-unique answer to “What should Flicklet call you?” */
  preferredName?: string;
  /** Legacy user-entered name; never a provider profile name. */
  displayName?: string;
  username?: string;
  usernamePrompted?: boolean;
  theme?: 'light' | 'dark';
  lang?: string;
}

export interface UserProfile {
  email: string;
  displayName: string;
  photoURL: string;
}

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  lastLoginAt: string;
  profile: UserProfile;
  settings: UserSettings;
  watchlists?: {
    tv: {
      watching: any[];
      wishlist: any[];
      watched: any[];
    };
    movies: {
      watching: any[];
      wishlist: any[];
      watched: any[];
    };
  };
}

export type AuthProvider = 'google' | 'apple' | 'email';

export type AuthStatus = 
  | 'idle'              // Initial state, not checked
  | 'checking'         // Checking existing session
  | 'authenticated'    // User is signed in
  | 'unauthenticated'  // User is signed out
  | 'redirecting'      // OAuth redirect in progress (DO NOT SHOW MODAL)
  | 'resolving';       // Processing redirect result (DO NOT SHOW MODAL)

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  status: AuthStatus;
}
