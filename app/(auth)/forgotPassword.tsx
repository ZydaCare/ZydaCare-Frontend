import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Images } from '@/assets/Images';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { ScrollView } from 'react-native';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const { forgotPassword, error, clearError } = useAuth();
    const { email: paramEmail } = useLocalSearchParams<{ email?: string }>();

    useEffect(() => {
        if (paramEmail) {
            setEmail(paramEmail);
        }
        clearError();
    }, []);

    const Required = () => !email.trim();

    const handleContinue = async () => {
        if (Required()) return;
        if (!/^\S+@\S+\.\S+$/.test(email)) return;

        try {
            setLoading(true);
            await forgotPassword({ email });

            router.push({
                pathname: '/(auth)/otp',
                params: {
                    flow: 'forgotPassword',
                    email: email.trim().toLowerCase(),
                },
            });
        } catch (error) {
            console.error('Forgot password error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

            {/* Dismiss keyboard on tap outside */}
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
                            <View className="items-center mt-20 mb-[20%]">
                                <Image source={Images.LogoIcon} className="w-[200px] h-[200px]" />
                            </View>

                            {/* Title */}
                            <Text className="text-black text-[22px] font-sans-bold text-center mb-2">
                                Forgot Password?
                            </Text>

                            {/* Subtitle */}
                            <Text className="text-gray-600 text-center mb-10 leading-relaxed font-sans">
                                Forgot password? Quickly reset your password
                            </Text>

                            {/* Email Input */}
                            <View className="mb-8">
                                <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
                                    <Ionicons name="mail-outline" size={20} color="#6b7280" />
                                    <TextInput
                                        className="flex-1 ml-3 text-gray-700"
                                        placeholder="Enter your email"
                                        placeholderTextColor="#9ca3af"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            {/* Error */}
                            {error && (
                                <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                    <Text className="text-red-600 text-sm font-sans">{error}</Text>
                                </View>
                            )}

                            {/* Continue Button */}
                            <TouchableOpacity
                                className="w-full h-12 rounded-full items-center justify-center mb-6 bg-secondary"
                                onPress={handleContinue}
                                disabled={loading || Required()}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white text-base font-sans-semibold">Continue</Text>
                                )}
                            </TouchableOpacity>

                            {/* Back to Login */}
                            <View className="flex-row justify-center items-center mb-8">
                                <Text className="text-gray-600 text-sm font-sans-medium">
                                    Remembered your password?{' '}
                                </Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                    <Text className="text-primary text-sm font-sans-semibold">Login</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}
