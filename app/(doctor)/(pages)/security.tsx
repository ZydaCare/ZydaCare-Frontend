import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { isBiometricAvailable, isBiometricEnabled } from '@/utils/biometricAuth';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function SecuritySettings() {
    const router = useRouter();
    const { updatePassword } = useAuth();
    const { showToast } = useToast();

    // State for password update form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    // State for toggles
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [pushNotifications, setPushNotifications] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [biometricAvailable, setBiometricAvailable] = useState(false);


    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showToast('Password must be at least 8 characters', 'error');
            return;
        }

        setIsUpdating(true);
        try {
            const result = await updatePassword(currentPassword, newPassword);
            if (result.success) {
                showToast('Password updated successfully', 'success');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                showToast(result.message || 'Failed to update password', 'error');
            }
        } catch (error: any) {
            showToast(error.message || 'An error occurred', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', onPress: () => router.replace('/(auth)/login'), style: 'destructive' },
            ]
        );
    };

    useEffect(() => {
        const init = async () => {
            console.log('Initializing biometric settings...');
            await checkBiometricAvailability();
            console.log('After checkBiometricAvailability - available:', biometricAvailable, 'enabled:', biometricEnabled);
        };
        init();
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            console.log('Checking biometric availability...');
            const available = await isBiometricAvailable();
            console.log('isBiometricAvailable result:', available);
            setBiometricAvailable(available);

            if (available) {
                const enabled = await isBiometricEnabled();
                console.log('isBiometricEnabled result:', enabled);
                setBiometricEnabled(enabled);

                // Debug: Check what's actually stored
                const [storedEnabled, storedEmail] = await Promise.all([
                    SecureStore.getItemAsync('biometric_enabled'),
                    SecureStore.getItemAsync('biometric_email')
                ]);
                console.log('Stored values - enabled:', storedEnabled, 'email:', storedEmail);
            }
        } catch (error) {
            console.error('Error checking biometric availability:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const { doctorProfile } = useAuth();

    const handleBiometricToggle = async (value: boolean) => {
        console.log('Toggling biometric to:', value);
        if (value) {
            // If enabling biometrics, authenticate first
            try {
                console.log('Starting biometric authentication...');
                const success = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Authenticate to enable biometric login',
                    fallbackLabel: 'Enter password',
                    disableDeviceFallback: false,
                });
                console.log('Biometric authentication result:', success);

                if (success) {
                    // Get user credentials from auth context
                    if (doctorProfile?.email) {
                        console.log('Saving biometric settings for email:', doctorProfile.email);
                        // Save the biometric setting
                        await SecureStore.setItemAsync('biometric_enabled', 'true');
                        // Save the email for biometric login
                        await SecureStore.setItemAsync('biometric_email', doctorProfile.email);

                        // Update local state
                        setBiometricEnabled(true);
                        console.log('Biometric settings saved successfully');
                        showToast('Biometric login has been enabled', 'success');

                        // Verify the values were saved
                        const [savedEnabled, savedEmail] = await Promise.all([
                            SecureStore.getItemAsync('biometric_enabled'),
                            SecureStore.getItemAsync('biometric_email')
                        ]);
                        console.log('Verified saved values - enabled:', savedEnabled, 'email:', savedEmail);
                    } else {
                        console.error('User email not found in auth context');
                        throw new Error('User email not found');
                    }
                }
                console.log('Biometric authentication successful');
            } catch (error) {
                console.error('Biometric authentication error:', error);
                showToast('Failed to enable biometric authentication', 'error');
                // Make sure to update the switch state if there was an error
                setBiometricEnabled(false);
            }
        } else {
            // If disabling, update the state and clear saved data
            try {
                // First clear the stored values
                await Promise.all([
                    SecureStore.deleteItemAsync('biometric_enabled'),
                    SecureStore.deleteItemAsync('biometric_email')
                ]);
                console.log('Biometric credentials cleared from storage');

                // Then update the UI state
                setBiometricEnabled(false);
                showToast('Biometric login has been disabled', 'success');

                // Verify the values were cleared
                const [savedEnabled, savedEmail] = await Promise.all([
                    SecureStore.getItemAsync('biometric_enabled'),
                    SecureStore.getItemAsync('biometric_email')
                ]);
                console.log('Verified biometric disabled - enabled:', savedEnabled, 'email:', savedEmail);
            } catch (error) {
                console.error('Error disabling biometric:', error);
                showToast('Failed to disable biometric authentication', 'error');
                // Reset the switch to previous state if there was an error
                setBiometricEnabled(true);
            }
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="flex-1">
                <View className="px-4 py-6">
                    {/* Header */}
                    <View className="flex-row items-center mb-6">
                        <TouchableOpacity onPress={() => router.back()} className="mr-4">
                            <Ionicons name="arrow-back" size={24} color="#1F2937" />
                        </TouchableOpacity>
                        <Text className="text-2xl font-sans-bold text-gray-900">Security & Privacy</Text>
                    </View>

                    {/* Password Update Section */}
                    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
                        <Text className="text-lg font-sans-semibold text-gray-900 mb-4">Change Password</Text>

                        <View className="mb-4">
                            <Text className="text-sm font-sans-medium text-gray-700 mb-1">Current Password</Text>
                            <View className="flex-row items-center border border-gray-200 rounded-lg px-3 py-1">
                                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" className="mr-2" />
                                <TextInput
                                    secureTextEntry
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Enter current password"
                                    className="flex-1 text-gray-900 font-sans-medium"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-sans-medium text-gray-700 mb-1">New Password</Text>
                            <View className="flex-row items-center border border-gray-200 rounded-lg px-3 py-1">
                                <Ionicons name="key-outline" size={20} color="#6B7280" className="mr-2" />
                                <TextInput
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter new password"
                                    className="flex-1 text-gray-900 font-sans-medium"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <View className="mb-4">
                            <Text className="text-sm font-sans-medium text-gray-700 mb-1">Confirm New Password</Text>
                            <View className="flex-row items-center border border-gray-200 rounded-lg px-3 py-1">
                                <Ionicons name="key-outline" size={20} color="#6B7280" className="mr-2" />
                                <TextInput
                                    secureTextEntry
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm new password"
                                    className="flex-1 text-gray-900 font-sans-medium"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleUpdatePassword}
                            disabled={isUpdating}
                            className={`py-3 rounded-lg items-center ${isUpdating ? 'bg-primary/70' : 'bg-primary'}`}
                        >
                            {isUpdating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-sans-medium">Update Password</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Security Features */}
                    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
                        <Text className="text-lg font-sans-semibold text-gray-900 mb-4">Security Features</Text>

                        <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
                            <View className="flex-1">
                                <Text className="font-sans-medium text-gray-900">Biometric Authentication</Text>
                                <Text className="text-sm font-sans text-gray-500">Use fingerprint or face ID to log in</Text>
                            </View>
                            <Switch
                                value={biometricEnabled}
                                onValueChange={handleBiometricToggle}
                                trackColor={{ false: '#E5E7EB', true: '#67A9AF' }}
                                thumbColor="white"
                            />
                        </View>

                        <View className="flex-row justify-between items-center py-3">
                            <View className="flex-1">
                                <Text className="font-sans-medium text-gray-900">Push Notifications</Text>
                                <Text className="text-sm font-sans text-gray-500">Get updates about your account</Text>
                            </View>
                            <Switch
                                value={pushNotifications}
                                onValueChange={setPushNotifications}
                                trackColor={{ false: '#E5E7EB', true: '#67A9AF' }}
                                thumbColor="white"
                            />
                        </View>
                    </View>

                    {/* Privacy Settings */}
                    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
                        <Text className="text-lg font-sans-semibold text-gray-900 mb-4">Privacy</Text>

                        <TouchableOpacity className="py-3 flex-row justify-between items-center border-b border-gray-100" onPress={() => router.push('/(policy)/privacyPolicy')}>
                            <Text className="text-gray-900 font-sans">Privacy Policy</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        <TouchableOpacity className="py-3 flex-row justify-between items-center" onPress={() => router.push('/(policy)/terms&Condition')}>
                            <Text className="text-gray-900 font-sans">Terms of Service</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* <TouchableOpacity className="py-3 flex-row justify-between items-center">
                            <Text className="text-gray-900 font-sans">Data & Privacy</Text>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity> */}
                    </View>

                    {/* Version Info */}
                    <Text className="text-center font-sans-medium text-gray-400 text-sm">
                        ZydaCare v1.0.0
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};