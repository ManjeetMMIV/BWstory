// src/firebase/firestoreService.js
// Firestore CRUD helpers for posts, comments, users, notifications

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import { DISCOVER_POSTS } from '../data/mockData';

// Shared live in-memory feed store (syncs with Firestore & local post creation)
let inMemoryFeed = [...DISCOVER_POSTS];
const feedListeners = new Set();

function notifyFeedListeners() {
  const feedCopy = [...inMemoryFeed];
  feedListeners.forEach(cb => {
    try {
      cb(feedCopy);
    } catch (e) {}
  });
}

/** Get snapshot of current feed */
export function getFeedPosts() {
  return [...inMemoryFeed];
}

// ─────────────────────────────────────────────────────────────
//  USER PROFILE
// ─────────────────────────────────────────────────────────────

/** Fetch a user's profile document */
export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.log('[Firestore] getUserProfile error:', err.message);
    return null;
  }
}

/** Update a user's profile fields */
export async function updateUserProfile(uid, data) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.log('[Firestore] updateUserProfile error:', err.message);
    throw err;
  }
}

/** Follow / unfollow another user */
export async function toggleFollow(currentUid, targetUid) {
  const currentRef = doc(db, 'users', currentUid);
  const targetRef = doc(db, 'users', targetUid);
  const currentSnap = await getDoc(currentRef);
  const following = currentSnap.data()?.followingList || [];
  const isFollowing = following.includes(targetUid);

  if (isFollowing) {
    await updateDoc(currentRef, {
      followingList: arrayRemove(targetUid),
      following: increment(-1),
    });
    await updateDoc(targetRef, {
      followerList: arrayRemove(currentUid),
      followers: increment(-1),
    });
  } else {
    await updateDoc(currentRef, {
      followingList: arrayUnion(targetUid),
      following: increment(1),
    });
    await updateDoc(targetRef, {
      followerList: arrayUnion(currentUid),
      followers: increment(1),
    });
    // Create a notification
    await addNotification(targetUid, {
      type: 'follow',
      fromUid: currentUid,
      fromName: currentSnap.data()?.name || 'Someone',
      fromAvatar: currentSnap.data()?.avatarUrl || '',
    });
  }
  return !isFollowing;
}

// ─────────────────────────────────────────────────────────────
//  POSTS
// ─────────────────────────────────────────────────────────────

/** Create a new post */
export async function createPost({ uid, userName, userAvatar, imageUrl, videoUrl, isVideo, caption }) {
  const newPostId = 'post_' + Date.now();
  const localPost = {
    id: newPostId,
    uid: uid || 'user_demo',
    userName: userName || 'You',
    userAvatar: userAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80',
    imageUrl: imageUrl || '',
    videoUrl: videoUrl || '',
    isVideo: !!isVideo,
    caption: caption || '',
    likes: [],
    commentCount: 0,
    timeAgo: 'Just now',
    createdAt: { seconds: Math.floor(Date.now() / 1000) },
    initialComments: [],
  };

  // 1. Immediately prepend to in-memory feed so feed updates with zero lag!
  inMemoryFeed = [localPost, ...inMemoryFeed];
  notifyFeedListeners();

  // 2. Background sync with Firestore
  try {
    const ref = await addDoc(collection(db, 'posts'), {
      uid: localPost.uid,
      userName: localPost.userName,
      userAvatar: localPost.userAvatar,
      imageUrl: localPost.imageUrl,
      videoUrl: localPost.videoUrl,
      isVideo: localPost.isVideo,
      caption: localPost.caption,
      likes: [],
      commentCount: 0,
      createdAt: serverTimestamp(),
    });
    localPost.id = ref.id;
    if (uid && uid !== 'user_demo' && uid !== 'demo_user_123') {
      updateDoc(doc(db, 'users', uid), { posts: increment(1) }).catch(() => {});
    }
  } catch (err) {
    console.log('[Firestore] createPost sync notice:', err.message);
  }

  return localPost.id;
}

