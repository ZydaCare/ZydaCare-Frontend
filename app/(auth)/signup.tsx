import { Images } from '@/assets/Images';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
    Alert,
} from 'react-native';

export default function Signup() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const { showToast } = useToast();

    const validateForm = () => {
        if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
            showToast('All fields are required', 'error');
            return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            showToast('Please enter a valid email address', 'error');
            return false;
        }
        if (password.length < 8) {
            showToast('Password must be at least 8 characters long', 'error');
            return false;
        }
        return true;
    };

    const handleSignup = async () => {
        if (!validateForm()) return;
        try {
            setLoading(true);
            await register({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.toLowerCase().trim(),
                password,
                role: 'patient',
            });

            router.push({
                pathname: '/(auth)/otp',
                params: { flow: 'signup', email: email.toLowerCase().trim() },
            });
        } catch (error: any) {
            console.error('Signup error:', error);
            showToast(error?.message || 'Failed to create account. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

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
                            <View className="items-center mb-[15%]">
                                <Image source={Images.LogoIcon} className="w-[250px] h-[250px]" />
                            </View>

                            {/* Title */}
                            <Text className="text-black font-sans-semibold text-[24px] text-center mb-8">
                                Create Account
                            </Text>

                            {/* First Name */}
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

                            {/* Last Name */}
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

                            {/* Email */}
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

                            {/* Password */}
                            <View className="mb-4">
                                <Text className="text-gray-700 text-sm font-sans-medium mb-2">Password</Text>
                                <View className="relative">
                                    <TextInput
                                        className="w-full h-12 px-4 pr-12 bg-white rounded-lg border border-gray-200 text-gray-700"
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

                            {/* Password Hint */}
                            <Text className="text-gray-600 text-xs mb-6">
                                Password must be at least 8 characters long
                            </Text>

                            {/* Signup Button */}
                            <TouchableOpacity
                                className="w-full h-12 rounded-full items-center justify-center mb-6 bg-secondary"
                                onPress={handleSignup}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text className="text-white text-base font-sans-semibold">Create Account</Text>
                                )}
                            </TouchableOpacity>

                            {/* Sign In Link */}
                            <View className="flex-row justify-center items-center mb-8">
                                <Text className="text-gray-600 text-sm font-sans-medium">Already have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                                    <Text className="text-primary text-sm font-sans-semibold">Sign In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    );
}
