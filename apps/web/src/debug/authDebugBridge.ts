/**
 * Process: Auth Debug Bridge
 * Purpose: Expose Firebase app, auth, and db to window for debugging (debug mode only)
 * Data Source: Firebase app instance from firebaseApp
 * Update Path: Called once when debug page loads
 * Dependencies: firebaseApp, authDebug
 */

import { getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { isAuthDebug } from '@/lib/authDebug';

function mask(s: string | null | undefined): string {
  if (!s) return s || '';
  const str = String(s);
  if (str.length <= 6) return '***';
  return str.slice(0, 3) + '...' + str.slice(-3);
}

export function installAuthDebugBridge() {
  if (!isAuthDebug()) return;

  const app = getApps().length ? getApp() : null;
  if (!app) {
    console.warn('[Bridge] No default Firebase app in bundle.');
    return;
  }

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Expose SAFE handles
  (window as any).__fb = { app, auth, db };

  (window as any).__probeAuth = async () => {
    const userNow = auth.currentUser
      ? { uid: auth.currentUser.uid, email: mask(auth.currentUser.email) }
      : null;
    const userLater = await new Promise((r) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (u) => {
          unsubscribe();
          r(u ? { uid: u.uid, email: mask(u.email) } : null);
        }
      );
    });
    const cfg = app.options || {};
    const info = {
      appName: app.name,
      projectId: cfg.projectId,
      authDomain: cfg.authDomain,
      origin: location.origin,
      userNow,
      userLater,
    };
    console.log('[Bridge] __probeAuth ->', info);
    return info;
  };

  (window as any).__probeUsername = async (uid?: string) => {
    try {
      const u = uid || auth.currentUser?.uid;
      if (!u) return { error: 'NO_USER' };

      const profileRef = doc(db, 'users', u);
      const snap = await getDoc(profileRef);
      const username = snap.exists() ? snap.get('username') : null;
      console.log('[Bridge] __probeUsername ->', { uid: u, exists: snap.exists(), username });
      return { uid: u, exists: snap.exists(), username };
    } catch (e: any) {
      console.warn('[Bridge] __probeUsername error', e.code, e.message);
      return { error: e.code || e.message };
    }
  };

  (window as any).__probeWrite = async () => {
    try {
      const ref = doc(db, 'diagnostics', 'writeProbe');
      await setDoc(ref, { t: serverTimestamp(), ua: navigator.userAgent }, { merge: true });
      console.log('[Bridge] __probeWrite -> ok');
      return { ok: true };
    } catch (e: any) {
      console.warn('[Bridge] __probeWrite error', e.code, e.message);
      return { ok: false, error: e.code || e.message };
    }
  };

  console.log('[Bridge] Auth debug bridge installed. Use __probeAuth(), __probeUsername(), __probeWrite().');
}

export default installAuthDebugBridge;

