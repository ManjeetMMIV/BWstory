// src/firebase/authService.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// ── Create user document in Firestore on first sign-up ────
async function createUserDoc(uid, data) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      name: data.name || '',
      email: data.email || '',
      gender: '',
      location: '',
      profession: '',
      bio: '',
      avatarUrl: data.photoURL || '',
      followers: 0,
      following: 0,
      posts: 0,
      createdAt: serverTimestamp(),
    });
  }
}

// ── Register with email/password ───────────────────────────
export async function registerWithEmail(email, password, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await createUserDoc(cred.user.uid, { name, email });
  return cred.user;
}

// ── Login with email/password ──────────────────────────────
export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// ── Google Sign-In (requires expo-auth-session setup) ──────
export async function loginWithGoogle(idToken, accessToken) {
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  const cred = await signInWithCredential(auth, credential);
  await createUserDoc(cred.user.uid, {
    name: cred.user.displayName,
    email: cred.user.email,
    photoURL: cred.user.photoURL,
  });
  return cred.user;
}

// ── Logout ─────────────────────────────────────────────────
export async function logout() {
  await signOut(auth);
}

// ── Password reset ─────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Auth state listener ────────────────────────────────────
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, callback);
}
