import { Images } from '@/assets/Images';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Alert
} from 'react-native';

export default function NewPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { resetPassword, clearError } = useAuth();
    const { email, otp } = useLocalSearchParams<{ email?: string; otp?: string }>();

    useEffect(() => {
        clearError();
        
        // Validate that we have the required parameters
        if (!email || !otp) {
            console.error('Missing email or OTP in URL parameters');
            Alert.alert(
                'Error', 
                'Missing required information. Please start the password reset process again.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(auth)/forgotPassword')
                    }
                ]
            );
        }
    }, []);

    const validatePassword = (password: string) => {
        if (password.length < 8) return 'Password must be at least 8 characters long';
        if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
        if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
        return '';
    };

    const isFormValid = () => {
        return newPassword && 
               confirmPassword && 
               newPassword === confirmPassword && 
               newPassword.length >= 8 &&
               /[A-Z]/.test(newPassword) &&
               /[0-9]/.test(newPassword);
    };

    const handleContinue = async () => {
        // Clear any previous errors
        setError('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        // Validate password strength
        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        // Check for required parameters
        if (!email || !otp) {
            console.error('Missing email or OTP in URL parameters');
            Alert.alert(
                'Error', 
                'Missing required information. Please start the password reset process again.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(auth)/forgotPassword')
                    }
                ]
            );
            return;
        }

        setLoading(true);

        try {
            console.log('Resetting password with email:', email);
            
            // Single API call to reset password with OTP verification
            await resetPassword({
                email,
                otp,
                password: newPassword,
            });

            // Show success message and redirect
            router.replace('/(auth)/login');
        } catch (error: any) {
            console.error('Password reset error:', error);
            const errorMessage = error?.message || 'Failed to reset password. Please try again.';
            setError(errorMessage);
            
            // If OTP is invalid or expired, redirect back to forgot password
            if (errorMessage.toLowerCase().includes('invalid otp') || 
                errorMessage.toLowerCase().includes('expired')) {
                Alert.alert(
                    'OTP Error',
                    'Your OTP is invalid or has expired. Please request a new one.',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/(auth)/forgotPassword')
                        }
                    ]
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 px-6 justify-center">
                    {/* Logo and Branding */}
                    <View className="items-center mt-8 mb-16">
                        <Image source={Images.LogoIcon} className="w-[150px] h-[150px]" />
                    </View>

                    <View>
                        {/* Title */}
                        <Text className="text-black text-[22px] font-sans-semibold text-center mb-4">
                            Create New Password
                        </Text>

                        {/* Subtitle */}
                        <Text className="text-gray-600 text-center mb-12 leading-relaxed font-sans">
                            Your new password must be different{'\n'}from previously used password
                        </Text>

                        {/* New Password Input */}
                        <View className="mb-6">
                            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                                <TextInput
                                    className="flex-1 ml-3 mr-3 text-gray-700"
                                    placeholder="New Password"
                                    placeholderTextColor="#9ca3af"
                                    value={newPassword}
                                    onChangeText={(text) => {
                                        setNewPassword(text);
                                        setError(''); // Clear error when user types
                                    }}
                                    secureTextEntry={!showNewPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Ionicons
                                        name={showNewPassword ? "eye" : "eye-off"}
                                        size={20}
                                        color="#6b7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password Input */}
                        <View className="mb-6">
                            <View className="flex-row items-center bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                                <Ionicons name="lock-closed-outline" size={20} color="#6b7280" />
                                <TextInput
                                    className="flex-1 ml-3 mr-3 text-gray-700"
                                    placeholder="Confirm Password"
                                    placeholderTextColor="#9ca3af"
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        setError(''); // Clear error when user types
                                    }}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye" : "eye-off"}
                                        size={20}
                                        color="#6b7280"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View className="mb-4">
                                <Text className="text-red-500 text-sm text-center">{error}</Text>
                            </View>
                        )}

                        {/* Password Requirements */}
                        <View className="mb-16">
                            <Text className="text-gray-600 text-sm mb-3">Password must contain:</Text>
                            <View className="space-y-2">
                                <View className="flex-row items-center">
                                    <View className={`w-4 h-4 rounded-full mr-3 items-center justify-center ${newPassword.length >= 8 ? 'bg-primary' : 'bg-gray-300'}`}>
                                        {newPassword.length >= 8 && <Ionicons name="checkmark" size={10} color="white" />}
                                    </View>
                                    <Text className={`text-sm ${newPassword.length >= 8 ? 'text-primary' : 'text-gray-500'}`}>
                                        At least 8 characters
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className={`w-4 h-4 rounded-full mr-3 items-center justify-center ${/[A-Z]/.test(newPassword) ? 'bg-primary' : 'bg-gray-300'}`}>
                                        {/[A-Z]/.test(newPassword) && <Ionicons name="checkmark" size={10} color="white" />}
                                    </View>
                                    <Text className={`text-sm ${/[A-Z]/.test(newPassword) ? 'text-primary' : 'text-gray-500'}`}>
                                        One uppercase letter
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className={`w-4 h-4 rounded-full mr-3 items-center justify-center ${/[0-9]/.test(newPassword) ? 'bg-primary' : 'bg-gray-300'}`}>
                                        {/[0-9]/.test(newPassword) && <Ionicons name="checkmark" size={10} color="white" />}
                                    </View>
                                    <Text className={`text-sm ${/[0-9]/.test(newPassword) ? 'text-primary' : 'text-gray-500'}`}>
                                        One number
                                    </Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className={`w-4 h-4 rounded-full mr-3 items-center justify-center ${newPassword === confirmPassword && confirmPassword.length > 0 ? 'bg-primary' : 'bg-gray-300'}`}>
                                        {newPassword === confirmPassword && confirmPassword.length > 0 && <Ionicons name="checkmark" size={10} color="white" />}
                                    </View>
                                    <Text className={`text-sm ${newPassword === confirmPassword && confirmPassword.length > 0 ? 'text-primary' : 'text-gray-500'}`}>
                                        Passwords match
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Continue Button */}
                        <TouchableOpacity
                            className={`rounded-full py-4 items-center justify-center mb-8 ${isFormValid() ? 'bg-secondary' : 'bg-gray-300'}`}
                            onPress={handleContinue}
                            disabled={!isFormValid() || loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className={`text-base font-semibold ${isFormValid() ? 'text-white' : 'text-gray-500'}`}>
                                    Reset Password
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}