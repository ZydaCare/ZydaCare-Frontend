import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function SecuritySettingsScreen() {
    return (
        <View className="flex-1 bg-gray-50 p-4">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="bg-white rounded-full p-2 shadow-sm">
                    <Ionicons name="chevron-back" size={20} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl flex-1 text-center mr-8 font-sans-bold">Security Settings</Text>
            </View>

            {/* Menu Items */}
            <View className=' px-4'>
                <View className="bg-white rounded-[10px] mt-4">
                    {/* Change Password */}
                    <TouchableOpacity className="flex-row items-center px-4 py-5">
                        <View className="mr-4 bg-[#F8F8F8] rounded-full p-2">
                            <Ionicons name="key-outline" size={22} color="#6B7280" />
                        </View>
                        <Text className="flex-1 text-gray-900 font-sans-semibold text-base">Change Password</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* 2fa Authentication */}
                    <TouchableOpacity className="flex-row items-center px-4 py-4">
                        <View className="mr-4 bg-[#F8F8F8] rounded-full p-2">
                            <Ionicons name="key-outline" size={22} color="#6B7280" />
                        </View>
                        <Text className="flex-1 text-gray-900 font-sans-semibold text-base">2fa Authentication</Text>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}