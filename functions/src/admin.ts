/**
 * Process: Firebase Admin Initialization
 * Purpose: Single source of truth for Firebase Admin app initialization
 * Data Source: Firebase Admin SDK
 * Update Path: N/A - initialized once at module load
 * Dependencies: firebase-admin/app, firebase-admin/firestore
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const app = initializeApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

