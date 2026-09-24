import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, StatusBar, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { NOTIFICATIONS } from '../data/mockData';
import { subscribeToNotifications, markNotificationsRead } from '../firebase/firestoreService';
import { COLORS } from '../theme/colors';

const isToday = (seconds) => {
  const date = new Date(seconds * 1000);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export default function NotificationsScreen() {
  const { firebaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState('Social');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!firebaseUser?.uid || firebaseUser?.isDemo) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToNotifications(firebaseUser.uid, (data) => {
      if (data && data.length > 0) {
        setNotifications(data);
      }
      setLoading(false);
      markNotificationsRead(firebaseUser.uid).catch(() => {});
    });
    return unsub;
  }, [firebaseUser?.uid, firebaseUser?.isDemo]);

  const todayNotifs = notifications.filter(n => n.createdAt?.seconds && isToday(n.createdAt.seconds));
  const weekNotifs = notifications.filter(n => !n.createdAt?.seconds || !isToday(n.createdAt.seconds));

  const timeAgo = (ts) => {
    if (!ts?.seconds) return '9m ago';
    const diff = Date.now() / 1000 - ts.seconds;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getBadgeIcon = (type) => {
    if (type === 'like') return { name: 'heart', color: '#FF2A5F', bg: '#FFE4E6' };
    if (type === 'comment') return { name: 'chatbubble', color: '#0284C7', bg: '#E0F2FE' };
    return { name: 'person', color: '#0D2538', bg: '#E2E8F0' };
  };

  const renderNotif = (notif) => {
    const badge = getBadgeIcon(notif.type || 'follow');

    return (
      <TouchableOpacity key={notif.id} style={styles.notifRow} activeOpacity={0.75}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                notif.fromAvatar ||
                notif.user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
            }}
            style={styles.notifAvatar}
          />
          {/* Mini Activity Badge */}
          <View style={[styles.miniBadge, { backgroundColor: badge.bg }]}>
            <Ionicons name={badge.name} size={9} color={badge.color} />
          </View>
        </View>

        <View style={styles.notifContent}>
          <Text style={styles.notifText}>
            <Text style={styles.notifName}>{notif.fromName || notif.user?.name || 'Sunny'}</Text>
            {' '}
            {notif.action
              ? notif.action
              : notif.type === 'follow'
              ? 'started following you'
              : notif.type === 'like'
              ? 'liked your post'
              : notif.type === 'comment'
              ? 'commented on your post'
              : 'started following you'}
          </Text>
          <Text style={styles.notifTime}>{notif.time || timeAgo(notif.createdAt)}</Text>
        </View>

        <View style={styles.unreadDot} />
      </TouchableOpacity>
    );
  };

  const displayList =
    notifications.length > 0
      ? [
          ...(todayNotifs.length > 0 ? [{ type: 'header', title: 'Today', id: 'h1' }] : []),
          ...todayNotifs.map(n => ({ ...n, _section: 'today' })),
          ...(weekNotifs.length > 0 ? [{ type: 'header', title: 'This Week', id: 'h2' }] : []),
          ...weekNotifs.map(n => ({ ...n, _section: 'week' })),
        ]
      : [
          { type: 'header', title: 'Today', id: 'h1' },
          ...(NOTIFICATIONS[0]?.items || []),
          { type: 'header', title: 'This Week', id: 'h2' },
          ...(NOTIFICATIONS[1]?.items || []),
        ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B24" />

      {/* ── Midnight Petroleum Gradient Top Header ── */}
      <LinearGradient
        colors={['#071B24', '#0C2B3A', '#133E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topBarGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8}>
              <Ionicons name="menu" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity activeOpacity={0.7} style={styles.searchIconBtn}>
                <Ionicons name="search" size={17} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
              <Ionicons name="options-outline" size={23} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Segmented Switcher (News Feed / Social) Matching Reference ── */}
      <View style={styles.segmentWrapper}>
        <View style={styles.segmentBox}>
          {['News Feed', 'Social'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.segBtn, activeTab === tab && styles.segBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.85}
            >
              <Text style={[styles.segText, activeTab === tab && styles.segTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{item.title}</Text>
                  {item.title === 'Today' && (
                    <TouchableOpacity activeOpacity={0.7}>
                      <Text style={styles.clearText}>Clear all</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }
            return renderNotif(item);
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Top Bar Gradient
  topBarGradient: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 8,
    shadowColor: '#071B24',
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
  searchIconBtn: { padding: 4 },
  filterBtn: {
    padding: 6,
  },

  // Segment
  segmentWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  segmentBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  segBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  segText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  segTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Sections
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  clearText: {
    fontSize: 13,
    color: '#8E9DAE',
    fontWeight: '500',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  notifAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
  },
  miniBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 13.5,
    color: '#1E293B',
    lineHeight: 19,
  },
  notifName: {
    fontWeight: '700',
    color: '#0F172A',
  },
  notifTime: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0284C7',
    marginLeft: 10,
  },
});
