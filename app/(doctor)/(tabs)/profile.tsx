import { deleteAccount } from '@/api/patient/user';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/authContext';
import { Ionicons as Icons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const { logout, doctorProfile, isLoading, getMe, getDoctorProfile } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(null);

  // Track if this is the first mount to prevent duplicate calls
  const isInitialMount = useRef(true);
  const lastFetchTime = useRef<number>(0);
  const FETCH_COOLDOWN = 2000; // 2 seconds cooldown between fetches

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };

    loadToken();
  }, []);

  const fetchProfile = useCallback(async () => {
    // Prevent too frequent API calls
    const now = Date.now();
    if (now - lastFetchTime.current < FETCH_COOLDOWN) {
      console.log('Skipping fetch - too soon since last fetch');
      return;
    }

    lastFetchTime.current = now;
    setLoadingProfile(true);

    try {
      await getMe();
      // Force refresh doctor profile to get latest data
      await getDoctorProfile();
      console.log('Profile fetched successfully');
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);

      if (error instanceof SyntaxError) {
        console.error('JSON parsing error:', error);
      } else if (error instanceof Error) {
        console.error('Profile fetch error:', error.message);

        // Show user-friendly error for rate limiting
        if (error.message.includes('429')) {
          showToast('Please wait before refreshing again', 'error');
        }
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [getMe, getDoctorProfile, showToast]);

  // Only fetch on initial mount if we don't have profile data
  useEffect(() => {
    if (isInitialMount.current && !doctorProfile) {
      isInitialMount.current = false;
      fetchProfile();
    }
  }, []);

  // Refresh when screen comes into focus (but skip the initial focus)
  useFocusEffect(
    useCallback(() => {
      // Skip if this is the initial mount
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      // Only fetch when returning from specific routes (like profile-settings)
      const shouldRefresh = router.canGoBack(); // or check specific routes
      if (shouldRefresh && doctorProfile) {
        console.log('Screen focused - refreshing profile');
        fetchProfile();
      }
    }, [fetchProfile, doctorProfile])
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
        // disabled: isLoading || loadingProfile
      },
    ];

  const handleLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  const handleDeleteAccount = async () => {
    if (!token) return;

    try {
      setIsDeleting(true);
      await deleteAccount(token);
      await logout();
      console.log('Account deleted successfully and logged out');
      showToast('Your account has been successfully deleted', 'success');
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('Failed to delete account. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const confirmDeleteAccount = () => {
    setShowDeleteModal(true);
  };

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
                key={doctorProfile.profile.profileImage.url} // Force re-render on URL change
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
            // disabled={isLoading || loadingProfile}
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

        <View>
          <TouchableOpacity onPress={confirmDeleteAccount}>
            <Text className='text-red-500 font-sans-medium text-lg text-center mt-8'>Delete Account</Text>
          </TouchableOpacity>
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

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-4">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-xl font-sans-bold text-gray-900 mb-2">Delete Account</Text>
            <Text className="text-gray-600 font-sans mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg"
              >
                <Text className="text-gray-600 font-sans-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-500 px-4 py-2 rounded-lg"
              >
                {isDeleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans-medium">Delete</Text>
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