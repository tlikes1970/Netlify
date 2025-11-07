/**
 * Process: Username Flow
 * Purpose: Hardened username claim flow with timeout, error handling, and auth readiness check
 * Data Source: Firebase Auth, Firestore (users/{uid}, usernames/{handle})
 * Update Path: Called when user needs to claim a username
 * Dependencies: authFlow (authReady), firebase/auth, firebase/firestore, authDebug
 */

import { authReady } from '@/lib/authFlow';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { isAuthDebug, logAuth } from '@/lib/authDebug';
import { auth, db } from '@/lib/firebaseBootstrap';

const USERNAME_TIMEOUT_MS = 12000;

export async function ensureUsernameChosen(
  getCandidate: () => Promise<string | null>
): Promise<{ status: 'has' | 'claimed'; username: string }> {
  await authReady;
  const user = await new Promise<any>((r) => {
    if (auth.currentUser) return r(auth.currentUser);
    const un = onAuthStateChanged(
      auth,
      (u) => {
        un();
        r(u);
      }
    );
  });
  if (!user)
    throw Object.assign(new Error('AUTH_NOT_SIGNED_IN'), { code: 'AUTH_NOT_SIGNED_IN' });

  const profileRef = doc(db, 'users', user.uid);

  // Fast path: already has username
  const prof = await getDoc(profileRef);
  const existing = prof.exists() ? (prof.data().settings?.username || null) : null;
  if (existing) {
    if (isAuthDebug()) {
      logAuth('username_has_existing', { username: existing });
    }
    return { status: 'has', username: existing };
  }

  // Timeout wrapper so UI never spins forever
  const core: Promise<{ status: 'has' | 'claimed'; username: string }> = (async () => {
    const candidate = await getCandidate();
    if (!candidate)
      throw Object.assign(new Error('NO_CANDIDATE'), { code: 'NO_CANDIDATE' });

    const handleRef = doc(db, 'usernames', candidate.toLowerCase());
    await runTransaction(db, async (tx) => {
      const h = await tx.get(handleRef);
      if (h.exists())
        throw Object.assign(new Error('USERNAME_TAKEN'), { code: 'USERNAME_TAKEN' });
      tx.set(handleRef, { uid: user.uid, createdAt: new Date().toISOString() });
      // Update settings.username to match existing structure
      const profSnap = await tx.get(profileRef);
      const currentData = profSnap.exists() ? profSnap.data() : {};
      const currentSettings = currentData.settings || {};
      tx.set(profileRef, {
        ...currentData,
        settings: {
          ...currentSettings,
          username: candidate,
          usernamePrompted: true,
        },
      }, { merge: true });
    });

    if (isAuthDebug()) {
      logAuth('username_claimed', { username: candidate });
    }
    return { status: 'claimed' as const, username: candidate };
  })();

  const result = await Promise.race([
    core,
    new Promise<{ status: 'has' | 'claimed'; username: string }>((_, rej) =>
      setTimeout(
        () =>
          rej(
            Object.assign(new Error('USERNAME_TIMEOUT'), {
              code: 'USERNAME_TIMEOUT',
            })
          ),
        USERNAME_TIMEOUT_MS
      )
    ),
  ]);
  return result;
}

