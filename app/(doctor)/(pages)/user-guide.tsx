import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type GuideSection = {
  id: string;
  title: string;
  icon: string;
  description: string;
  content: string;
  videoUrl?: string;
};

export default function UserGuideScreen() {
  const router = useRouter();

  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: 'rocket-outline',
      description: 'Learn the basics of ZydaCare for Doctors',
      content: `Welcome to ZydaCare! This guide will help you get started with our platform.

1. Complete your profile to appear in search results
2. Set your availability to start receiving appointments
3. Connect your payment information to receive payments
4. Download our mobile app for on-the-go access

For more detailed instructions, please refer to our online documentation.`,
      videoUrl: 'https://example.com/videos/getting-started'
    },
    {
      id: 'appointments',
      title: 'Managing Appointments',
      icon: 'calendar-outline',
      description: 'How to manage your consultation schedule',
      content: `Managing your appointments is easy with ZydaCare:

• View your upcoming appointments in the calendar
• Accept or decline appointment requests
• Set your consultation fees and duration
• Receive notifications for new bookings
• Reschedule or cancel appointments when needed

You can access your appointment history in the 'Appointments' tab.`
    },
    {
      id: 'prescriptions',
      title: 'E-Prescriptions',
      icon: 'medical-outline',
      description: 'Creating and managing digital prescriptions',
      content: `Our e-prescription system allows you to:

• Create digital prescriptions for your patients
• Save frequently used medications as templates
• Send prescriptions directly to pharmacies
• Track prescription history
• Set up automatic refill reminders for patients

All prescriptions are securely stored and can be accessed anytime.`
    },
    {
      id: 'payments',
      title: 'Payments & Invoicing',
      icon: 'card-outline',
      description: 'Understanding your earnings and payments',
      content: `Payment Information:

• Set your consultation fees
• View your earnings dashboard
• Track payment history
• Set up automatic bank transfers
• Download invoices and tax documents

Payments are processed securely and transferred to your bank account.`
    },
    {
      id: 'profile',
      title: 'Profile & Settings',
      icon: 'person-outline',
      description: 'Customize your profile and preferences',
      content: `Keep your profile up to date:

• Add your qualifications and specialties
• Upload your professional photo
• Set your consultation hours
• Manage notification preferences
• Update your contact information

A complete profile helps patients find you more easily.`
    },
    {
      id: 'support',
      title: 'Getting Help',
      icon: 'help-circle-outline',
      description: 'How to get support when you need it',
      content: `We're here to help!

• Chat with our support team 24/7
• Browse our FAQ section
• Schedule a call with our support team
• Email us at support@zydacare.com
• Check our online knowledge base

Our average response time is less than 2 hours.`
    }
  ];

   const openWhatsApp = () => { 
      const phoneNumber = '+2349068937365';
      const url = `https://wa.me/${phoneNumber}`;
      Linking.openURL(url);
    };

  const handleOpenVideo = (videoUrl?: string) => {
    if (videoUrl) {
      Linking.openURL(videoUrl);
    } else {
      // Show a message that no video is available
      alert('No video tutorial available for this section yet.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 -ml-2 mr-2"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-gray-900">User Guide</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 py-6">
        <View className="mb-6 bg-white rounded-2xl p-6 shadow-sm">
          <View className="items-center mb-4">
            <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-3">
              <Ionicons name="book-outline" size={32} color="#67A9AF" />
            </View>
            <Text className="text-lg font-sans-bold text-gray-900 mb-1">ZydaCare Doctor's Guide</Text>
            <Text className="text-sm text-gray-500 text-center font-sans">
              Everything you need to know about using ZydaCare as a healthcare provider
            </Text>
          </View>
        </View>

        {/* Guide Sections */}
        <View className="space-y-4">
          {guideSections.map((section) => (
            <View key={section.id} className="bg-white rounded-xl p-5 shadow-sm">
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-4 mt-1">
                  <Ionicons name={section.icon as any} size={20} color="#67A9AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-sans-bold text-gray-900 mb-1">
                    {section.title}
                  </Text>
                  <Text className="text-sm text-gray-500 font-sans mb-3">
                    {section.description}
                  </Text>
                  <Text className="text-sm text-gray-700 font-sans leading-6">
                    {section.content.split('\n').map((line, i) => (
                      <Text key={i}>
                        {line}
                        {i < section.content.split('\n').length - 1 && '\n'}
                      </Text>
                    ))}
                  </Text>
                  {section.videoUrl && (
                    <TouchableOpacity 
                      className="mt-3 flex-row items-center"
                      onPress={() => handleOpenVideo(section.videoUrl)}
                    >
                      <Ionicons name="play-circle" size={20} color="#67A9AF" />
                      <Text className="text-primary font-sans-medium ml-2">
                        Watch Video Tutorial
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Additional Help */}
        <View className="mt-8 mb-10 bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-sans-bold text-gray-900 mb-3">Need More Help?</Text>
          <Text className="text-sm text-gray-600 font-sans mb-4">
            Our support team is available 24/7 to assist you with any questions or issues.
          </Text>
          <TouchableOpacity 
            className="flex-row items-center justify-center py-3 bg-primary/10 rounded-xl"
            onPress={openWhatsApp}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#67A9AF" />
            <Text className="text-primary font-sans-bold ml-2">Chat with Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
