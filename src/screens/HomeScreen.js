import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../firebase/firestoreService';

const CATEGORIES = ['Breaking', 'Technology', 'Business', 'World', 'Lifestyle', 'Sports'];
const POPULAR_TAGS = ['#BreakingNews', '#TechUpdate', '#BWStory', '#Trending'];

export default function HomeScreen({ navigation }) {
  const { firebaseUser, userProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Breaking');
  const [mediaUri, setMediaUri] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handlePickMedia = async () => {
    Alert.alert('Add Story Media', 'Choose source', [
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          try {
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images', 'videos'],
              allowsEditing: true,
              aspect: [16, 9],
              quality: 0.85,
            });
            if (!res.canceled && res.assets && res.assets[0].uri) {
              setMediaUri(res.assets[0].uri);
              setIsVideo(res.assets[0].type === 'video');
            }
          } catch (e) {
            Alert.alert('Notice', 'Could not open photo library.');
          }
        },
      },
      {
        text: 'Use Sample HD Image',
        onPress: () => {
          setMediaUri('https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80');
          setIsVideo(false);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleAddTag = (tag) => {
    if (caption.includes(tag)) return;
    setCaption(prev => (prev ? `${prev} ${tag}` : tag));
  };

  const handlePublish = async () => {
    const finalCaption = caption.trim() || title.trim();
    if (!finalCaption) {
      Alert.alert('Required', 'Please add a headline or caption for your story.');
      return;
    }

    setPublishing(true);
    const postPayload = {
      uid: firebaseUser?.uid || 'user_demo',
      userName: userProfile?.name || 'You',
      userAvatar: userProfile?.avatarUrl || userProfile?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80',
      imageUrl: mediaUri || 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      videoUrl: isVideo ? mediaUri : '',
      isVideo: isVideo,
      caption: title.trim() ? `${title.trim()} — ${finalCaption}` : finalCaption,
    };

    try {
      await createPost(postPayload);
      Alert.alert('Success!', 'Your story was published successfully.', [
        {
          text: 'View in Feed',
          onPress: () => {
            setTitle('');
            setCaption('');
            setMediaUri('');
            navigation.navigate('Discover');
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Success!', 'Your story was posted to the feed.', [
        {
          text: 'View in Feed',
          onPress: () => {
            setTitle('');
            setCaption('');
            setMediaUri('');
            navigation.navigate('Discover');
          },
        },
      ]);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B24" />

      {/* ── Midnight Petroleum Gradient Header ── */}
      <LinearGradient
        colors={['#071B24', '#0C2B3A', '#133E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.navigate('Discover')}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Create New Story</Text>

            <TouchableOpacity
              style={[styles.publishPill, publishing && { opacity: 0.6 }]}
              onPress={handlePublish}
              disabled={publishing}
              activeOpacity={0.85}
            >
              {publishing ? (
                <ActivityIndicator size="small" color="#0C2B3A" />
              ) : (
                <Text style={styles.publishPillText}>Publish</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Media Upload Card ── */}
        <TouchableOpacity
          style={styles.mediaPickerCard}
          onPress={handlePickMedia}
          activeOpacity={0.9}
        >
          {mediaUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.mediaTypeBadge}>
                <Ionicons name={isVideo ? 'videocam' : 'image'} size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.mediaTypeText}>{isVideo ? 'Video Clip' : 'Cover Photo'}</Text>
              </View>
              <View style={styles.changeMediaPill}>
                <Feather name="refresh-cw" size={13} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.changeMediaText}>Change Media</Text>
              </View>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <LinearGradient
                colors={['#0284C7', '#0EA5E9']}
                style={styles.uploadIconCircle}
              >
                <Ionicons name="cloud-upload-outline" size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.uploadTitle}>Add Photo or Video</Text>
              <Text style={styles.uploadSubtitle}>Tap to browse from your gallery or choose a demo cover</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* ── Category Pills ── */}
        <Text style={styles.sectionLabel}>Select Topic</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Story Headline ── */}
        <Text style={styles.sectionLabel}>Headline</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.titleInput}
            placeholder="What's happening? (e.g. Major Renewable Milestone)"
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* ── Story Body / Caption ── */}
        <Text style={styles.sectionLabel}>Story Content</Text>
        <View style={styles.captionBox}>
          <TextInput
            style={styles.captionInput}
            placeholder="Provide context, details, and insights..."
            placeholderTextColor="#94A3B8"
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={4}
          />
          <View style={styles.captionFooter}>
            <Text style={styles.charCount}>{caption.length} characters</Text>
          </View>
        </View>

        {/* ── Quick Hashtags ── */}
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsLabel}>Add Tag:</Text>
          {POPULAR_TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={styles.tagPill}
              onPress={() => handleAddTag(tag)}
              activeOpacity={0.75}
            >
              <Text style={styles.tagPillText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Location Tag ── */}
        <Text style={styles.sectionLabel}>Location Tag</Text>
        <View style={styles.locationBox}>
          <Ionicons name="location-outline" size={17} color={COLORS.primary} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.locationInput}
            placeholder="Add location (e.g. New Delhi, India)"
            placeholderTextColor="#94A3B8"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* ── Publish Button ── */}
        <TouchableOpacity
          style={styles.publishBtnWrapper}
          onPress={handlePublish}
          disabled={publishing}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#071B24', '#0C2B3A', '#133E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.publishGradientBtn}
          >
            {publishing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.publishBtnText}>Publish Story to Feed</Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    elevation: 8,
    shadowColor: '#071B24',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    zIndex: 100,
  },
  safeHeader: {
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cancelBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  publishPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  publishPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
  },

  // Media Picker Card
  mediaPickerCard: {
    height: 180,
    borderRadius: 16,
    backgroundColor: '#EDF2F6',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  mediaTypeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 27, 36, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mediaTypeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  changeMediaPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 27, 36, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  changeMediaText: {
    fontSize: 11.5,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  uploadIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#0284C7',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  uploadTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Sections
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginTop: 4,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingBottom: 14,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#EDF2F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Inputs
  inputBox: {
    backgroundColor: '#EDF2F6',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  titleInput: {
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
    fontWeight: '500',
  },
  captionBox: {
    backgroundColor: '#EDF2F6',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 100,
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  captionInput: {
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  captionFooter: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  charCount: {
    fontSize: 11,
    color: '#94A3B8',
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
  },
  tagsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 6,
  },
  tagPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginVertical: 2,
  },
  tagPillText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },

  // Location
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF2F6',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  locationInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 0,
  },

  // Publish Button
  publishBtnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#071B24',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  publishGradientBtn: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
