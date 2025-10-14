import { useAuth } from '@/context/authContext';
import { Ionicons as Icons, Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type IconName = keyof typeof Icons.glyphMap;

const Profile = () => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { logout, doctorProfile, isLoading, getMe } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (doctorProfile) {
      return; // Skip if we already have profile data
    }

    setLoadingProfile(true);
    
    try {
      await getMe();
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      
      if (error instanceof SyntaxError) {
        console.error('JSON parsing error:', error);
        // The error is already logged, we'll let the component handle the empty state
      } else if (error instanceof Error) {
        console.error('Profile fetch error:', error.message);
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [getMe]);

  // Initial fetch
  useEffect(() => {
    if (!doctorProfile) {
      fetchProfile();
    }
  }, [doctorProfile, fetchProfile]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const menuItems: {
    icon: IconName;
    title: string;
    chevron: boolean;
    action?: () => void;
  }[] = [
      {
        icon: 'person-outline',
        title: 'Profile Settings',
        chevron: true,
        action: () => router.push('/(doctor)/(pages)/profile-settings')
      },
      {
        icon: 'time-outline',
        title: 'Schedule & Availability',
        chevron: true,
        action: () => router.push('/(doctor)/(pages)/schedule-availability')
      },
      {
        icon: 'wallet-outline',
        title: 'Bank Account',
        chevron: true,
        action: () => router.push('/(doctor)/(pages)/bank-account')
      },
      {
        icon: 'shield-outline',
        title: 'Security Settings',
        chevron: true,
        action: () => router.push('/(doctor)/(pages)/security')
      },
      // },
      {
        icon: 'chatbubble-ellipses-outline',
        title: 'Help and Support',
        chevron: true,
        action: () => router.push('/(doctor)/(pages)/help')
      },
      {
        icon: 'help-circle-outline',
        title: 'FAQ',
        chevron: true,
        action: () => router.push('/(doctor)/(pages)/faq')
      },
      {
        icon: 'log-out-outline',
        title: 'Log out',
        chevron: false,
        action: () => setLogoutModalVisible(true),
      },
    ];

  const handleLogout = () => {
    setLogoutModalVisible(false)
    logout()
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
 
      <ScrollView className="flex-1 bg-gray-50">
        {/* Profile Info */}
        <View className="items-center py-8 bg-white mb-4">
          <View className="w-36 h-36 rounded-full bg-gray-200 items-center justify-center mb-4 border-2 border-[#67A9AF]">
            {doctorProfile?.profile?.profileImage?.url ? (
              <Image
                source={{ uri: doctorProfile.profile.profileImage.url }}
                className="w-full h-full rounded-full"
              />
            ) : (
              <Ionicons name="person" size={40} color="#6B7280" />
            )}
          </View>
          <Text className="text-xl font-sans-bold text-gray-900 mb-1">
            {doctorProfile?.profile?.title ? `${doctorProfile.profile.title} ` : ''}{doctorProfile?.fullName || 'Doctor'}
          </Text>
          <Text className="text-gray-500 font-sans">
            {doctorProfile?.email || ''}
          </Text>
          <Text className="text-gray-500 font-sans">
            {doctorProfile?.speciality || 'Medical Professional'}
          </Text>
        </View>

        {/* Menu Items */}
        <View className="bg-white px-6 py-2">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center py-4 border-b border-gray-100"
              onPress={item.action}
              disabled={isLoading}
            >
              <View className="w-8">
                <Ionicons name={item.icon} size={22} color="#6B7280" />
              </View>
              <Text className="flex-1 font-sans text-base text-gray-900">
                {item.title}
              </Text>
              {item.chevron && (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl w-full max-w-sm p-6">
            <Text className="text-xl font-sans-bold text-gray-900 mb-2">
              Log Out
            </Text>
            <Text className="text-gray-600 font-sans mb-6">
              Are you sure you want to log out?
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-6 py-3 rounded-xl"
                onPress={() => setLogoutModalVisible(false)}
                disabled={isLoading}
              >
                <Text className="text-gray-700 font-sans font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#67A9AF] px-6 py-3 rounded-xl"
                onPress={handleLogout}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans font-medium">Log Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;