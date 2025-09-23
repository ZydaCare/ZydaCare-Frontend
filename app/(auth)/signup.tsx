import React, { useState } from 'react';
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
import { router } from 'expo-router';
import { ScrollView } from 'react-native';
import { useAuth } from '@/context/authContext';

export default function Signup() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register, isLoading, error, clearError } = useAuth();

    React.useEffect(() => {
        clearError();
    }, []);

    const validateForm = () => {
        if (!firstName.trim()) {
            Alert.alert('Error', 'Please enter your first name');
            return false;
        }
        if (!lastName.trim()) {
            Alert.alert('Error', 'Please enter your last name');
            return false;
        }
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email');
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }
        if (!password) {
            Alert.alert('Error', 'Please enter a password');
            return false;
        }
        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters long');
            return false;
        }
        return true;
    };

    const handleCreateAccount = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            clearError();

            await register({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.toLowerCase().trim(),
                password,
                role: 'patient',
            });
            
            // Navigate to OTP screen with email and flow type
            router.push({
                pathname: '/(auth)/otp',
                params: { 
                    flow: 'signup',
                    email: email.toLowerCase().trim()
                }
            });

        } catch (error: any) {
            console.error('Error creating account:', error);
            const errorMessage = error?.message || 'Failed to create account. Please try again.';
            Alert.alert('Registration Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView>
                <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <View className="flex-1 px-6">
                        {/* Logo and Heartbeat */}
                        <View className="items-center mt-12 mb-18">
                            <Image source={Images.LogoIcon} className="w-[250px] h-[250px]" />
                        </View>

                        {/* Welcome Text */}
                        <Text className="text-black font-sans-semibold text-[24px] text-center mb-8">
                            Create Account
                        </Text>

                        {/* First Name Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 text-sm font-sans-medium mb-2">First Name</Text>
                            <TextInput
                                className="w-full h-12 px-4 bg-white rounded-lg border border-gray-200"
                                placeholder="Enter your First Name"
                                placeholderTextColor="#9ca3af"
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Last Name Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 text-sm font-sans-medium mb-2">Last Name</Text>
                            <TextInput
                                className="w-full h-12 px-4 bg-white rounded-lg border border-gray-200"
                                placeholder="Enter your Last Name"
                                placeholderTextColor="#9ca3af"
                                value={lastName}
                                onChangeText={setLastName}
                                autoCapitalize="words"
                            />
                        </View>

                        {/* Email Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 text-sm font-sans-medium mb-2">Email</Text>
                            <TextInput
                                className="w-full h-12 px-4 bg-white rounded-lg border border-gray-200"
                                placeholder="Enter your email"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        {/* Password Input */}
                        <View className="mb-4">
                            <Text className="text-gray-700 text-sm font-sans-medium mb-2">Password</Text>
                            <View className="relative">
                                <TextInput
                                    className="w-full h-12 px-4 pr-12 bg-white rounded-lg border border-gray-200"
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9ca3af"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
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

                        {/* Password Requirements */}
                        <View className="mb-4">
                            <Text className="text-gray-600 text-xs">
                                Password must be at least 8 characters long
                            </Text>
                        </View>

                        {/* Error Message */}
                        {error && (
                            <View className="mb-4">
                                <Text className="text-red-500 text-sm text-center">{error}</Text>
                            </View>
                        )}

                        {/* Signup Button */}
                        <TouchableOpacity
                            className={`w-full h-12 rounded-full items-center justify-center mb-6 mt-5 ${
                                loading ? 'bg-gray-400' : 'bg-secondary'
                            }`}
                            onPress={handleCreateAccount}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-[#fff] text-base font-sans-semibold">Create Account</Text>
                            )}
                        </TouchableOpacity>

                        {/* Sign In Link */}
                        <View className="flex-row justify-center items-center">
                            <Text className="text-gray-600 text-sm font-sans-medium">Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                <Text className="text-primary text-sm font-sans-semibold">Sign In</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Bottom Indicator */}
                        <View className="items-center mt-8">
                            <View className="w-32 h-1 bg-black rounded-full" />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </ScrollView>
        </SafeAreaView>
    );
}