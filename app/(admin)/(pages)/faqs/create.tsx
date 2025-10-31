import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FAQForm from '@/components/faq/FAQForm';
import { createFAQ, getFAQs } from '@/api/admin/faqs';
import { FAQ } from '@/types/faq';
import { useToast } from '@/components/ui/Toast';

export default function CreateFAQScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allFAQs, setAllFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const result = await getFAQs({});
        setAllFAQs(result.data);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        showToast('Failed to load FAQs', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await createFAQ({
        ...data,
        // Ensure we're only sending the required fields
        question: data.question.trim(),
        shortAnswer: data.shortAnswer.trim(),
        answer: data.answer.trim(),
        category: data.category,
        forRoles: data.forRoles || [],
        tags: data.tags || [],
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        metaTitle: data.metaTitle?.trim() || undefined,
        metaDescription: data.metaDescription?.trim() || undefined,
        publishedAt: data.publishedAt,
        expiresAt: data.expiresAt || undefined,
        relatedFAQs: data.relatedFAQs || []
      });
      return true;
    } catch (error) {
      console.error('Error creating FAQ:', error);
      showToast('Failed to create FAQ', 'error');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-4 flex-1 pt-10">
          <View className="flex-row items-center mb-2">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2 -ml-2 mr-2"
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-2xl font-sans-bold text-gray-900">
              Create New FAQ
            </Text>
          </View>
          
          <FAQForm 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            allFAQs={allFAQs}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
