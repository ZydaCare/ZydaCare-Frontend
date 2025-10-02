import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Image, Linking, Alert } from 'react-native';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const helpCategories = [
    {
      id: 'appointments',
      title: 'Appointments',
      icon: 'calendar-clock',
      color: '#67A9AF',
      description: 'Booking, rescheduling, or cancelling appointments'
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions',
      icon: 'prescription',
      color: '#8E6C88',
      description: 'Refills, status, and medication questions'
    },
    {
      id: 'billing',
      title: 'Billing & Insurance',
      icon: 'credit-card-check',
      color: '#F4A261',
      description: 'Payments, insurance claims, and receipts'
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: 'account-cog',
      color: '#2A9D8F',
      description: 'Login, security, and personal information'
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: 'tools',
      color: '#E76F51',
      description: 'App issues and troubleshooting'
    }
  ];

  const popularQuestions = [
    'How do I book an appointment?',
    'How do I upload my insurance information?',
    'Can I reschedule my appointment?',
    'How do I contact my doctor?',
    'Where can I find my medical records?'
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#67A9AF" />
      
      {/* Header */}
      <View className="bg-primary px-6 pt-4 pb-6 rounded-b-3xl">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="bg-white/20 p-2 rounded-full"
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-sans-bold">Help Center</Text>
          <View className="w-8" />
        </View>

        {/* Search Bar */}
        <View className="bg-white rounded-xl p-3 flex-row items-center shadow-sm">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search help articles..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-base font-sans text-gray-900"
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false} contentContainerClassName="pb-10">
        {/* Categories */}
        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-gray-900 mb-4">Help Categories</Text>
          <View className="flex-row flex-wrap -mx-2">
            {helpCategories.map((category) => (
              <TouchableOpacity 
                key={category.id}
                className="w-1/2 px-2 mb-4"
                onPress={() => router.push(`/help/category/${category.id}`)}
              >
                <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <View 
                    className="w-12 h-12 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <MaterialCommunityIcons 
                      name={category.icon as any} 
                      size={24} 
                      color={category.color} 
                    />
                  </View>
                  <Text className="font-sans-semibold text-gray-900 mb-1">
                    {category.title}
                  </Text>
                  <Text className="text-xs text-gray-500 font-sans">
                    {category.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Questions */}
        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-gray-900 mb-4">Popular Questions</Text>
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            {popularQuestions.map((question, index) => (
              <TouchableOpacity 
                key={index}
                className="py-3 flex-row items-center justify-between"
                onPress={() => router.push(`/help/article/${question.replace(/\s+/g, '-').toLowerCase()}`)}
              >
                <Text className="text-gray-700 font-sans flex-1 pr-2">{question}</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Support */}
        <View className="mb-8">
          <Text className="text-lg font-sans-bold text-gray-900 mb-4">Need more help?</Text>
          <View className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
            <View className="flex-row items-start mb-4">
              <View className="bg-primary/10 p-2 rounded-lg mr-3">
                <Ionicons name="chatbubbles" size={24} color="#67A9AF" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-gray-900 text-lg mb-1">Chat with us</Text>
                <Text className="text-gray-600 text-sm font-sans">
                  Our support team is available 24/7 to assist you with any questions or concerns.
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              className="bg-primary rounded-full py-3 items-center mt-2 flex-row justify-center"
              onPress={() => router.push('/(patient)/(pages)/supportChat')}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="white" />
              <Text className="text-white font-sans-semibold ml-2">Start Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Contact */}
        <View className="mb-8 bg-red-50 border border-red-100 rounded-2xl p-5">
          <View className="flex-row items-start">
            <View className="bg-red-100 p-2 rounded-lg mr-3">
              <Ionicons name="warning" size={24} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="font-sans-bold text-red-900 text-lg mb-1">Emergency?</Text>
              <Text className="text-red-700 text-sm font-sans mb-3">
                If you're experiencing a medical emergency, please call your local emergency number immediately.
              </Text>
              <TouchableOpacity 
                className="flex-row items-center"
                onPress={() => {
                  // Nigerian emergency numbers
                  const emergencyNumber = 'tel:112';
                  Linking.openURL(emergencyNumber).catch(err => {
                    console.error('Error opening phone app:', err);
                    showToast(
                    //   'Unable to Call',
                      'Could not open the phone app. Please dial 112 (Nigeria Emergency) manually.',
                      'error'
                    );
                  });
                }}
              >
                <Ionicons name="call" size={16} color="#EF4444" />
                <Text className="text-red-600 font-sans-semibold ml-2">Call 112 (Nigeria Emergency)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};