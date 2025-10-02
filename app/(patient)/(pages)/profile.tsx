import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, SafeAreaView, Modal } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { uploadProfilePicture, deleteAccount } from '../../../api/patient/user';
import { User } from '@/types/User';
import { ImageSourcePropType } from 'react-native';

export default function ProfileScreen() {
    const { user, token, logout, getMe } = useAuth();
    const { showToast } = useToast();
    const [profile, setProfile] = useState<User | null>(null);
    const [uploading, setUploading] = useState(false);

    const [loadingProfile, setLoadingProfile] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoadingProfile(true);
                try {
                    await getMe();
                } finally {
                    setLoadingProfile(false);
                }
            } else {
                // Set the profile data when user is available
                setProfile(user as unknown as User);
            }
        };
        fetchProfile();
    }, [user, getMe]);

    const handleImageUpload = async () => {
        if (!token) return;

        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                showToast('Please allow access to your photos to upload a profile picture', 'error');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setUploading(true);
                const asset = result.assets[0];
                await uploadProfilePicture(token, asset.uri, asset.mimeType || 'image/jpeg');

                // Refresh user data to get the updated profile image
                await getMe();

                showToast('Profile picture updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            showToast('Failed to upload profile picture', 'error');
        } finally {
            setUploading(false);
        }
    };


    if (!profile && !loadingProfile) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-gray-600">Failed to load profile</Text>
            </View>
        );
    }

    if (loadingProfile) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    const fullName = `${profile?.firstName} ${profile?.lastName}`.trim();
    const userId = profile?._id.substring(profile._id.length - 6);

    const handleDeleteAccount = async () => {
        if (!token) return;

        try {
            setIsDeleting(true);
            await deleteAccount(token);
            await logout()
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
        <SafeAreaView className="flex-1 bg-gray-50 p-4">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="bg-white rounded-full p-2 shadow-sm">
                    <Ionicons name="chevron-back" size={20} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl flex-1 text-center mr-8 font-sans-semibold">My Profile</Text>
            </View>

            <ScrollView className="flex-1">
                {/* Profile Section */}
                <View className="items-center py-8 mb-2">
                    <TouchableOpacity
                        onPress={handleImageUpload}
                        disabled={uploading}
                        className="relative mb-3"
                    >
                        <Image
                            source={{
                                uri: profile?.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'U')}&background=67A9AF&color=fff`
                            } as ImageSourcePropType}
                            className="w-24 h-24 rounded-full"
                        />
                        {uploading ? (
                            <View className="absolute inset-0 bg-black/40 rounded-full items-center justify-center">
                                <ActivityIndicator color="#fff" />
                            </View>
                        ) : (
                            <View className="absolute bottom-0 right-0 bg-secondary p-2 rounded-full">
                                <Feather name="camera" size={16} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <Text className="text-xl font-sans-bold text-gray-900 mb-1">{fullName || 'User'}</Text>
                    <Text className="text-gray-600 font-sans mb-1">{profile?.email}</Text>
                    <Text className="text-gray-500 font-sans">zyda id - {userId}</Text>
                </View>

                {/* Menu Items */}
                <View className='bg-white px-4 rounded-[10px] shadow-lg'>
                    <View className="">
                        {/* Birthday */}
                        <TouchableOpacity onPress={() => router.push('/edit-birthday')} className="flex-row items-center px-4 py-4 border-b border-gray-100">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                                <Feather name="gift" size={20} color="#000" />
                            </View>
                            <Text className="flex-1 text-gray-900 text-base font-sans"> {profile?.dob ? new Date(profile.dob).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : 'Birthday'}</Text>
                            <Feather name="chevron-right" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* Phone */}
                        <TouchableOpacity onPress={() => router.push('/edit-phone')} className="flex-row items-center px-4 py-4 border-b border-gray-100">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                                <Feather name="phone" size={20} color="#000" />
                            </View>
                            <Text className="flex-1 text-gray-900 text-base font-sans">{profile?.phone || 'Phone Number'}</Text>
                            <Feather name="chevron-right" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* Email */}
                        <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-gray-100">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                                <Feather name="mail" size={20} color="#000" />
                            </View>
                            <Text className="flex-1 text-gray-900 text-base font-sans">{profile?.email}</Text>
                            {/* <Feather name="chevron-right" size={20} color="#9CA3AF" /> */}
                        </TouchableOpacity>

                        {/* Country */}
                        <TouchableOpacity onPress={() => router.push('/edit-country')} className="flex-row items-center px-4 py-4 border-b border-gray-100">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                                <Feather name="globe" size={20} color="#000" />
                            </View>
                            <Text className="flex-1 text-gray-900 text-base font-sans">
                                {[profile?.country, profile?.state, profile?.city, profile?.address, profile?.zipCode]
                                    .filter(Boolean)
                                    .join(' ') || 'Location'}
                            </Text>
                            <Feather name="chevron-right" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* KYC */}
                        <TouchableOpacity onPress={() => router.push('/kyc-verification')} className="flex-row items-center px-4 py-4">
                            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-4">
                                <Feather name="shield" size={20} color="#000" />
                            </View>
                            <Text className="flex-1 text-gray-900 text-base font-sans">KYC</Text>
                            <Feather name="chevron-right" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Delete Account */}
                <View className="items-center py-8">
                    <TouchableOpacity
                        onPress={confirmDeleteAccount}
                        disabled={isDeleting}
                        className="opacity-100"
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                        ) : (
                            <Text className="text-red-500 text-base font-sans-medium">Delete my account</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>


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
}