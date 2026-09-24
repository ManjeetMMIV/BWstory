import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { DISCOVER_POSTS } from '../data/mockData';
import {
  subscribeToFeed,
  toggleLike,
  addComment,
  subscribeToComments,
  toggleFollow,
  toggleCommentLike,
  getFeedPosts,
} from '../firebase/firestoreService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── CommentItem (Interactive Likes & Replies) ─────────────
function CommentItem({ comment, idx, postId, currentUid, onReply }) {
  const initialLikes =
    typeof comment.likes === 'number'
      ? comment.likes
      : Array.isArray(comment.likes)
      ? comment.likes.length
      : (comment.likes !== undefined ? Number(comment.likes) : (idx === 0 ? 2 : 0));

  const initialLiked =
    Array.isArray(comment.likes) && currentUid
      ? comment.likes.includes(currentUid)
      : false;

  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const heartScale = useRef(new Animated.Value(1)).current;

  // Sync if Firestore / parent updates
  useEffect(() => {
    if (typeof comment.likes === 'number') {
      setLikeCount(comment.likes);
    } else if (Array.isArray(comment.likes)) {
      setLikeCount(comment.likes.length);
      if (currentUid) {
        setIsLiked(comment.likes.includes(currentUid));
      }
    }
  }, [comment.likes, currentUid]);

  const handleToggleLike = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.45, duration: 110, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount(prev => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (postId && comment.id) {
      toggleCommentLike(postId, comment.id, currentUid).catch(() => {});
    }
  };

  return (
    <View style={styles.commentRow}>
      <Image
        source={{
          uri:
            comment.userAvatar ||
            (idx === 0
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
              : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80'),
        }}
        style={styles.commentAvatar}
      />
      <View style={styles.commentBody}>
        <View style={styles.commentHeaderRow}>
          <Text style={styles.commentName}>{comment.userName || 'Priya chauhan'}</Text>
          <TouchableOpacity activeOpacity={0.7} style={styles.commentDotsBtn}>
            <Ionicons name="ellipsis-vertical" size={15} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
        <View style={styles.commentBottomIcons}>
          <TouchableOpacity
            style={styles.commentLikeBtn}
            activeOpacity={0.7}
            onPress={handleToggleLike}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={13}
                color={isLiked ? '#FF2A5F' : '#94A3B8'}
                style={{ marginRight: 4 }}
              />
            </Animated.View>
            <Text
              style={[
                styles.commentLikeCount,
                isLiked && { color: '#FF2A5F', fontWeight: '700' },
              ]}
            >
              {likeCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} onPress={onReply}>
            <Text style={styles.replyText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── PostCard ──────────────────────────────────────────────
function PostCard({ post, currentUid, currentUser }) {
  const liked = Array.isArray(post.likes) && post.likes.includes(currentUid);
  const [likeCount, setLikeCount] = useState(
    typeof post.likes === 'number' ? post.likes : (post.likes?.length || 4)
  );
  const [localLiked, setLocalLiked] = useState(liked);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [comments, setComments] = useState(post.initialComments || []);
  const [commentText, setCommentText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const commentInputRef = useRef(null);

  const handleReplyTo = (name) => {
    setCommentText(`@${name} `);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  // Listen to Firestore comments if available
  useEffect(() => {
    const unsub = subscribeToComments(post.id, (data) => {
      if (data && data.length > 0) {
        setComments(data);
      } else if (post.initialComments?.length) {
        setComments(post.initialComments);
      }
    });
    return unsub;
  }, [post.id]);

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.35, duration: 130, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();
    setLocalLiked(prev => !prev);
    setLikeCount(prev => (localLiked ? prev - 1 : prev + 1));
    toggleLike(post.id, currentUid).catch(() => {});
  };

  const handleFollow = () => {
    setIsFollowing(prev => !prev);
    toggleFollow(currentUid, post.uid).catch(() => {});
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || submitting) return;
    const text = commentText.trim();
    setSubmitting(true);
    const authorName = currentUser?.name || currentUser?.displayName || 'You';
    const authorAvatar =
      currentUser?.avatarUrl ||
      currentUser?.avatar ||
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80';
    const newComment = {
      id: 'c_' + Date.now(),
      userName: authorName,
      userAvatar: authorAvatar,
      text,
      likes: 0,
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
    };
    setComments(prev => [...prev, newComment]);
    setCommentText('');
    try {
      await addComment(post.id, {
        uid: currentUid,
        userName: authorName,
        userAvatar: authorAvatar,
        text,
      });
    } catch (e) {}
    setSubmitting(false);
  };

  return (
    <View style={styles.card}>
      {/* ── Post Author Header ── */}
      <View style={styles.cardHeader}>
        <Image
          source={{
            uri:
              (currentUid && (post.uid === currentUid || post.userName === currentUser?.name) && (currentUser?.avatarUrl || currentUser?.avatar))
                ? (currentUser?.avatarUrl || currentUser?.avatar)
                : (post.userAvatar ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80'),
          }}
          style={styles.avatar}
        />

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{post.userName || 'Amit saxena'}</Text>
            <Ionicons name="checkmark-circle" size={14} color="#0284C7" style={{ marginLeft: 4 }} />
          </View>
          <Text style={styles.metaText}>{post.timeAgo || 'Technology • 9m ago'}</Text>
        </View>

        <TouchableOpacity
          style={[styles.followBtn, isFollowing && styles.followingBtn]}
          onPress={handleFollow}
          activeOpacity={0.8}
        >
          {isFollowing ? (
            <View style={styles.btnRow}>
              <Ionicons name="checkmark" size={13} color={COLORS.primary} style={{ marginRight: 3 }} />
              <Text style={styles.followingBtnText}>Following</Text>
            </View>
          ) : (
            <Text style={styles.followBtnText}>Follow</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerMoreBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* ── Media Card with Centered Video Controls (Matching Reference) ── */}
      <View style={styles.mediaWrapper}>
        <Image
          source={{
            uri:
              post.imageUrl ||
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          }}
          style={styles.mediaImage}
          resizeMode="cover"
        />

        {/* Media top right dots */}
        <TouchableOpacity style={styles.mediaCornerBtn} activeOpacity={0.7}>
          <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" style={styles.dropShadow} />
        </TouchableOpacity>

        {/* Center Floating Video Controls (Transparent & Crisp White) */}
        {post.isVideo && (
          <View style={styles.videoOverlay}>
            <View style={styles.controlsRow}>
              {/* Rewind 10s */}
              <TouchableOpacity
                style={styles.ctrlIconBtn}
                onPress={() => {}}
                activeOpacity={0.75}
              >
                <Ionicons name="reload" size={28} color="#FFFFFF" style={[styles.dropShadow, { transform: [{ scaleX: -1 }] }]} />
              </TouchableOpacity>

              {/* Big Center Play / Pause */}
              <TouchableOpacity
                style={styles.mainPlayBtn}
                onPress={() => setIsPlaying(!isPlaying)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={36}
                  color="#FFFFFF"
                  style={[styles.dropShadow, !isPlaying && { marginLeft: 3 }]}
                />
              </TouchableOpacity>

              {/* Forward 10s */}
              <TouchableOpacity
                style={styles.ctrlIconBtn}
                onPress={() => {}}
                activeOpacity={0.75}
              >
                <Ionicons name="reload" size={28} color="#FFFFFF" style={styles.dropShadow} />
              </TouchableOpacity>
            </View>

            {/* Volume Speaker centered below */}
            <TouchableOpacity
              style={styles.volumeCenterBtn}
              onPress={() => {}}
              activeOpacity={0.75}
            >
              <Ionicons name="volume-high" size={22} color="#FFFFFF" style={styles.dropShadow} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Post Caption ── */}
      {post.caption ? (
        <Text style={styles.caption}>{post.caption}</Text>
      ) : null}

      {/* ── Action Buttons Row ── */}
      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.8}>
            <Ionicons
              name={localLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={localLiked ? '#FF2A5F' : '#475569'}
            />
            <Text style={[styles.actionCount, localLiked && styles.likedText]}>{likeCount}</Text>
          </TouchableOpacity>
        </Animated.View>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
          <Ionicons name="chatbubble-outline" size={20} color="#475569" />
          <Text style={styles.actionCount}>{comments.length || post.commentCount || 2}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8}>
          <Ionicons name="paper-plane-outline" size={20} color="#475569" />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => setIsBookmarked(b => !b)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={isBookmarked ? '#0284C7' : '#475569'}
          />
        </TouchableOpacity>
      </View>

      {/* ── Comments Section (Matching Reference Design) ── */}
      <View style={styles.commentsSection}>
        {/* Add comment input row */}
        <View style={styles.addCommentRow}>
          <Image
            source={{
              uri:
                currentUser?.avatarUrl ||
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80',
            }}
            style={styles.commentUserAvatar}
          />
          <View style={styles.commentInputContainer}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="#94A3B8"
              value={commentText}
              onChangeText={setCommentText}
            />
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={submitting}
              style={styles.sendIconBtn}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#0284C7" />
              ) : (
                <Ionicons
                  name="paper-plane"
                  size={17}
                  color={commentText.length > 0 ? '#0284C7' : '#94A3B8'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Existing Comments list */}
        {comments.map((c, idx) => (
          <CommentItem
            key={c.id || idx}
            comment={c}
            idx={idx}
            postId={post.id}
            currentUid={currentUid}
            onReply={() => handleReplyTo(c.userName || 'Priya chauhan')}
          />
        ))}
      </View>
    </View>
  );
}

// ── DiscoverScreen ────────────────────────────────────────
export default function DiscoverScreen() {
  const { firebaseUser, userProfile } = useAuth();
  const [posts, setPosts] = useState(getFeedPosts());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Subscribe to real-time feed updates
  useEffect(() => {
    const unsubscribe = subscribeToFeed((data) => {
      if (data && data.length > 0) {
        setPosts(data);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. Synchronize whenever tab comes into focus (e.g. after creating a story)
  useFocusEffect(
    useCallback(() => {
      const current = getFeedPosts();
      if (current && current.length > 0) {
        setPosts(current);
      }
    }, [])
  );

  // 3. Pull-to-refresh handler
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    const current = getFeedPosts();
    if (current && current.length > 0) {
      setPosts(current);
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const displayPosts = posts.length > 0 ? posts : DISCOVER_POSTS;

  const filtered = displayPosts.filter(p =>
    p.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.caption?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B24" />

      {/* ── Midnight Petroleum Gradient Top Header (Matching Reference) ── */}
      <LinearGradient
        colors={['#071B24', '#0C2B3A', '#133E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topBarGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.topBar}>
            {/* Hamburger Menu */}
            <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8}>
              <Ionicons name="menu" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Glowing Search Bar Capsule */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchIconBtn}>
                  <Ionicons name="close-circle" size={17} color="#94A3B8" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity activeOpacity={0.7} style={styles.searchIconBtn}>
                  <Ionicons name="search" size={17} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Sliders Button */}
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
              <Ionicons name="options-outline" size={23} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="images-outline" size={56} color="#94A3B8" />
          <Text style={styles.emptyText}>{searchQuery ? 'No matching posts found' : 'No posts yet'}</Text>
          <Text style={styles.emptySubText}>{searchQuery ? 'Try a different keyword' : 'Be the first to share something!'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              currentUid={firebaseUser?.uid}
              currentUser={userProfile || firebaseUser}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#0284C7']}
              tintColor="#0284C7"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Soft modern background
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },

  // Gradient Top Bar
  topBarGradient: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 8,
    shadowColor: '#081724',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    zIndex: 100,
  },
  safeHeader: {
    paddingBottom: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  menuBtn: {
    padding: 6,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    height: 40,
    paddingHorizontal: 16,
    marginRight: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
    height: 40,
  },
  searchIconBtn: {
    padding: 4,
  },
  filterBtn: {
    padding: 6,
  },

  // Premium Post Card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    paddingBottom: 14,
    elevation: 3,
    shadowColor: '#071B24',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#CBD5E1',
  },
  headerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  followBtn: {
    borderWidth: 1.2,
    borderColor: COLORS.primary,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 4.5,
    backgroundColor: '#FFFFFF',
  },
  followingBtn: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  followingBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  headerMoreBtn: {
    padding: 6,
    marginLeft: 4,
  },

  // Media Wrapper
  mediaWrapper: {
    marginHorizontal: 12,
    height: 245,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#071B24',
    position: 'relative',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaCornerBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 6,
  },

  // Centered Crisp Video Controls
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlIconBtn: {
    padding: 10,
    marginHorizontal: 16,
  },
  mainPlayBtn: {
    padding: 10,
    marginHorizontal: 12,
  },
  volumeCenterBtn: {
    padding: 6,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },

  // Caption
  caption: {
    fontSize: 14,
    color: '#1E293B',
    paddingHorizontal: 14,
    paddingTop: 10,
    lineHeight: 20,
    fontWeight: '400',
  },

  // Actions Bar
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionCount: {
    fontSize: 13,
    color: '#475569',
    marginLeft: 5,
    fontWeight: '600',
  },
  likedText: {
    color: '#FF2A5F',
  },

  // Comments
  commentsSection: {
    paddingHorizontal: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  commentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 38,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
  },
  sendIconBtn: {
    padding: 4,
    marginLeft: 4,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginTop: 2,
  },
  commentBody: {
    flex: 1,
  },
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  commentDotsBtn: {
    padding: 2,
  },
  commentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 2,
  },
  commentBottomIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
    paddingRight: 6,
  },
  commentLikeCount: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  replyText: {
    fontSize: 11.5,
    color: '#0284C7',
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
});
