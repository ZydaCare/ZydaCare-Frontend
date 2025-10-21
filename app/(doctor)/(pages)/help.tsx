import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type SupportItem = {
  id: string;
  title: string;
  icon: string;
  description: string;
  action?: () => void;
};

export default function HelpAndSupportScreen() {
  const router = useRouter();

  const supportItems: SupportItem[] = [
    {
      id: 'chat',
      title: 'Chat with Support',
      icon: 'chatbubble-ellipses-outline',
      description: 'Get instant help from our support team',
      action: () => router.push('/(doctor)/(pages)/supportChat'),
    },
    {
      id: 'faq',
      title: 'FAQs',
      icon: 'help-circle-outline',
      description: 'Find answers to common questions',
      action: () => router.push('/(doctor)/(pages)/faq'),
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      icon: 'thumbs-up-outline',
      description: 'Share your experience with us',
      action: () => Linking.openURL('mailto:feedback@zydacare.com'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield-checkmark-outline',
      description: 'Review our privacy policy',
      action: () => router.push('/(doctor)/(pages)/privacy'),
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'document-text-outline',
      description: 'Read our terms and conditions',
      action: () => router.push('/(doctor)/(pages)/terms'),
    },
  ];

  const handleCallSupport = () => {
    Linking.openURL('tel:+1234567890');
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
          <Text className="text-xl font-sans-bold text-gray-900">Help & Support</Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          {/* Support Card */}
          <View className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-3">
                <Ionicons name="headset" size={32} color="#67A9AF" />
              </View>
              <Text className="text-lg font-sans-bold text-gray-900 mb-1">Need Help?</Text>
              <Text className="text-sm text-gray-500 text-center font-sans">
                Our support team is available 24/7 to assist you with any questions or issues.
              </Text>
            </View>

            <View className="flex-row gap-5 mt-4">
              <TouchableOpacity 
                className="flex-1 flex-row items-center justify-center py-3 bg-primary/10 rounded-xl"
                onPress={() => router.push('/(doctor)/(pages)/supportChat')}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#67A9AF" />
                <Text className="text-primary font-sans-bold ml-2">Chat Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 flex-row items-center justify-center py-3 bg-primary/10 rounded-xl"
                onPress={handleCallSupport}
              >
                <Ionicons name="call-outline" size={20} color="#67A9AF" />
                <Text className="text-primary font-sans-bold ml-2">Call Us</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Support Options */}
          <View className="space-y-3">
            {supportItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-white rounded-xl p-4 flex-row items-center"
                onPress={item.action}
              >
                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-4">
                  <Ionicons name={item.icon as any} size={20} color="#67A9AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-sans-semibold text-gray-900">
                    {item.title}
                  </Text>
                  <Text className="text-sm text-gray-500 font-sans mt-0.5">
                    {item.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Helpful Resources */}
          <View className="mt-8">
            <Text className="text-base font-sans-bold text-gray-900 mb-4">Helpful Resources</Text>
            <View className="space-y-3">
              <TouchableOpacity 
                className="bg-white rounded-xl p-4 flex-row items-center"
                onPress={() => router.push('/(doctor)/(pages)/user-guide')}
              >
                <View className="w-10 h-10 rounded-lg bg-blue-50 items-center justify-center mr-4">
                  <Ionicons name="book-outline" size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-sans-medium text-gray-900">
                    User Guide
                  </Text>
                  <Text className="text-xs text-gray-500 font-sans mt-0.5">
                    Complete guide to using ZydaCare
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              
              <TouchableOpacity className="bg-white rounded-xl p-4 flex-row items-center">
                <View className="w-10 h-10 rounded-lg bg-purple-50 items-center justify-center mr-4">
                  <Ionicons name="videocam-outline" size={20} color="#8B5CF6" />
                </View>
                <Text className="text-base font-sans-medium text-gray-900 flex-1">
                  Video Tutorials
                </Text>
                <Ionicons name="play-circle-outline" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Info */}
          <View className="mt-10 mb-8 items-center">
            <Text className="text-sm text-gray-500 text-center font-sans">
              ZydaCare v1.0.0
            </Text>
            <Text className="text-xs text-gray-400 mt-1 font-sans">
              © {new Date().getFullYear()} ZydaCare. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
