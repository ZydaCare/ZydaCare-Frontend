import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, StatusBar, Switch, ScrollView, Alert } from 'react-native';
import { Feather, Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { isBiometricAvailable, isBiometricEnabled, setBiometricEnabled, authenticateBiometric } from '@/utils/biometricAuth';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';

export default function SecuritySettingsScreen() {
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [appLockEnabled, setAppLockEnabled] = useState(true);
    const [showSecurityAlerts, setShowSecurityAlerts] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const { showToast } = useToast();

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

    const { user } = useAuth();

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
                    if (user?.email) {
                        console.log('Saving biometric settings for email:', user.email);
                        // Save the biometric setting
                        await SecureStore.setItemAsync('biometric_enabled', 'true');
                        // Save the email for biometric login
                        await SecureStore.setItemAsync('biometric_email', user.email);

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

    const SecurityItem = ({
        icon,
        title,
        description,
        onPress,
        showSwitch = false,
        switchValue = false,
        onSwitchChange = () => { },
        iconColor = '#6B7280',
        iconBg = '#F8F8F8',
        lastItem = false
    }: {
        icon: React.ReactNode;
        title: string;
        description?: string;
        onPress?: () => void;
        showSwitch?: boolean;
        switchValue?: boolean;
        onSwitchChange?: (value: boolean) => void;
        iconColor?: string;
        iconBg?: string;
        lastItem?: boolean;
    }) => (
        <TouchableOpacity
            className={`flex-row items-center px-4 py-5 ${!lastItem ? 'border-b border-gray-100' : ''}`}
            onPress={onPress}
            activeOpacity={0.7}
            disabled={!onPress}
        >
            <View className="mr-4" style={{ backgroundColor: iconBg, borderRadius: 50, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-gray-900 font-sans-semibold text-base">{title}</Text>
                {description && (
                    <Text className="text-gray-500 font-sans text-sm mt-1">{description}</Text>
                )}
            </View>
            {showSwitch ? (
                <Switch
                    value={switchValue}
                    onValueChange={onSwitchChange}
                    trackColor={{ false: '#E5E7EB', true: '#67A9AF' }}
                    thumbColor="white"
                    onTouchStart={(e) => e.stopPropagation()}
                />
            ) : (
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center p-4 border-b border-gray-100 bg-white pt-8">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <Ionicons name="chevron-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl flex-1 text-center font-sans-bold text-gray-900">Security</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView className="flex-1">
                {/* Account Security */}
                <View className="bg-white rounded-lg mx-4 mt-6 overflow-hidden">
                    <Text className="text-gray-500 font-sans-medium text-xs px-4 pt-4 pb-2">ACCOUNT SECURITY</Text>

                    <TouchableOpacity
                        onPress={() => router.push('/change-password')}
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center px-4 py-5 border-b border-gray-100">
                            <View className="mr-4" style={{ backgroundColor: '#F3E8FF', borderRadius: 50, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                                <Ionicons name="key-outline" size={20} color="#7C3AED" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-sans-semibold text-base">Change Password</Text>
                                <Text className="text-gray-500 font-sans text-sm mt-1">Update your password regularly</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </View>
                    </TouchableOpacity>

                    <SecurityItem
                        icon={<MaterialIcons name="security" size={20} color="#10B981" />}
                        title="Two-Factor Authentication"
                        description="Add an extra layer of security"
                        showSwitch
                        switchValue={twoFactorEnabled}
                        onSwitchChange={setTwoFactorEnabled}
                        iconBg="#D1FAE5"
                    />

                    {biometricAvailable && (
                        <SecurityItem
                            icon={<Ionicons name="finger-print" size={20} color="#3B82F6" />}
                            title="Biometric Login"
                            description="Use your fingerprint or face to log in"
                            showSwitch
                            switchValue={biometricEnabled}
                            onSwitchChange={handleBiometricToggle}
                            iconBg="#DBEAFE"
                        />
                    )}
                </View>

                {/* App Security */}
                <View className="bg-white rounded-lg mx-4 mt-4 mb-8 overflow-hidden">
                    <Text className="text-gray-500 font-sans-medium text-xs px-4 pt-4 pb-2">APP SECURITY</Text>

                    <SecurityItem
                        icon={<MaterialCommunityIcons name="lock" size={20} color="#F59E0B" />}
                        title="App Lock"
                        description="Require PIN/Pattern to open the app"
                        showSwitch
                        switchValue={appLockEnabled}
                        onSwitchChange={setAppLockEnabled}
                        iconBg="#FEF3C7"
                    />

                    <SecurityItem
                        icon={<Ionicons name="notifications" size={20} color="#EC4899" />}
                        title="Security Alerts"
                        description="Get notified about security events"
                        showSwitch
                        switchValue={showSecurityAlerts}
                        onSwitchChange={setShowSecurityAlerts}
                        iconBg="#FCE7F3"
                        lastItem
                    />
                </View>

                {/* Security Tips */}
                <View className="bg-blue-50 mx-4 p-4 rounded-lg mb-8">
                    <View className="flex-row items-start">
                        <Ionicons name="shield-checkmark" size={20} color="#3B82F6" style={{ marginTop: 2 }} />
                        <View className="ml-3 flex-1">
                            <Text className="text-blue-800 font-sans-semibold text-base">Security Tips</Text>
                            <Text className="text-blue-700 font-sans text-sm mt-1">
                                Always keep your app updated to the latest version for the best security features and protection.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}