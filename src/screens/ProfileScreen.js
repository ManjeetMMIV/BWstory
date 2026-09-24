import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../firebase/firestoreService';
import { CURRENT_USER } from '../data/mockData';
import { COLORS } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = SCREEN_WIDTH * 0.74;

export default function ProfileScreen({ navigation }) {
  const { firebaseUser, userProfile, setUserProfile, refreshProfile, logoutUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [photoUri, setPhotoUri] = useState(
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
  );

  const [form, setForm] = useState({
    name: userProfile?.name || CURRENT_USER.name,
    gender: userProfile?.gender || CURRENT_USER.gender,
    location: userProfile?.location || CURRENT_USER.location,
    profession: userProfile?.profession || CURRENT_USER.profession,
    bio: userProfile?.bio || CURRENT_USER.bio,
  });

  useEffect(() => {
    if (userProfile) {
      setForm({
        name: userProfile.name || CURRENT_USER.name,
        gender: userProfile.gender || CURRENT_USER.gender,
        location: userProfile.location || CURRENT_USER.location,
        profession: userProfile.profession || CURRENT_USER.profession,
        bio: userProfile.bio || CURRENT_USER.bio,
      });
      if (userProfile.avatarUrl || userProfile.avatar) {
        setPhotoUri(userProfile.avatarUrl || userProfile.avatar);
      }
    }
  }, [userProfile]);

  const handlePickPhoto = async () => {
    Alert.alert('Change Profile Picture', 'Choose an option', [
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          try {
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.85,
            });
            if (!res.canceled && res.assets && res.assets[0].uri) {
              const pickedUri = res.assets[0].uri;
              setPhotoUri(pickedUri);
              // Immediately update global auth state so bottom nav tab & all screens update in real time!
              setUserProfile(prev => ({
                ...(prev || CURRENT_USER),
                avatarUrl: pickedUri,
                avatar: pickedUri,
              }));
              if (firebaseUser?.uid && !firebaseUser?.isDemo && firebaseUser?.uid !== 'demo_user_123') {
                updateUserProfile(firebaseUser.uid, { avatarUrl: pickedUri, avatar: pickedUri }).catch(() => {});
              }
            }
          } catch (e) {
            Alert.alert('Notice', 'Could not open photo library.');
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setSaving(true);
    const updatedData = { ...form, avatarUrl: photoUri, avatar: photoUri };
    try {
      setUserProfile(p => ({ ...(p || CURRENT_USER), ...updatedData }));
      if (!firebaseUser?.isDemo && firebaseUser?.uid && firebaseUser?.uid !== 'demo_user_123') {
        await updateUserProfile(firebaseUser.uid, updatedData);
      }
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      setUserProfile(p => ({ ...(p || CURRENT_USER), ...updatedData }));
      Alert.alert('Success', 'Profile updated successfully!');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      Alert.alert('Account Options', 'Sign out of your session?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logoutUser() },
      ]);
    }
  };

  const wordCount = form.bio ? form.bio.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#071B24" />

      {/* ── Midnight Petroleum Gradient Top Header ── */}
      <LinearGradient
        colors={['#071B24', '#0C2B3A', '#133E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeHeader}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Text style={styles.topBarTitle}>Update Account</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* ── Prominent Photo Banner with Floating Camera Button (Reference 2) ── */}
        <View style={styles.photoContainer}>
          <Image key={photoUri} source={{ uri: photoUri }} style={styles.photoBanner} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(7, 27, 36, 0.45)']}
            style={styles.photoGradient}
          />

          {/* Floating White Camera Button */}
          <TouchableOpacity
            style={styles.cameraBtn}
            onPress={handlePickPhoto}
            activeOpacity={0.85}
          >
            <Feather name="camera" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Form Fields with Active Focus & Icons ── */}
        <View style={styles.formContainer}>
          {/* Name */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Feather name="user" size={13} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={styles.label}>Name</Text>
            </View>
            <View
              style={[
                styles.inputBox,
                focusedField === 'name' && styles.inputBoxFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={form.name}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                onChangeText={v => setForm(f => ({ ...f, name: v }))}
                placeholder="Your name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Gender */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="gender-male-female" size={14} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={styles.label}>Gender</Text>
            </View>
            <View
              style={[
                styles.inputBox,
                focusedField === 'gender' && styles.inputBoxFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={form.gender}
                onFocus={() => setFocusedField('gender')}
                onBlur={() => setFocusedField(null)}
                onChangeText={v => setForm(f => ({ ...f, gender: v }))}
                placeholder="Gender"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="location-outline" size={14} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={styles.label}>Location</Text>
            </View>
            <View
              style={[
                styles.inputBox,
                focusedField === 'location' && styles.inputBoxFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={form.location}
                onFocus={() => setFocusedField('location')}
                onBlur={() => setFocusedField(null)}
                onChangeText={v => setForm(f => ({ ...f, location: v }))}
                placeholder="City, State"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Profession */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Feather name="briefcase" size={13} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={styles.label}>Profession</Text>
            </View>
            <View
              style={[
                styles.inputBox,
                focusedField === 'profession' && styles.inputBoxFocused,
              ]}
            >
              <TextInput
                style={styles.input}
                value={form.profession}
                onFocus={() => setFocusedField('profession')}
                onBlur={() => setFocusedField(null)}
                onChangeText={v => setForm(f => ({ ...f, profession: v }))}
                placeholder="Your profession"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Bio Card */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Feather name="file-text" size={13} color="#0284C7" style={{ marginRight: 6 }} />
              <Text style={styles.label}>Bio</Text>
            </View>
            <View
              style={[
                styles.bioCard,
                focusedField === 'bio' && styles.bioCardFocused,
              ]}
            >
              <TextInput
                style={styles.bioInput}
                value={form.bio}
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField(null)}
                onChangeText={v => setForm(f => ({ ...f, bio: v }))}
                placeholder="Tell your story..."
                placeholderTextColor="#94A3B8"
                multiline
              />
              <View style={styles.bioFooter}>
                <View style={styles.wordPill}>
                  <Text style={styles.wordCountText}>({wordCount || 120} words)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Gradient Save Changes Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
            style={styles.saveBtnWrapper}
          >
            <LinearGradient
              colors={['#071B24', '#0C2B3A', '#133E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradientBtn}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.saveBtnContent}>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    padding: 6,
  },
  topBarTitle: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Photo Banner
  photoContainer: {
    width: '100%',
    height: PHOTO_HEIGHT,
    backgroundColor: '#071B24',
    position: 'relative',
    marginBottom: 20,
  },
  photoBanner: {
    width: '100%',
    height: '100%',
  },
  photoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -22,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#071B24',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },

  // Form Fields
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  inputBox: {
    backgroundColor: '#EDF2F6',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputBoxFocused: {
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0284C7',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
    fontWeight: '500',
  },

  // Bio Card
  bioCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    minHeight: 115,
    justifyContent: 'space-between',
  },
  bioCardFocused: {
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0284C7',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  bioInput: {
    fontSize: 13.5,
    color: '#0F172A',
    lineHeight: 21,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  bioFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  wordPill: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  wordCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  // Gradient Save Button
  saveBtnWrapper: {
    marginTop: 18,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#081724',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  saveGradientBtn: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
