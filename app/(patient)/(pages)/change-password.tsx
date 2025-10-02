import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { ScrollView } from 'react-native';
import { useToast } from '@/components/ui/Toast';

export default function ChangePasswordScreen() {
    const { updatePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { showToast } = useToast();

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            setIsLoading(true);
            const response = await updatePassword(currentPassword, newPassword);
            
            if (response.success) {
                showToast('Password updated successfully', 'success');
                router.back();
            } else {
                showToast(response.message || 'Failed to update password', 'error');
            }
        } catch (error) {
            console.error('Change password error:', error);
            showToast(error as string || 'Failed to update password', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center p-4 border-b border-gray-100 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="chevron-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl flex-1 text-center font-sans-bold text-gray-900">Change Password</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1 px-4 pt-6">
                <View className="bg-white rounded-xl p-4 mb-6">
                    <Text className="text-gray-500 text-sm font-sans-medium mb-1">Current Password</Text>
                    <View className="flex-row items-center border border-gray-200 rounded-lg px-3 h-12">
                        <TextInput
                            className="flex-1 font-sans text-gray-900"
                            secureTextEntry={!showCurrentPassword}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            placeholder="Enter current password"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                            <Ionicons 
                                name={showCurrentPassword ? 'eye-off' : 'eye'} 
                                size={20} 
                                color="#6B7280" 
                            />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-gray-500 text-sm font-sans-medium mt-4 mb-1">New Password</Text>
                    <View className="flex-row items-center border border-gray-200 rounded-lg px-3 h-12">
                        <TextInput
                            className="flex-1 font-sans text-gray-900"
                            secureTextEntry={!showNewPassword}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Enter new password"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                            <Ionicons 
                                name={showNewPassword ? 'eye-off' : 'eye'} 
                                size={20} 
                                color="#6B7280" 
                            />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-gray-500 text-sm font-sans-medium mt-4 mb-1">Confirm New Password</Text>
                    <View className="flex-row items-center border border-gray-200 rounded-lg px-3 h-12">
                        <TextInput
                            className="flex-1 font-sans text-gray-900"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm new password"
                            placeholderTextColor="#9CA3AF"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons 
                                name={showConfirmPassword ? 'eye-off' : 'eye'} 
                                size={20} 
                                color="#6B7280" 
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        className="bg-secondary rounded-full py-3 mt-6 items-center justify-center"
                        onPress={handleChangePassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-sans-semibold text-base">
                                Update Password
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="bg-blue-50 p-4 rounded-lg mb-8">
                    <Text className="text-blue-800 font-sans-semibold text-base mb-2">Password Requirements</Text>
                    <View className="flex-row items-start mb-1">
                        <Ionicons name="checkmark-circle" size={16} color={newPassword.length >= 6 ? '#10B981' : '#9CA3AF'} style={{ marginTop: 2, marginRight: 8 }} />
                        <Text className="text-blue-700 font-sans text-sm">At least 6 characters</Text>
                    </View>
                    <View className="flex-row items-start">
                        <Ionicons name="checkmark-circle" size={16} color={newPassword && newPassword === confirmPassword ? '#10B981' : '#9CA3AF'} style={{ marginTop: 2, marginRight: 8 }} />
                        <Text className="text-blue-700 font-sans text-sm">Passwords must match</Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
