import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getFAQById } from '@/api/doctor/faq';
import { useToast } from '@/components/ui/Toast';

export default function FAQDetailScreen() {
  const { id } = useLocalSearchParams();
  const [faq, setFaq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [relatedFaqs, setRelatedFaqs] = useState<any[]>([]);
  const { showToast } = useToast();
  const router = useRouter();

  const fetchFAQ = async () => {
    try {
      setLoading(true);
      const data = await getFAQById(id as string);
      setFaq(data);
      
      // // In a real app, you would fetch related FAQs based on relatedFAQs array
      // // For now, we'll just simulate some related FAQs
      // setRelatedFaqs([
      //   {
      //     _id: '1',
      //     question: 'How do I update my availability?',
      //     category: 'Schedule'
      //   },
      //   {
      //     _id: '2',
      //     question: 'How do I manage my appointments?',
      //     category: 'Appointments'
      //   }
      // ]);
    } catch (error) {
      console.error('Error fetching FAQ:', error);
      showToast('Failed to load FAQ. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `FAQ: ${faq?.question}\n\n${faq?.answer}`,
        title: faq?.question
      });
    } catch (error) {
      console.error('Error sharing FAQ:', error);
      showToast('Failed to share FAQ', 'error');
    }
  };

  useEffect(() => {
    if (id) {
      fetchFAQ();
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </SafeAreaView>
    );
  }

  if (!faq) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Ionicons name="help-circle-outline" size={48} color="#D1D5DB" />
        <Text className="text-gray-900 text-lg font-sans-medium mt-4">FAQ not found</Text>
        <Text className="text-gray-500 text-center mt-2 font-sans">
          The requested FAQ could not be found. Please try again later.
        </Text>
        <TouchableOpacity 
          className="mt-6 bg-primary px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-sans-medium">Back to FAQs</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-6 pt-4">
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>
          
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Text className="text-2xl font-sans-bold text-gray-900 mb-4">
              {faq.question}
            </Text>
            
            <View className="h-px bg-gray-100 my-4" />
            
            <Text className="text-base text-gray-700 font-sans leading-6">
              {faq.answer}
            </Text>
            
            {faq.updatedAt && (
              <Text className="text-xs text-gray-400 mt-6 font-sans">
                Last updated: {new Date(faq.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            )}
          </View>
        </View>
        
        {/* {relatedFaqs.length > 0 && (
          <View className="mb-8">
            <Text className="text-lg font-sans-bold text-gray-900 mb-4">
              Related Questions
            </Text>
            
            <View className="space-y-3">
              {relatedFaqs.map((relatedFaq) => (
                <TouchableOpacity
                  key={relatedFaq._id}
                  onPress={() => router.push(`/(doctor)/(pages)/faq/${relatedFaq._id}`)}
                  className="bg-white rounded-xl p-4 border border-gray-100"
                >
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-sm text-primary font-sans-medium mb-1">
                        {relatedFaq.category}
                      </Text>
                      <Text className="text-base font-sans-medium text-gray-900">
                        {relatedFaq.question}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )} */}
        
        <View className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#67A9AF" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-sans-bold text-gray-900">Still need help?</Text>
              <Text className="text-gray-500 font-sans mt-1">
                Our support team is here to help you
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4 flex-row items-center justify-between"
            onPress={() => router.push('/(doctor)/(pages)/supportChat')}
          >
            <View className="flex-row items-center">
              <Ionicons name="chatbubbles-outline" size={20} color="#67A9AF" />
              <Text className="text-primary font-sans-medium ml-2">
                Chat with Support
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#67A9AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
