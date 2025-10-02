import { Feather } from '@expo/vector-icons';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useAuth } from '@/context/authContext';
import { SafeAreaView } from 'react-native';
import { router } from 'expo-router';


export default function SupportScreen() {
    const { user } = useAuth();

    const recentIssues = [
        {
            id: '#APT-76823',
            title: 'Appointment with Dr. Sarah Johnson',
            type: 'Appointment',
            status: 'Completed',
            date: 'Completed on 14th Mar, 2025. 2:32 PM',
            statusColor: 'bg-green-500',
            icon: 'calendar'
        },
        {
            id: '#PRES-52788',
            title: 'Prescription Refill Request',
            type: 'Prescription',
            status: 'In Progress',
            date: 'Requested on 13th Mar, 2025. 11:26 AM',
            statusColor: 'bg-yellow-500',
            icon: 'file-text'
        },
        {
            id: '#BILL-45623',
            title: 'Billing Dispute',
            type: 'Billing',
            status: 'Resolved',
            date: 'Resolved on 13th Feb, 2025. 1:22 PM',
            statusColor: 'bg-blue-500',
            icon: 'credit-card'
        },
        {
            id: '#TECH-98765',
            title: 'Video Call Issue',
            type: 'Technical',
            status: 'Resolved',
            date: 'Reported on 10th Feb, 2025. 10:15 AM',
            statusColor: 'bg-blue-500',
            icon: 'video'
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" backgroundColor="#67A9AF" />

            {/* Header */}
            <View className="bg-primary pt-20 pb-8 px-6 rounded-b-3xl">
                <View className="flex-row justify-between items-center">
                    <Text className="text-white text-[25px] font-sans-semibold">
                        Hello, {user?.firstName}{'\n'}how can we help?
                    </Text>
                    <TouchableOpacity
                        className="bg-white px-5 py-3 rounded-full flex-row items-center"
                        onPress={() => router.push('/(patient)/(pages)/supportChat')}
                    >
                        <Feather name="message-circle" size={18} color="#67A9AF" />
                        <Text className="text-primary font-sans-semibold ml-2">Chats</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerClassName="pb-24">
                {/* Recent Orders Section */}
                <View className="mt-6">
                    <Text className="text-gray-400 text-base mb-4 font-sans">Recent Support Requests</Text>

                    {recentIssues.map((issue, index) => (
                        <TouchableOpacity
                            key={index}
                            className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm"
                            onPress={() => {
                                // Navigate to issue details
                                router.push('/(patient)/(pages)/supportChat');
                            }}
                        >
                            <View className="flex-row items-center mb-2">
                                <View className={`w-2.5 h-2.5 rounded-full ${issue.statusColor} mr-2`} />
                                <Text className="text-xs text-gray-500 font-sans">
                                    {issue.status}
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-start">
                                <View className="flex-row items-start flex-1">
                                    <View className="bg-primary/10 p-2 rounded-lg mr-3">
                                        <Feather name={issue.icon as any} size={18} color="#67A9AF" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-900 font-sans-medium text-base">
                                            {issue.title}
                                        </Text>
                                        <Text className="text-gray-400 font-sans text-sm mt-1">
                                            {issue.type} • {issue.date}
                                        </Text>
                                    </View>
                                </View>
                                <Feather name="chevron-right" size={20} color="#9CA3AF" />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Other Help Section */}
                <View className="mt-8 mb-6">
                    <Text className="text-gray-400 text-base font-sans mb-4">
                        Need help with something else?
                    </Text>

                    <TouchableOpacity
                        className="bg-white rounded-2xl p-5 flex-row items-center"
                        onPress={() => router.push('/(patient)/(pages)/help')}
                    >
                        <View className="bg-primary rounded-full p-3 mr-4">
                            <Feather name="help-circle" size={28} color="#fff" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-gray-900 font-sans text-base">
                                Have an issue with payments, your account, subscriptions or promotions. Speak to our support team
                            </Text>
                        </View>
                        <Feather name="chevron-right" size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};