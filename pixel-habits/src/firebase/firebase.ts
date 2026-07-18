/**
 * Firebase Initialization Module
 *
 * Initializes Firebase app and exports Firestore database instance.
 * This module is imported by the store to get access to the `db` object
 * for all Firestore operations (collections, onSnapshot, addDoc, etc.).
 *
 * Environment Setup:
 * - .env.local must contain 6 VITE_FIREBASE_* variables
 * - See docs/FIREBASE.md for setup instructions
 * - If any variable is missing, Firebase initialization will fail silently
 *   (errors appear in browser console as "Cannot read property 'apiKey' of undefined")
 *
 * Usage:
 * ```typescript
 * import { db } from '@/firebase/firebase'
 * import { collection, onSnapshot } from 'firebase/firestore'
 *
 * onSnapshot(collection(db, 'habits'), (snap) => {
 *   // Handle snapshot
 * })
 * ```
 */

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

/** Firebase configuration from environment variables */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/** Initialize Firebase app with config from environment */
export const app = initializeApp(firebaseConfig)

/** Firestore database instance; used by all store operations */
export const db = getFirestore(app)
