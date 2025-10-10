import { Images } from '@/assets/Images';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { isBiometricAvailable, isBiometricEnabled, authenticateBiometric } from '@/utils/biometricAuth';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Keyboard,
    TouchableWithoutFeedback,
    Alert
} from 'react-native';

const CREDENTIALS_KEY = 'saved_credentials';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const { login, isLoading, error } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                // Check biometric availability first
                const available = await isBiometricAvailable();
                const enabled = available ? await isBiometricEnabled() : false;

                if (isMounted) {
                    setBiometricAvailable(available);
                    setBiometricEnabled(enabled);

                    console.log('Biometric available:', available);
                    console.log('Biometric enabled:', enabled);

                    // Only attempt biometric login if both available and enabled
                    if (available && enabled) {
                        const savedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
                        if (savedCredentials) {
                            await handleBiometricLogin();
                        }
                    }
                }
            } catch (error) {
                console.error('Initialization error:', error);
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, []);

    const checkBiometricAvailability = async () => {
        try {
            // First check if biometric is available on the device
            const available = await isBiometricAvailable();
            setBiometricAvailable(available);

            if (available) {
                // Then check if biometric is enabled for the app
                const enabled = await isBiometricEnabled();
                setBiometricEnabled(enabled);

                // If biometric is enabled, try to log in with biometrics
                if (enabled) {
                    const savedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);

                    if (savedCredentials) {
                        try {
                            // Don't set email and password in the form
                            // Just set rememberMe to indicate credentials exist
                            setRememberMe(true);

                            // Small delay to allow UI to update before showing biometric prompt
                            setTimeout(() => {
                                handleBiometricLogin();
                            }, 500);
                        } catch (error) {
                            console.error('Error parsing saved credentials:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error checking biometric:', error);
            showToast('Error checking biometric availability', 'error');
        }
    };

    const loadSavedCredentials = async () => {
        try {
            // Only load credentials if biometric is enabled
            if (biometricEnabled) {
                const jsonCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
                if (jsonCredentials) {
                    // Don't set the email and password in the form fields
                    // Just set rememberMe to true to show the checkbox is checked
                    setRememberMe(true);
                }
            }
        } catch (error) {
            console.error('Error loading saved credentials:', error);
        }
    };

    const saveCredentials = async (email: string, password: string) => {
        try {
            const credentials = JSON.stringify({ email, password });
            console.log('Saving credentials for:', email);
            await SecureStore.setItemAsync(CREDENTIALS_KEY, credentials);

            // Verify the credentials were saved
            const saved = await SecureStore.getItemAsync(CREDENTIALS_KEY);
            if (saved) {
                console.log('Successfully saved credentials');
            } else {
                console.error('Failed to verify saved credentials');
            }
        } catch (error) {
            console.error('Error saving credentials:', error);
        }
    };

    const clearCredentials = async () => {
        try {
            await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
        } catch (error) {
            console.error('Error clearing credentials:', error);
        }
    };

    const handleBiometricLogin = async () => {
        if (!biometricAvailable || !biometricEnabled) {
            console.log('Biometric not available or not enabled');
            return;
        }

        try {
            console.log('Starting biometric authentication...');
            const authenticated = await authenticateBiometric();

            if (authenticated) {
                console.log('Biometric authentication successful, retrieving credentials...');

                // Get the saved credentials directly
                const savedCredentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
                console.log('Retrieved saved credentials:', savedCredentials ? 'found' : 'not found');

                if (savedCredentials) {
                    try {
                        const credentials = JSON.parse(savedCredentials);
                        // Don't set any form fields or remember me state

                        // Proceed with login using the retrieved credentials without showing them
                        await handleLogin(true, credentials);
                        return;
                    } catch (error) {
                        console.error('Error parsing saved credentials:', error);
                    }
                }

                // If we get here, something went wrong with retrieving credentials
                console.log('No valid saved credentials found');
                showToast('No saved credentials found', 'error');

                // Clear the invalid state
                setEmail('');
                setPassword('');
                setRememberMe(false);

                // Disable biometric login since it's not working
                await SecureStore.deleteItemAsync('biometric_enabled');
                await SecureStore.deleteItemAsync('biometric_email');
                setBiometricEnabled(false);

            } else {
                // Authentication failed or was cancelled
                console.log('Biometric authentication failed or was cancelled');
                // Clear the form if biometric auth was cancelled
                setEmail('');
                setPassword('');
                setRememberMe(false);
            }
        } catch (error) {
            console.error('Biometric authentication failed:', error);
            showToast('Biometric authentication failed. Please try again.', 'error');
        }
    };

    const Required = () => !email || !password;

    const handleLogin = async (isBiometric = false, credentials?: { email: string; password: string }) => {
        // If using biometric with credentials, use those instead of the form values
        const loginEmail = credentials?.email || email;
        const loginPassword = credentials?.password || password;

        if (!isBiometric && Required()) return;

        try {
            setLoading(true);
            const result = await login({ email: loginEmail, password: loginPassword });

            // If email verification is required, we've already been redirected
            if (result?.requiresVerification) {
                return;
            }

            // Always save credentials if using biometric or remember me
            if (isBiometric || rememberMe) {
                console.log('Saving credentials for email:', loginEmail);
                await saveCredentials(loginEmail, loginPassword);

                // If this is a biometric login, ensure the email is saved for biometric
                if (isBiometric) {
                    console.log('Saving biometric email:', loginEmail);
                    await SecureStore.setItemAsync('biometric_email', loginEmail);
                }
            } else {
                // Only clear if not using biometric and remember me is off
                if (!biometricEnabled) {
                    await clearCredentials();
                }
            }

            // Clear form on successful login if not using biometric
            if (!isBiometric) {
                setEmail('');
                setPassword('');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast(error?.message || 'Failed to login. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Dismiss keyboard when tapping outside */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="flex-1">
                            {/* Logo */}
                            <View className="items-center mt-24 mb-[25%]">
                                <Image source={Images.LogoIcon} className="w-[250px] h-[250px]" />
                            </View>

                            {/* Welcome Text */}
                            <Text className="text-black font-sans-semibold text-[24px] text-center mb-8">
                                Welcome Back!
                            </Text>

                            {/* Email Input */}
                            <View className="mb-4">
                                <Text className="text-gray-700 text-sm font-sans-medium mb-2">Email</Text>
                                <TextInput
                                    className="w-full h-12 px-4 text-gray-700 font-sans-medium bg-white rounded-lg border border-gray-200"
                                    placeholder="Enter your username"
                                    placeholderTextColor="#9ca3af"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            {/* Password Input */}
                            <View className="mb-4">
                                <Text className="text-gray-700 text-sm font-sans-medium mb-2">Password</Text>
                                <View className="relative">
                                    <TextInput
                                        className="w-full h-12 px-4 pr-12 bg-white rounded-lg border border-gray-200 text-gray-700 font-sans-medium"
                                        placeholder="Enter your password"
                                        placeholderTextColor="#9ca3af"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        className="absolute right-4 top-3"
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Ionicons
                                            name={showPassword ? "eye" : "eye-off"}
                                            size={20}
                                            color="#9ca3af"
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Remember Me and Forgot Password */}
                            <View className="flex-row justify-between items-center mb-8">
                                <TouchableOpacity
                                    className="flex-row items-center"
                                    onPress={() => setRememberMe(!rememberMe)}
                                >
                                    <View className={`w-4 h-4 rounded border border-gray-300 mr-2 items-center justify-center ${rememberMe ? 'bg-primary border-primary' : 'bg-white'}`}>
                                        {rememberMe && <Ionicons name="checkmark" size={12} color="white" />}
                                    </View>
                                    <Text className="text-gray-600 text-sm font-sans">Remember me</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => router.push('/(auth)/forgotPassword')}>
                                    <Text className="text-primary text-sm font-sans-semibold">Forgot Password</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Error */}
                            {error && (
                                <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <Text className="text-red-600 text-sm font-sans">{error}</Text>
                                </View>
                            )}

                            {/* Login Button */}
                            <View className="flex-row items-center justify-between gap-3 mb-4">
                                <TouchableOpacity
                                    className="flex-1 h-12 rounded-full items-center justify-center bg-secondary"
                                    onPress={() => handleLogin()}
                                    disabled={loading || Required()}
                                    activeOpacity={0.8}
                                >
                                    {loading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text className="text-white text-base font-sans-semibold">Login</Text>
                                    )}
                                </TouchableOpacity>

                                {biometricAvailable && biometricEnabled && (
                                    <TouchableOpacity
                                        onPress={handleBiometricLogin}
                                        disabled={loading}
                                        activeOpacity={0.8}
                                        className='bg-gray-200 w-14 h-14 rounded-full items-center justify-center'
                                    >
                                        <Ionicons
                                            name="finger-print"
                                            size={35}
                                            color="#D65C1E"
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Biometric Login */}
                            {/* {biometricAvailable && biometricEnabled && (
                                <View className="mb-6">
                                    <View className="flex-row items-center my-4">
                                        <View className="flex-1 h-px bg-gray-200" />
                                        <Text className="text-gray-400 text-sm mx-4">OR</Text>
                                        <View className="flex-1 h-px bg-gray-200" />
                                    </View>

                                    <TouchableOpacity
                                        className="w-full h-14 border border-gray-200 rounded-xl items-center justify-center flex-row space-x-2"
                                        onPress={handleBiometricLogin}
                                        disabled={loading}
                                    >
                                        <Ionicons
                                            name="finger-print"
                                            size={22}
                                            color="#7C3AED"
                                        />
                                        <Text className="text-gray-900 font-sans-medium">
                                            Sign in with {LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? 'Face ID' : 'Fingerprint'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )} */}

                            {/* Sign Up */}
                            <View className="flex-row justify-center items-center mb-8">
                                <Text className="text-gray-600 text-sm font-sans-medium">Don't have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                                    <Text className="text-primary text-sm font-sans-semibold">Sign Up</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}
