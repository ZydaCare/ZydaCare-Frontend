import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const PrivacyPolicy = () => {
  const router = useRouter();
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleBack = () => router.back();
  const openEmail = () => Linking.openURL('mailto:support@zydacare.com');
  const openWebsite = () => Linking.openURL('https://www.zydacare.com');

  const sections = [
    {
      icon: 'information-circle-outline',
      title: 'Introduction',
      content: `Welcome to ZydaCare. ZydaCare is a healthcare technology platform operating in Nigeria. 
We respect your privacy and are committed to safeguarding your personal and health information in compliance 
with the Nigeria Data Protection Regulation (NDPR) and applicable global standards such as the GDPR. 
By using ZydaCare, you consent to the terms outlined in this Privacy Policy.`
    },
    {
      icon: 'globe-outline',
      title: 'Scope and Applicability',
      content: `This policy applies to all ZydaCare platforms — mobile app, website, and services — and covers 
patients, doctors, pharmacies, and corporate or logistics partners. It governs how we collect, use, share, and protect 
information across all ZydaCare services.`
    },
    {
      icon: 'document-text-outline',
      title: 'Information We Collect',
      content: `We collect personal and health-related data, including:
- Account details (name, email, phone, date of birth)
- Medical and consultation information
- Payment and delivery details
- Usage data (device info, IP address, location, session activity)
- Communication data (messages, feedback)
We may also receive limited data from third parties such as Paystack or verification services.`
    },
    {
      icon: 'bulb-outline',
      title: 'Purpose of Data Collection',
      content: `Your data enables ZydaCare to:
- Deliver healthcare and pharmacy services
- Facilitate doctor-patient communication
- Process secure payments and prescriptions
- Provide medicine delivery and logistics
- Improve our AI Symptom Checker and app performance
- Ensure safety, compliance, and fraud prevention.`
    },
    {
      icon: 'lock-closed-outline',
      title: 'Data Security',
      content: `We employ encryption, secure cloud storage, access controls, and regular audits to protect your information. 
Only authorized personnel can access your data. While we take all reasonable precautions, no platform is entirely secure, 
so we advise users to maintain confidentiality of login credentials.`
    },
    {
      icon: 'people-outline',
      title: 'Data Sharing and Disclosure',
      content: `We only share your data with:
- Licensed doctors and pharmacies (for your healthcare)
- Verified payment processors like Paystack
- Cloud and logistics partners for delivery
- Regulators or authorities when required by law
All partners are bound by strict data protection agreements. ZydaCare never sells user data.`
    },
    {
      icon: 'hourglass-outline',
      title: 'Data Retention',
      content: `We retain data for as long as necessary to provide services, comply with laws, and resolve disputes. 
Upon your request, ZydaCare will delete or anonymize your personal data unless legal retention applies.`
    },
    {
      icon: 'person-circle-outline',
      title: 'Your Rights',
      content: `Under NDPR and GDPR, you have the right to:
- Access and obtain a copy of your data
- Correct or update information
- Request deletion of your data
- Withdraw consent or object to processing
- Request data portability
To exercise these rights, contact support@zydacare.com.`
    },
    {
      icon: 'server-outline',
      title: 'Cross-Border Data Transfers',
      content: `Some of our third-party services may store data outside Nigeria. We ensure appropriate safeguards 
and encryption are used in line with NDPR and GDPR standards.`
    },
    {
      icon: 'cloud-outline',
      title: 'Use of AI and Automated Processing',
      content: `ZydaCare’s AI Symptom Checker uses anonymized data to provide health insights and recommendations. 
It does not replace medical judgment or diagnosis. Your identifiable health data is never used for AI training 
without explicit consent.`
    },
    {
      icon: 'warning-outline',
      title: 'Children’s Privacy',
      content: `ZydaCare is not intended for users under 18 years old. We do not knowingly collect data from minors. 
If we become aware of such data, it will be deleted immediately.`
    },
    {
      icon: 'megaphone-outline',
      title: 'Marketing and Communications',
      content: `With your consent, ZydaCare may send health updates or promotional messages. 
You can unsubscribe anytime via settings or email preferences.`
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Data Breach Notification',
      content: `In the unlikely event of a data breach, ZydaCare will notify affected users and relevant authorities 
within 72 hours and take necessary measures to secure your data.`
    },
    {
      icon: 'medical-outline',
      title: 'Health Disclaimer',
      content: `ZydaCare provides a platform for accessing licensed medical professionals but is not a hospital 
or emergency service. AI-based tools are for informational purposes only and do not replace professional medical care.`
    },
    {
      icon: 'settings-outline',
      title: 'Updates to this Policy',
      content: `We may update this Privacy Policy periodically to reflect changes in our operations or legal requirements. 
All updates will be posted on our website and app, and continued use indicates acceptance.`
    },
    {
      icon: 'hammer-outline',
      title: 'Governing Law and Contact Information',
      content: `This Privacy Policy is governed by the laws of the Federal Republic of Nigeria. 
For inquiries or concerns, contact our Privacy Team:
Email: support@zydacare.com
Website: www.zydacare.com`
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="bg-white px-5 py-4 border-b border-gray-100 shadow-sm pt-10">
        <View className="flex-row items-center">
          <Text className="text-2xl font-sans-bold text-gray-900">Privacy Policy</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="bg-white px-5 py-6 mb-6">
          <View className="bg-primary/20 w-16 h-16 rounded-2xl items-center justify-center mb-4 self-center">
            <Ionicons name="shield-checkmark" size={32} color="#67A9AF" />
          </View>
          <Text className="text-2xl font-sans-bold text-center text-gray-900 mb-1">
            Privacy Policy
          </Text>
          <Text className="text-sm text-gray-500 text-center font-sans mb-6">
            Last updated on {currentDate}
          </Text>
          <Text className="text-base text-gray-700 font-sans leading-6 text-center">
            At ZydaCare, your privacy matters. We are dedicated to ensuring your personal and health information 
remains safe, confidential, and used only for the purposes you consent to.
          </Text>
        </View>

        <View className="px-5">
          {sections.map((section, index) => (
            <View
              key={index}
              className="bg-white rounded-xl p-5 mb-4 border border-gray-100 shadow-sm"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <View className="flex-row items-start">
                <View className="bg-primary/20 p-2 rounded-lg mr-4">
                  <Ionicons name={section.icon} size={20} color="#67A9AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-sans-bold text-gray-900 mb-2">
                    {section.title}
                  </Text>
                  <Text className="text-gray-600 font-sans leading-6">
                    {section.content}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          <View className="px-1 mt-2 mb-8">
            <Text className="text-sm text-center text-gray-400 font-sans mb-2">
              By using ZydaCare, you acknowledge that you have read and understood this Privacy Policy.
            </Text>
            <Text className="text-xs text-center text-gray-400 font-sans">
              © {new Date().getFullYear()} ZydaCare. All rights reserved.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicy;
