import React, { useEffect, useState } from 'react';
import { View, Image, StatusBar } from 'react-native';
import { Images } from '@/assets/Images';
import { router } from 'expo-router';
import { useAuth } from '@/context/authContext';

export default function App() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only proceed with navigation after auth state is initialized
    if (!isLoading) {
      const timer = setTimeout(() => {
        try {
          if (isAuthenticated && user) {
            // User is logged in, redirect to appropriate dashboard
            if (user.role === 'doctor') {
              router.replace('/(doctor)/(tabs)/home');
            } else {
              router.replace('/(patient)/(tabs)/home');
            }
          } else {
            // User is not logged in, redirect to welcome screen
            router.replace('/welcome');
          }
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback to welcome screen if there's any error
          router.replace('/welcome');
        } finally {
          setInitialized(true);
        }
      }, 5000); // Show splash for at least 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, user]); // Re-run when auth state changes

  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <StatusBar hidden />
      {/* Logo */}
      <Image
        source={Images.Logo}
        style={{ width: 300, height: 300, resizeMode: 'contain' }}
        className="mb-8"
      />
    </View>
  );
}