import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/authContext';
import { uploadProfilePicture } from '@/api/patient/user';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useToast } from '@/components/ui/Toast';
import ProfileForm from '@/components/settings/ProfileForm';
import ChangePasswordForm from '@/components/settings/ChangePasswordForm';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const { user, updateProfile, updatePassword, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(null);

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

  const handleUpdateProfile = async (data: any) => {
    try {
      setIsLoading(true);
      await updateProfile(data);
      showToast('Profile updated successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      const result = await updatePassword(currentPassword, newPassword);
      if (result.success) {
        showToast('Password updated successfully', 'success');
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to update password');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to update password', 'error');
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setShowLogoutModal(false);
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setIsLoading(true);
        const response = await uploadProfilePicture(token!, result.assets[0].uri, result.assets[0].mimeType || 'image/jpeg');
        
        if (response) {
          await updateProfile({ profileImage: response.profileImage });
          showToast('Profile picture updated', 'success');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Failed to update profile picture', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-sans-bold text-gray-900">Settings</Text>
            <View style={{ width: 24 }} />
          </View>

          <View className="items-center mb-8">
            <TouchableOpacity 
              onPress={pickImage}
              className="relative"
              disabled={isLoading}
            >
              <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                {user?.profileImage?.url ? (
                  <Image 
                    source={{ uri: user.profileImage.url }} 
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="person" size={40} color="#9CA3AF" />
                )}
                {isLoading && (
                  <View className="absolute inset-0 bg-black bg-opacity-50 items-center justify-center">
                    <Ionicons name="cloud-upload" size={24} color="white" />
                  </View>
                )}
              </View>
              <View className="absolute bottom-0 right-0 bg-primary rounded-full p-1.5">
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-xl font-sans-bold text-gray-900 mt-3">
              {user?.firstName} {user?.lastName}
            </Text>
            <Text className="text-gray-500 font-sans">
              {user?.email}
            </Text>
          </View>

          <View className="flex-row border-b border-gray-200 mb-6">
            <TouchableOpacity 
              className={`flex-1 py-3 items-center ${activeTab === 'profile' ? 'border-b-2 border-primary' : ''}`}
              onPress={() => setActiveTab('profile')}
            >
              <Text className={`font-sans-medium ${activeTab === 'profile' ? 'text-primary' : 'text-gray-500'}`}>
                Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`flex-1 py-3 items-center ${activeTab === 'security' ? 'border-b-2 border-primary' : ''}`}
              onPress={() => setActiveTab('security')}
            >
              <Text className={`font-sans-medium ${activeTab === 'security' ? 'text-primary' : 'text-gray-500'}`}>
                Security
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-8">
            {activeTab === 'profile' ? (
              <ProfileForm 
                initialData={{
                  firstName: user?.firstName || '',
                  lastName: user?.lastName || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                }}
                onSubmit={handleUpdateProfile}
                isLoading={isLoading}
              />
            ) : (
              <ChangePasswordForm 
                onSubmit={handleChangePassword}
                isLoading={isLoading}
              />
            )}
          </View>

          <TouchableOpacity 
            className="bg-red-50 py-3 px-4 rounded-lg flex-row items-center justify-center border border-red-100 mb-8"
            onPress={() => setShowLogoutModal(true)}
          >
            <View style={{ marginRight: 8 }}>
              <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            </View>
            <Text className="text-red-500 font-sans-medium">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="bg-white rounded-2xl w-full max-w-sm p-6">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="log-out-outline" size={32} color="#EF4444" />
              </View>
              <Text className="text-xl font-sans-bold text-gray-900 mb-2">Logout</Text>
              <Text className="text-gray-600 font-sans text-center">
                Are you sure you want to logout? You'll need to sign in again to access your account.
              </Text>
            </View>

            <View className="space-y-3">
              <TouchableOpacity
                className="bg-red-500 py-3 rounded-lg items-center"
                onPress={handleLogout}
              >
                <Text className="text-white font-sans-bold">Yes, Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-gray-100 py-3 rounded-lg items-center mt-4"
                onPress={() => setShowLogoutModal(false)}
              >
                <Text className="text-gray-700 font-sans-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;