/** Fetch paginated posts for discover feed (real-time with live in-memory fallback) */
export function subscribeToFeed(callback, pageLimit = 15) {
  // Always immediately deliver the current feed state
  callback([...inMemoryFeed]);
  feedListeners.add(callback);

  let unsubFirestore = () => {};
  try {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(pageLimit)
    );
    unsubFirestore = onSnapshot(
      q,
      snap => {
        if (!snap.empty) {
          const firestorePosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // Merge Firestore posts with local mock/created posts
          const ids = new Set(firestorePosts.map(p => p.id));
          const localOnly = inMemoryFeed.filter(p => !ids.has(p.id));
          inMemoryFeed = [...firestorePosts, ...localOnly];
          notifyFeedListeners();
        }
      },
      error => {
        console.log('[Firestore] Feed fallback activated:', error.message);
        callback([...inMemoryFeed]);
      }
    );
  } catch (err) {
    console.log('[Firestore] Feed init fallback:', err.message);
    callback([...inMemoryFeed]);
  }

  return () => {
    feedListeners.delete(callback);
    try {
      unsubFirestore();
    } catch (e) {}
  };
}

/** Fetch next page of posts (pagination) */
export async function fetchMorePosts(lastDoc, pageLimit = 10) {
  try {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      startAfter(lastDoc),
      limit(pageLimit)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

/** Like / unlike a post */
export async function toggleLike(postId, uid) {
  if (!uid) return;
  // Update in-memory feed
  const post = inMemoryFeed.find(p => p.id === postId);
  if (post) {
    const likesArr = Array.isArray(post.likes) ? [...post.likes] : [];
    if (likesArr.includes(uid)) {
      post.likes = likesArr.filter(id => id !== uid);
    } else {
      post.likes = [...likesArr, uid];
    }
  }

  try {
    const ref = doc(db, 'posts', postId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const likes = snap.data()?.likes || [];
      const liked = likes.includes(uid);
      await updateDoc(ref, {
        likes: liked ? arrayRemove(uid) : arrayUnion(uid),
      });
      return !liked;
    }
  } catch (e) {}
}

/** Delete a post */
export async function deletePost(postId, uid) {
  await deleteDoc(doc(db, 'posts', postId));
  await updateDoc(doc(db, 'users', uid), { posts: increment(-1) });
}

// ─────────────────────────────────────────────────────────────
//  COMMENTS
// ─────────────────────────────────────────────────────────────

/** Add a comment to a post */
export async function addComment(postId, { uid, userName, userAvatar, text }) {
  await addDoc(collection(db, 'posts', postId, 'comments'), {
    uid,
    userName,
    userAvatar,
    text,
    likes: [],
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', postId), {
    commentCount: increment(1),
  });
}

/** Listen to comments on a post (real-time) */
export function subscribeToComments(postId, callback) {
  try {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(
      q,
      snap => {
        const comments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(comments);
      },
      error => {
        console.log('[Firestore] Comments fallback activated:', error.message);
        callback([]);
      }
    );
  } catch (err) {
    console.log('[Firestore] Comments init fallback:', err.message);
    callback([]);
    return () => {};
  }
}

/** Toggle like on a comment */
export async function toggleCommentLike(postId, commentId, uid) {
  try {
    if (!postId || !commentId) return;
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const snap = await getDoc(commentRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const currentLikes = data.likes || [];
    if (Array.isArray(currentLikes)) {
      if (uid && currentLikes.includes(uid)) {
        await updateDoc(commentRef, {
          likes: arrayRemove(uid),
        });
      } else if (uid) {
        await updateDoc(commentRef, {
          likes: arrayUnion(uid),
        });
      }
    } else {
      await updateDoc(commentRef, {
        likes: increment(1),
      });
    }
  } catch (err) {
    console.log('[Firestore] toggleCommentLike error:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
//  NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

/** Create a notification */
export async function addNotification(toUid, data) {
  await addDoc(collection(db, 'users', toUid, 'notifications'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
}

/** Subscribe to notifications for a user */
export function subscribeToNotifications(uid, callback) {
  try {
    const q = query(
      collection(db, 'users', uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(
      q,
      snap => {
        const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(notifs);
      },
      error => {
        console.log('[Firestore] Notifications fallback activated:', error.message);
        callback([]);
      }
    );
  } catch (err) {
    console.log('[Firestore] Notifications init fallback:', err.message);
    callback([]);
    return () => {};
  }
}

/** Mark all notifications as read */
export async function markNotificationsRead(uid) {
  const q = query(
    collection(db, 'users', uid, 'notifications'),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => updateDoc(d.ref, { read: true }));
  await Promise.all(promises);
}
