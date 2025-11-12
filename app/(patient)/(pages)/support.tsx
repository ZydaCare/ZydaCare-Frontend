import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StatusBar, Linking } from 'react-native';
import { Feather, Ionicons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native';
import { useAuth } from '@/context/authContext';
import { router } from 'expo-router';

export default function SupportScreen() {
  const { user } = useAuth();

  // Contact Links
  const contacts = [
    {
      id: 1,
      title: 'Chat on WhatsApp',
      description: 'Instantly connect with our support team on WhatsApp',
      icon: <Ionicons name="logo-whatsapp" size={26} color="#25D366" />,
      link: 'https://wa.me/2349068937365?text=Hi%20ZydaCare%20Support%2C%20I%20need%20help',
    },
    {
      id: 2,
      title: 'Message on Twitter',
      description: 'DM our support handle on X (Twitter)',
      icon: <Ionicons name="logo-twitter" size={26} color="#1DA1F2" />,
      link: 'https://twitter.com/messages/compose?recipient_id=YOUR_TWITTER_ID',
    },
    {
      id: 3,
      title: 'Send an Email',
      description: 'Reach us directly via email for detailed support',
      icon: <Feather name="mail" size={26} color="#205295" />,
      link: 'mailto:support@zydacare.com?subject=ZydaCare%20Support%20Request',
    },
    {
      id: 4,
      title: 'Visit Instagram',
      description: 'Follow and message us on Instagram',
      icon: <Ionicons name="logo-instagram" size={26} color="#E1306C" />,
      link: 'https://instagram.com/zydacare',
    },
  ];

  const openLink = (url: string) => Linking.openURL(url);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#67A9AF" />

      {/* Header */}
      <View className="bg-primary pt-20 pb-8 px-6 rounded-b-3xl">
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-[25px] font-sans-semibold">
            Hello, {user?.firstName || 'there'}{'\n'}how can we help?
          </Text>
        </View>
      </View>

      {/* Support Options */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-24"
      >
        <View className="mt-8">
          <Text className="text-gray-400 text-base font-sans mb-4">
            Contact ZydaCare Support
          </Text>

          {contacts.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => openLink(item.link)}
              className="bg-white rounded-2xl p-5 flex-row items-start mb-4 shadow-sm"
              activeOpacity={0.9}
            >
              <View className="bg-gray-100 p-3 rounded-full mr-4">{item.icon}</View>
              <View className="flex-1">
                <Text className="text-gray-900 font-sans-semibold text-[16px] mb-1">
                  {item.title}
                </Text>
                <Text className="text-gray-600 font-sans text-[13px] leading-5">
                  {item.description}
                </Text>
              </View>
              <Feather name="chevron-right" size={22} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Other Help Section */}
        <View className="mt-6 mb-6">
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
                Have an issue with payments, your account, subscriptions or promotions? Look at our help center.
              </Text>
            </View>
            <Feather name="chevron-right" size={24} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
