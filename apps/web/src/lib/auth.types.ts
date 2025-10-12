import type { User } from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface UserSettings {
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

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}
