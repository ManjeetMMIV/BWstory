# BWStory Clone – React Native App

A pixel-faithful React Native (Expo) clone of the **BWStory** mobile app featuring the **Discover Screen** and **Profile Screen** as specified in the Blackcoffer React Native Developer intern assignment, fully integrated with **Firebase** (Auth & Firestore) and offline/demo fallbacks.

---

## 📱 Screens Implemented

### 1. Discover Screen (`src/screens/DiscoverScreen.js`) — 🎯 Assignment Screen 1
- **Top Bar**:
  - Hamburger menu icon
  - Interactive search bar (filters posts by user name and caption in real-time)
  - Filter / sliders icon
- **Vertical Feed Cards**:
  - User avatar with initials/photo fallback
  - Author name + relative timestamp ("9m ago", "15m ago")
  - Toggleable **Follow / Following** button with state feedback
  - Three-dot options menu
  - Full-width media presentation
  - **Video Overlay Controls**: Rewind 10s, Play/Pause toggle with animated state, Fast-forward 10s, Volume indicator, and "W" brand badge
  - **Interactive Action Bar**:
    - Animated heart (Like / Unlike) with spring scale animation and live count
    - Expandable comment counter button
    - Share & Bookmark action icons
  - **Expandable Comments Section**:
    - Real-time Firestore comment subscription + mock defaults
    - User avatar, name, text, and like icon
    - Add-comment input with real-time submit button

### 2. Profile Screen (`src/screens/ProfileScreen.js`) — 🎯 Assignment Screen 2
- **Top Bar**:
  - Logout button (supports both Firebase and Demo sessions)
  - Centered "Update Account" header title
  - Edit mode toggle button (pencil icon)
- **Cover Photo & Avatar Section**:
  - Full-width cover photo with camera change button
  - Circular avatar overlapping the cover image with camera change button
  - **Device Gallery Integration**: Pick custom photos directly from your phone gallery via `expo-image-picker`
  - Fallback to custom image URL input if desired
- **Account Stats Row**:
  - Posts (23) | Followers (128) | Following (94)
- **Editable Form Fields**:
  - Name, Gender, Location, Profession, Bio
  - Live bio word counter
  - Edit / Cancel / Update Profile workflows
  - Optimistic local state + real-time Firestore sync

### 3. Notifications Screen (`src/screens/NotificationsScreen.js`)
- Top bar with menu and options icons
- Segmented tab switcher: **News Feed** vs **Social**
- Grouped sections: **Today** (with Clear button) and **This Week**
- Notification rows with user avatar, activity text, timestamp, and unread indicator dot

### 4. Authentication & Quick Demo (`src/screens/LoginScreen.js` & `RegisterScreen.js`)
- **Firebase Auth**: Real email/password registration and sign-in
- **Quick Demo Mode**: One-tap "Try Demo Mode (Quick Preview)" button to immediately explore all screens without needing to create an account
- Secure password visibility toggle and friendly validation messages

---

## 🗂 Project Structure

```
intern_assignment/
├── App.js                          # Root wrapper with GestureHandler, SafeArea, AuthProvider
├── app.json                        # Expo app configuration
├── google-services.json            # Firebase configuration
├── package.json
├── src/
│   ├── context/
│   │   └── AuthContext.js          # Global auth state & Demo user provider
│   ├── data/
│   │   └── mockData.js             # BWStory post, notification, and user mock datasets
│   ├── firebase/
│   │   ├── config.js               # Firebase v12 JS SDK setup (in-memory persistence)
│   │   ├── authService.js          # Firebase Auth functions (register, login, logout)
│   │   └── firestoreService.js     # Firestore CRUD (posts, likes, comments, profile, notifications)
│   ├── navigation/
│   │   └── AppNavigator.js         # Bottom Tab Navigator (5 tabs) + Auth Stack
│   ├── screens/
│   │   ├── DiscoverScreen.js       # 🎯 Assignment Screen 1
│   │   ├── ProfileScreen.js        # 🎯 Assignment Screen 2
│   │   ├── NotificationsScreen.js  # Notifications feed
│   │   ├── HomeScreen.js           # Home screen
│   │   ├── LoginScreen.js          # Sign in + Demo mode
│   │   └── RegisterScreen.js       # Create account
│   └── theme/
│       └── colors.js               # BWStory navy brand color palette
└── assets/
```

---

## ⚙️ Installation & Running

### Prerequisites
- Node.js 18+
- [Expo Go](https://expo.dev/go) app on your Android or iOS device (free on Google Play Store / App Store)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the App
```bash
npx expo start
```

- Open **Expo Go** on your Android phone and scan the QR code displayed in the terminal.
- On iOS, scan the QR code with the default Camera app.
- Press **`a`** in the terminal to launch on a connected Android device or emulator.

### 3. Testing the Screens
- **Fastest Option**: On the login screen, tap **"Try Demo Mode (Quick Preview)"** to instantly access the app with Rashmi Desai's profile and the full BWStory feed.
- **Firebase Option**: Sign up with any email & password to test real Firebase Auth registration and profile creation.

---

## 📦 How to Build the Standalone APK

### Method A: EAS Cloud Build (Recommended — No Android Studio needed)

```bash
# 1. Install EAS CLI globally
npm install -g eas-cli

# 2. Login to your free Expo account
eas login

# 3. Build APK for Android
eas build --platform android --profile preview
```
Once the build completes on the Expo cloud, EAS will print a direct `.apk` download link!

### Method B: Local Gradle Build (Requires Android SDK)

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
# APK is generated at: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🧑‍💻 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React Native (Expo SDK 57) |
| **Backend & Database** | Firebase Auth + Cloud Firestore (v12) |
| **Navigation** | React Navigation v7 (Bottom Tabs + Native Stack) |
| **Media & Gallery** | `expo-image-picker`, `expo-av` |
| **Vector Icons** | `@expo/vector-icons` (Ionicons, Feather) |
| **Safe Area & Gestures** | `react-native-safe-area-context`, `react-native-gesture-handler` |
| **Animations** | `react-native-reanimated` |
| **Build System** | EAS Build (preview profile produces APK) |

---

## 🚀 Further Improvements Roadmap

1. **Push Notifications**: Expo Notifications with FCM to alert users on comments, likes, and follows.
2. **Video Streaming Optimization**: HLS video streaming via Cloudflare Stream or Mux.
3. **Ephemeral Stories**: 24-hour stories ring at the top of the Discover feed.
4. **Search Backend**: Algolia or Elasticsearch integration for full-text indexed discovery.
5. **Theme Switching**: Dark / Light theme toggle.
