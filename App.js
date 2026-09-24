import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

// Suppress benign fallback warnings from popping up in LogBox on device
LogBox.ignoreLogs([
  'Firestore feed error',
  'Firestore comments error',
  'Firestore notifications error',
  'Cannot connect to Expo CLI',
  'Missing or insufficient permissions',
  '@firebase/firestore',
]);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
