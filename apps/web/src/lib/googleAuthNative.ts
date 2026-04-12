/**
 * Native Google Sign-In for Capacitor (Android/iOS).
 * Avoids signInWithPopup / external Chrome — Firebase "missing initial state" happens when OAuth
 * runs in a partitioned browser vs the WebView's IndexedDB.
 *
 * Requires VITE_GOOGLE_WEB_CLIENT_ID = Web application OAuth 2.0 Client ID from Google Cloud Console
 * (APIs & Services → Credentials → OAuth 2.0 Client IDs → Web client). Same GCP project as Firebase.
 */

import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
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

  await GoogleAuth.initialize({
    scopes: ['profile', 'email', 'openid'],
    grantOfflineAccess: false,
    clientId: webClientId,
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

  logger.log('[googleAuthNative] Starting GoogleAuth.signIn()');
  const googleUser = await GoogleAuth.signIn();
  const idToken = googleUser.authentication?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an ID token');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
  logger.log('[googleAuthNative] Firebase signInWithCredential complete');
}
