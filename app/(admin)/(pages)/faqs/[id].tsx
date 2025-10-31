import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import FAQForm from '@/components/faq/FAQForm';
import { getFAQById, updateFAQ, getFAQs } from '@/api/admin/faqs';
import { FAQ } from '@/types/faq';
import { useToast } from '@/components/ui/Toast';
import { ScrollView } from 'react-native';

export default function EditFAQScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [faq, setFaq] = useState<FAQ | null>(null);
  const [allFAQs, setAllFAQs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [faqData, faqsData] = await Promise.all([
          getFAQById(id as string),
          getFAQs({})
        ]);
        setFaq(faqData);
        setAllFAQs(faqsData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast('Failed to load data', 'error');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (data: any): Promise<void> => {
    try {
      setIsSubmitting(true);
      await updateFAQ({
        id: id as string,
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
      showToast('FAQ updated successfully', 'success');
    } catch (error) {
      console.error('Error updating FAQ:', error);
      showToast('Failed to update FAQ', 'error');
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

  if (!faq) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-lg font-sans-medium text-gray-700 mb-4">
          FAQ not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-sans-medium">Go Back</Text>
        </TouchableOpacity>
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
              Edit FAQ
            </Text>
          </View>

          <FAQForm
            initialData={faq}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            allFAQs={allFAQs.filter(f => f._id !== faq._id)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
