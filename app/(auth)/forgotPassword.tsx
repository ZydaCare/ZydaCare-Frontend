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
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Images } from '@/assets/Images';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/authContext';

// Forgot Password Screen Component
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
        if (Required()) {
            return;
        }
        
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return;
        }

        try {
            setLoading(true);
            await forgotPassword(email);
            
            router.push({
                pathname: '/(auth)/otp',
                params: { 
                    flow: 'forgotPassword',
                    email: email.trim().toLowerCase()
                }
            });
        } catch (error) {
            console.error('Forgot password error:', error);
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
                <View className="flex-1 px-6">
                    {/* Logo and Branding */}
                    <View className="items-center mt-16 mb-16">
                        <Image source={Images.LogoIcon} className="w-[150px] h-[150px]" />
                    </View>

                    <View>
                        {/* Title */}
                        <Text className="text-black text-[22px] font-sans-bold text-center mb-4">
                            Forgot Password?
                        </Text>

                        {/* Subtitle */}
                        <Text className="text-gray-600 text-center mb-12 leading-relaxed font-sans">
                            Forgot password? Quickly reset{'\n'}your password
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

                        {/* Continue Button */}
                        <TouchableOpacity
                            className="bg-secondary rounded-full py-4 items-center justify-center mb-8"
                            onPress={handleContinue}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-white text-base font-sans-semibold">Continue</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};