import '@/assets/fonts';
import { AuthProvider, useAuth } from '@/context/authContext';
import * as Font from 'expo-font';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const loadFonts = async () => {
  await Font.loadAsync({
    'Inter-Regular': require('@/assets/fonts/Inter/static/Inter_18pt-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter/static/Inter_18pt-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter/static/Inter_18pt-SemiBold.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter/static/Inter_18pt-Bold.ttf'),
  });
};

function RootLayoutNav() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      // Still loading auth state, show nothing or a loading screen
      return;
    }

    // Use a small timeout to ensure the navigation state is ready
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        // User is authenticated, navigate to the appropriate dashboard
        const dashboardPath = user.role === 'doctor' 
          ? '/(doctor)/(tabs)/home' 
          : '/(patient)/(tabs)/home';
        
        // Get current route from the navigation state
        const currentPath = window.location.pathname || '';
        
        // Only navigate if we're not already on the dashboard
        if (!currentPath.includes('(tabs)')) {
          router.replace(dashboardPath);
        }
      } else if (!isAuthenticated) {
        // User is not authenticated, navigate to auth screens
        // But only if we're not already on an auth screen
        const currentPath = window.location.pathname || '';
        if (!currentPath.includes('(auth)')) {
          router.replace('/');
        }
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, user, router]);

  // Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(patient)" />
        <Stack.Screen name="(doctor)" />
      </Stack>
    </View>
  );
}

function AppContent() {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }
  
  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await loadFonts();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}