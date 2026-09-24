import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

// Screens
import DiscoverScreen from '../screens/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

// ── Auth Stack (not logged in) ────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ── Profile Tab Icon (Auto-updates when photo changes) ─────
function ProfileTabIcon({ focused }) {
  const { userProfile } = useAuth();
  const avatarUrl =
    userProfile?.avatarUrl ||
    userProfile?.avatar ||
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&q=80';

  return (
    <View style={styles.profileTabWrapper}>
      <Image
        key={avatarUrl}
        source={{ uri: avatarUrl }}
        style={[
          styles.profileTabAvatar,
          focused && styles.profileTabAvatarFocused,
        ]}
      />
      {focused && <View style={styles.activeBar} />}
    </View>
  );
}

// ── Main Tab Navigator (logged in) ────────────────────────
function MainNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 8 : 4);
  const barHeight = 56 + bottomInset;

  return (
    <Tab.Navigator
      initialRouteName="Discover"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8ECEF',
          height: barHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#071B24',
          shadowOpacity: 0.08,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 6,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactiveTint,
      }}
    >
      <Tab.Screen
        name="Explore"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color }) => <Feather name="compass" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ color }) => <Ionicons name="location-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Add"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={29}
              color={focused ? COLORS.primary : color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <ProfileTabIcon focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────
export default function AppNavigator() {
  const { firebaseUser, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.splashLogo}>
          <Ionicons name="newspaper" size={48} color="#FFFFFF" />
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {firebaseUser ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Profile Tab
  profileTabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileTabAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#CBD5E1',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  profileTabAvatarFocused: {
    borderColor: COLORS.primary,
  },
  activeBar: {
    width: 18,
    height: 2.5,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: 3,
  },
});
