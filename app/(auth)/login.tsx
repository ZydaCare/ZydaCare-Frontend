import { Images } from '@/assets/Images';
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
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login, isLoading, error } = useAuth();

    const Required = () => {
        if (!email || !password) {
            return true;
        }
        return false;
    };

    const handleLogin = async () => {
        if (Required()) {
            return;
        }
        
        try {
            setLoading(true);
            const response = await login({ email, password });
            
            // Clear form on successful login
            setEmail('');
            setPassword('');
            
            // Navigate based on user role
            if (response?.user?.role === 'doctor') {
                router.replace('/(doctor)/(tabs)/home');
            } else {
                // Default to patient route if role is not specified or is patient
                router.replace('/(patient)/(tabs)/home');
            }
        } catch (error) {
            // Error is already handled in the auth context
            console.error('Login error:', error);
        } finally {
            setLoading(false);
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
                    {/* Logo and Heartbeat */}
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
                            className="w-full h-12 px-4 bg-white rounded-lg border border-gray-200"
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
                                className="w-full h-12 px-4 pr-12 bg-white rounded-lg border border-gray-200"
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

                    {/* Error Message */}
                    {error && (
                        <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                            <Text className="text-red-600 text-sm font-sans">{error}</Text>
                        </View>
                    )}

                    {/* Login Button */}
                    <TouchableOpacity
                        className="w-full h-12 rounded-full items-center justify-center mb-6 bg-secondary"
                        onPress={handleLogin}
                        disabled={loading || Required()}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text className="text-white text-base font-sans-semibold">Login</Text>
                        )}
                    </TouchableOpacity>

                    {/* Sign Up */}
                    <View className="flex-row justify-center items-center">
                        <Text className="text-gray-600 text-sm font-sans-medium">Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                            <Text className="text-primary text-sm font-sans-semibold">Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}