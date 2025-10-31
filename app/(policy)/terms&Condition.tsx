import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const TermsAndConditions = () => {
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
      content: `Welcome to ZydaCare. These Terms and Conditions govern your use of the ZydaCare mobile app and related services. 
By using our platform, you agree to these Terms. ZydaCare provides a digital platform that connects users with licensed doctors, verified pharmacies, and healthcare delivery services.`
    },
    {
      icon: 'checkmark-circle-outline',
      title: 'Acceptance of Terms',
      content: `By creating an account or using ZydaCare, you agree that you are at least 18 years old, understand these Terms, 
and have the legal capacity to enter into a binding agreement. If you disagree with any part of these Terms, you must stop using ZydaCare immediately.`
    },
    {
      icon: 'medkit-outline',
      title: 'Our Services',
      content: `ZydaCare offers doctor consultations (virtual, home, or in-person), pharmacy orders, AI-powered symptom checking, 
and healthcare delivery. ZydaCare itself is not a hospital or clinic. All medical advice and prescriptions are provided by licensed, independent professionals.`
    },
    {
      icon: 'person-circle-outline',
      title: 'User Accounts',
      content: `To access ZydaCare, users must create an account. You must provide accurate information and keep your credentials secure. 
You are responsible for all activities performed under your account. ZydaCare is not liable for losses caused by unauthorized access due to your negligence.`
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Eligibility',
      content: `ZydaCare services are for individuals aged 18 years and above who reside in Nigeria. 
You agree to use the platform lawfully and only for personal healthcare purposes.`
    },
    {
      icon: 'hand-left-outline',
      title: 'Prohibited Use',
      content: `You must not:
- Impersonate others or falsify identity
- Upload harmful code or spam
- Harass healthcare professionals
- Interfere with ZydaCare’s systems
Violation may lead to account suspension or termination.`
    },
    {
      icon: 'warning-outline',
      title: 'Medical Disclaimer',
      content: `ZydaCare provides access to medical professionals but does not replace hospitals or emergency services. 
AI symptom suggestions and automated responses are informational only. For emergencies, contact local medical services immediately.`
    },
    {
      icon: 'people-outline',
      title: 'Doctors and Pharmacies',
      content: `Doctors and pharmacies on ZydaCare are independent contractors, not employees of ZydaCare. 
They are responsible for their conduct, advice, and prescriptions. ZydaCare verifies credentials but does not guarantee treatment outcomes.`
    },
    {
      icon: 'calendar-outline',
      title: 'Appointments and Consultations',
      content: `Consultation times depend on provider availability. Missed appointments may not be refundable. 
Rescheduling is allowed before a session begins. Doctors may decline sessions if information is incomplete.`
    },
    {
      icon: 'bag-handle-outline',
      title: 'Pharmacy Orders and Delivery',
      content: `All pharmacy partners on ZydaCare are verified. Deliveries are handled through trusted logistics partners. 
ZydaCare is not responsible for delays due to courier issues. Inspect items upon delivery and report damages within 24 hours.`
    },
    {
      icon: 'card-outline',
      title: 'Payments and Fees',
      content: `Payments are processed securely through Paystack. By making a payment, you authorize ZydaCare to charge your account. 
Service fees and commissions may apply. All prices are in Nigerian Naira (₦) unless stated otherwise.`
    },
    {
      icon: 'cash-outline',
      title: 'Refund and Cancellation Policy',
      content: `Refunds are issued only when:
- A doctor cancels before the session
- A duplicate payment occurs
- Ordered medicine is unavailable
Requests must be made within 48 hours to support@zydacare.com. Refunds are processed within 7–10 business days after approval.`
    },
    {
      icon: 'construct-outline',
      title: 'AI and Automated Services',
      content: `The AI Symptom Checker provides informational guidance based on anonymized inputs. 
It does not diagnose or prescribe. Use it responsibly and always consult a doctor for accurate advice.`
    },
    {
      icon: 'lock-closed-outline',
      title: 'Privacy and Data',
      content: `Your data usage is governed by the ZydaCare Privacy Policy, which forms part of these Terms. 
By using ZydaCare, you consent to the processing of your data as described in the Privacy Policy available at www.zydacare.com.`
    },
    {
      icon: 'book-outline',
      title: 'Intellectual Property',
      content: `All content, logos, text, and designs on ZydaCare belong to ZydaCare. You may not reproduce or distribute any part of the app without written consent. 
Reverse-engineering or copying source code is strictly prohibited.`
    },
    {
      icon: 'alert-circle-outline',
      title: 'Limitation of Liability',
      content: `ZydaCare is not liable for any damages resulting from your use of the app, delays, or third-party errors. 
We do not guarantee uninterrupted service. Use ZydaCare at your own risk.`
    },
    {
      icon: 'hand-right-outline',
      title: 'Indemnification',
      content: `You agree to defend, indemnify, and hold harmless ZydaCare and its affiliates from claims or damages 
arising from your misuse of the app or violation of these Terms.`
    },
    {
      icon: 'server-outline',
      title: 'Service Availability',
      content: `While we strive for uninterrupted service, ZydaCare may be temporarily unavailable due to maintenance or technical issues.`
    },
    {
      icon: 'link-outline',
      title: 'Third-Party Services',
      content: `ZydaCare integrates with services like Paystack and delivery partners. 
We are not responsible for their terms or actions. Please review their policies before use.`
    },
    {
      icon: 'stop-circle-outline',
      title: 'Termination',
      content: `ZydaCare may suspend or terminate accounts for violations, fraud, or abuse. 
You may delete your account anytime by contacting support@zydacare.com.`
    },
    {
      icon: 'sync-outline',
      title: 'Updates to Terms',
      content: `We may modify these Terms periodically. Updates are effective immediately upon posting on the app or website. 
Continued use of ZydaCare means you accept the new Terms.`
    },
    {
      icon: 'hammer-outline',
      title: 'Governing Law',
      content: `These Terms are governed by the laws of the Federal Republic of Nigeria. 
All disputes will be resolved in the competent courts of Lagos State, Nigeria.`
    },
    {
      icon: 'call-outline',
      title: 'Contact Us',
      content: `For questions or complaints, contact:
Email: support@zydacare.com
Website: www.zydacare.com
Location: Lagos, Nigeria`
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <View className="bg-white px-5 py-4 border-b border-gray-100 shadow-sm pt-10">
        <View className="flex-row items-center">
          <Text className="text-2xl font-sans-bold text-gray-900">Terms & Conditions</Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="bg-white px-5 py-6 mb-6">
          <View className="bg-primary/20 w-16 h-16 rounded-2xl items-center justify-center mb-4 self-center">
            <Ionicons name="document-text" size={32} color="#67A9AF" />
          </View>
          <Text className="text-2xl font-sans-bold text-center text-gray-900 mb-1">
            Terms & Conditions
          </Text>
          <Text className="text-sm text-gray-500 text-center font-sans mb-6">
            Last updated on {currentDate}
          </Text>
          <Text className="text-base text-gray-700 font-sans leading-6 text-center">
            Please read these Terms carefully before using ZydaCare. 
By continuing to use our app, you agree to comply with and be bound by all the terms outlined below.
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
              By using ZydaCare, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.
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

export default TermsAndConditions;
