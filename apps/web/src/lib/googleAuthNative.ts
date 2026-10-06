/**
 * Native Google Sign-In for Capacitor (Android/iOS).
 * Avoids signInWithPopup / external Chrome — Firebase "missing initial state" happens when OAuth
 * runs in a partitioned browser vs the WebView's IndexedDB.
 *
 * Requires VITE_GOOGLE_WEB_CLIENT_ID = Web application OAuth 2.0 Client ID from Google Cloud Console
 * (APIs & Services → Credentials → OAuth 2.0 Client IDs → Web client). Same GCP project as Firebase.
 */

import { GoogleAuthProvider, signInWithCredential, reauthenticateWithCredential, type User } from 'firebase/auth';
import {
  SocialLogin,
  type GoogleLoginResponseOnline,
} from '@capgo/capacitor-social-login';
import { auth } from './firebaseBootstrap';
import { isCapacitorNative } from './capacitorEnv';
import { logger } from './logger';

let initialized = false;

async function ensureGoogleAuthInitialized(): Promise<void> {
  if (initialized) return;

  // Web application OAuth client ID — used so the ID token matches what Firebase expects (same as Firebase console "Web client").
  const webClientId = (import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID ?? '').trim();
  if (!webClientId) {
    throw new Error(
      'Native Google sign-in: set VITE_GOOGLE_WEB_CLIENT_ID to your Web OAuth client ID (.apps.googleusercontent.com) from Google Cloud Console (same project as Firebase).'
    );
  }

  await SocialLogin.initialize({
    google: {
      webClientId,
      mode: 'online',
    },
  });
  initialized = true;
}

/**
 * Sign in with Google using the native SDK + Firebase signInWithCredential (no WebView/Chrome OAuth).
 */
export async function signInWithGoogleNative(): Promise<void> {
  if (!isCapacitorNative()) {
    throw new Error('signInWithGoogleNative is only for Capacitor Android/iOS');
  }

  await ensureGoogleAuthInitialized();

  logger.log('[googleAuthNative] Starting SocialLogin.login()');
  const response = await SocialLogin.login({
    provider: 'google',
    options: {
      scopes: ['profile', 'email', 'openid'],
    },
  });
  const googleResult = response.result as GoogleLoginResponseOnline;
  const idToken = googleResult.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an ID token');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
  logger.log('[googleAuthNative] Firebase signInWithCredential complete');
}

/** Reuse the native provider initialization without signing into a different Firebase account. */
export async function reauthenticateWithGoogleNative(user: User): Promise<void> {
  await ensureGoogleAuthInitialized();
  const response = await SocialLogin.login({provider:'google', options:{scopes:['profile','email','openid']}});
  const token = (response.result as GoogleLoginResponseOnline).idToken;
  if (!token) throw new Error('Google Sign-In did not return an ID token');
  await reauthenticateWithCredential(user, GoogleAuthProvider.credential(token));
}

/** Clear Flicklet's native provider session without deleting the device's Google account. */
export async function clearGoogleNativeSession(): Promise<void> {
  await ensureGoogleAuthInitialized();
  await SocialLogin.logout({provider:'google'});
}
