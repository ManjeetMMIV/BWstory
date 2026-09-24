// src/context/AuthContext.js
// Global auth state via React Context — wraps the whole app

import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuth, logout } from '../firebase/authService';
import { getUserProfile } from '../firebase/firestoreService';
import { CURRENT_USER } from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = subscribeToAuth(async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const profile = await getUserProfile(fbUser.uid);
        setUserProfile(
          profile
            ? {
                ...profile,
                avatar: profile.avatarUrl || profile.avatar,
                avatarUrl: profile.avatarUrl || profile.avatar,
              }
            : {
                name: fbUser.displayName || CURRENT_USER.name,
                email: fbUser.email,
                gender: CURRENT_USER.gender,
                location: CURRENT_USER.location,
                profession: CURRENT_USER.profession,
                bio: CURRENT_USER.bio,
                avatar: fbUser.photoURL || CURRENT_USER.avatar,
                avatarUrl: fbUser.photoURL || CURRENT_USER.avatar,
                followers: CURRENT_USER.followers,
                following: CURRENT_USER.following,
                posts: CURRENT_USER.posts,
              }
        );
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginAsDemo = () => {
    setFirebaseUser({
      uid: 'demo_user_123',
      email: 'rashmi@bwstory.com',
      displayName: 'Rashmi Desai',
      isDemo: true,
    });
    setUserProfile({
      ...CURRENT_USER,
      id: 'demo_user_123',
      avatarUrl: CURRENT_USER.avatar,
      avatar: CURRENT_USER.avatar,
    });
  };

  const logoutUser = async () => {
    try {
      await logout();
    } catch (e) {
      // ignore
    }
    setFirebaseUser(null);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      if (firebaseUser.isDemo) return;
      const profile = await getUserProfile(firebaseUser.uid);
      if (profile) setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        setUserProfile,
        loading,
        loginAsDemo,
        logoutUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
