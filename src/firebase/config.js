// src/firebase/config.js
// ─────────────────────────────────────────────────────────
// Firebase JS SDK v12 + React Native (Expo)
// Using inMemoryPersistence (no native module needed).
// Session stays alive as long as the app is open.
// ─────────────────────────────────────────────────────────
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const GOOGLE_WEB_CLIENT_ID = '819910526914-aq01r08v5e6ierkq7p0qhii07lqeiqo3.apps.googleusercontent.com';

const firebaseConfig = {
  apiKey: 'AIzaSyC-xVAZ9DQZ-5NJwn0-5lKSV3GpQL7AScc',
  authDomain: 'bwstory-clone-16517.firebaseapp.com',
  projectId: 'bwstory-clone-16517',
  storageBucket: 'bwstory-clone-16517.firebasestorage.app',
  messagingSenderId: '819910526914',
  appId: '1:819910526914:android:32b15a7f26a4e5e082f85b',
  webClientId: GOOGLE_WEB_CLIENT_ID,
};

// Initialize Firebase only once (hot-reload safe)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth with inMemoryPersistence (works without native modules)
// Use getAuth fallback if already initialized (prevents crash on standalone boot)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: inMemoryPersistence,
  });
} catch (e) {
  // auth/already-initialized — safe to reuse the existing instance
  auth = getAuth(app);
}
export { auth };

export const db = getFirestore(app);

export default app;
