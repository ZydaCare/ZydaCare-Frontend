import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';

export default function VerifyOtp() {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const { email, purpose } = useLocalSearchParams<{ email?: string; purpose?: string }>();
    const { verifyOtp, resendOtp, error } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        if (!email || !purpose) {
            showToast('Missing required information', 'error');
            router.back();
            return;
        }

        // Start countdown for resend button
        startCountdown();
    }, [email, purpose]);

    const startCountdown = () => {
        setCountdown(60);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');

        if (otpString.length !== 6) {
            showToast('Please enter the complete 6-digit OTP', 'error');
            return;
        }

        if (!email || !purpose) {
            showToast('Missing required information', 'error');
            return;
        }

        try {
            setLoading(true);
            const response = await verifyOtp({
                email,
                otp: otpString,
                purpose: purpose as 'email_verification' | 'password_reset'
            });

            if (response.success) {
                if (purpose === 'email_verification') {
                    showToast('Your email has been verified successfully', 'success');
                    router.replace('/(auth)/login');
                } else if (purpose === 'password_reset') {
                    router.push({
                        pathname: '/(auth)/newPassword',
                        params: { email, otp: otpString }
                    });
                    showToast('You can now reset your password', 'success');
                }
            }
        } catch (error: any) {
            console.error('OTP verification error:', error);
            showToast(error.message || 'Invalid OTP. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!email || !purpose) {
            showToast('Missing required information', 'error');
            return;
        }

        try {
            setResendLoading(true);
            const response = await resendOtp({
                email,
                purpose: purpose as 'email_verification' | 'password_reset'
            });

            if (response.success) {
                showToast('OTP has been resent to your email', 'success');
                startCountdown();
            }
        } catch (error: any) {
            console.error('Resend OTP error:', error);
            showToast(error.message || 'Failed to resend OTP', 'error');
        } finally {
            setResendLoading(false);
        }
    };

    const getTitle = () => {
        switch (purpose) {
            case 'email_verification':
                return 'Verify Email';
            case 'password_reset':
                return 'Verify OTP';
            default:
                return 'Verify OTP';
        }
    };

    const getSubtitle = () => {
        switch (purpose) {
            case 'email_verification':
                return `Enter the 6-digit code sent to ${email}`;
            case 'password_reset':
                return `Enter the 6-digit code sent to ${email} to reset your password`;
            default:
                return `Enter the 6-digit code sent to ${email}`;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 px-6">
                    {/* Header */}
                    <View className="items-center mt-16 mb-8">
                        <View className="w-16 h-16 bg-primary rounded-full items-center justify-center mb-4">
                            <Ionicons name="mail" size={32} color="white" />
                        </View>
                        <Text className="text-black font-sans-semibold text-[24px] text-center mb-2">
                            {getTitle()}
                        </Text>
                        <Text className="text-gray-600 text-sm font-sans text-center">
                            {getSubtitle()}
                        </Text>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <Text className="text-red-600 text-sm font-sans">{error}</Text>
                        </View>
                    )}

                    {/* OTP Input */}
                    <View className="mb-8">
                        <View className="flex-row justify-between mb-4">
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref) => (inputRefs.current[index] = ref)}
                                    className="w-12 h-12 bg-white rounded-lg border border-gray-200 text-center text-lg font-sans-semibold"
                                    value={digit}
                                    onChangeText={(value) => handleOtpChange(value, index)}
                                    onKeyPress={(e) => handleKeyPress(e, index)}
                                    keyboardType="numeric"
                                    maxLength={1}
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        {/* Resend OTP */}
                        <View className="items-center">
                            <TouchableOpacity
                                onPress={handleResendOtp}
                                disabled={resendLoading || countdown > 0}
                                className={`${resendLoading || countdown > 0
                                        ? 'opacity-50'
                                        : ''
                                    }`}
                            >
                                {resendLoading ? (
                                    <ActivityIndicator size="small" color="#1e40af" />
                                ) : countdown > 0 ? (
                                    <Text className="text-gray-500 text-sm font-sans">
                                        Resend OTP in {countdown}s
                                    </Text>
                                ) : (
                                    <Text className="text-primary text-sm font-sans-semibold">
                                        Didn't receive the code? Resend
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Verify Button */}
                    <TouchableOpacity
                        className="w-full h-12 rounded-full items-center justify-center mb-6 bg-secondary"
                        onPress={handleVerifyOtp}
                        disabled={loading || otp.join('').length !== 6}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text className="text-white text-base font-sans-semibold">Verify</Text>
                        )}
                    </TouchableOpacity>

                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="items-center"
                    >
                        <Text className="text-gray-600 text-sm font-sans">Back</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
