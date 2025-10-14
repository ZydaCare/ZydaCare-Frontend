import { Stack, useLocalSearchParams, router } from 'expo-router';
import { View, Text, ScrollView, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { getFAQById, FAQItem } from '@/api/patient/faq';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FAQAnswerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [faq, setFaq] = useState<FAQItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { token } = useAuth();
  const { showToast } = useToast();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };

    loadToken();
  }, []);


  const fetchFAQ = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getFAQById(id);
      setFaq(data);
    } catch (err) {
      console.error('Error fetching FAQ:', err);
      setError('Failed to load FAQ. Please try again.');
      showToast('Failed to load FAQ. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && token) {
      fetchFAQ();
    }
  }, [id, token]);

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@zydacare.com');
  };

  const handleRelatedPress = (relatedId: string) => {
    if (!relatedId) {
      console.error('Invalid related FAQ ID');
      showToast('Invalid FAQ reference', 'error');
      return;
    }
    router.replace({
      pathname: '/(patient)/(pages)/faq/[id]',
      params: { id: relatedId }
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
            <ActivityIndicator size="large" color="#67A9AF" />
          </View>
          <Text className="text-base font-sans-medium text-gray-600">Loading FAQ...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !faq) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6">
            <Ionicons name="warning-outline" size={48} color="#EF4444" />
          </View>
          <Text className="text-xl font-sans-bold text-gray-900 text-center mb-3">
            Oops! Something went wrong
          </Text>
          <Text className="text-base font-sans text-gray-600 text-center mb-8">
            {error || 'The FAQ you are looking for could not be found'}
          </Text>
          <TouchableOpacity
            onPress={fetchFAQ}
            className="bg-primary px-8 py-3.5 rounded-xl flex-row items-center shadow-sm"
          >
            <Ionicons name="refresh" size={20} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white font-sans-semibold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'FAQ Details',
          headerBackTitle: 'Back',
          headerTitleStyle: {
            fontFamily: 'sans-semibold',
          },
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <View className="px-6 pt-6 pb-4">
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* Question Badge */}
            <View className="flex-row items-center mb-4">
              <View className="bg-primary/10 rounded-full px-4 py-1.5 flex-row items-center">
                <Ionicons name="help-circle" size={16} color="#67A9AF" style={{ marginRight: 6 }} />
                <Text className="text-xs font-sans-bold text-primary uppercase tracking-wide">
                  Question
                </Text>
              </View>
            </View>

            {/* Question Text */}
            <Text className="text-2xl font-sans-bold text-gray-900 leading-8 mb-6">
              {faq.question}
            </Text>

            {/* Divider */}
            <View className="h-px bg-gray-200 mb-6" />

            {/* Answer Badge */}
            <View className="flex-row items-center mb-4">
              <View className="bg-green-50 rounded-full px-4 py-1.5 flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text className="text-xs font-sans-bold text-green-600 uppercase tracking-wide">
                  Answer
                </Text>
              </View>
            </View>

            {/* Answer Text */}
            <View>
              {faq.answer.split('\n\n').map((paragraph, index) => (
                <Text
                  key={index}
                  className="text-base font-sans text-gray-700 leading-7 mb-4"
                >
                  {paragraph}
                </Text>
              ))}
            </View>

            {/* Last Updated */}
            {faq.updatedAt && (
              <View className="mt-6 pt-4 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
                  <Text className="text-xs font-sans text-gray-500">
                    Last updated {new Date(faq.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Related Questions */}
        {faq.relatedFAQs && faq.relatedFAQs.length > 0 && (
          <View className="px-6 pb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-1 h-6 bg-primary rounded-full mr-3" />
              <Text className="text-lg font-sans-bold text-gray-900">
                Related Questions
              </Text>
            </View>

            <View className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {faq.relatedFAQs.map((relatedId, index) => (
                <TouchableOpacity
                  key={relatedId}
                  onPress={() => handleRelatedPress(relatedId)}
                  className={`px-5 py-4 flex-row items-center ${index !== faq.relatedFAQs!.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  activeOpacity={0.7}
                  disabled={relatedId === id}
                >
                  <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-4">
                    <Ionicons
                      name={relatedId === id ? "checkmark-circle" : "document-text-outline"}
                      size={20}
                      color={relatedId === id ? "#10B981" : "#67A9AF"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-base font-sans-medium ${relatedId === id ? 'text-green-600' : 'text-gray-800'
                      }`}>
                      {relatedId === id ? 'Current Question' : `Related Question ${index + 1}`}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500 mt-0.5">
                      {relatedId === id ? 'You are viewing this' : 'Tap to view'}
                    </Text>
                  </View>
                  {relatedId !== id && (
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Helpful Feedback Section */}
        <View className="px-6 pb-4">
          <View className="bg-gray-100 rounded-2xl p-5 border border-gray-200">
            <Text className="text-base font-sans-semibold text-gray-900 text-center mb-3">
              Was this helpful?
            </Text>
            <View className="flex-row justify-center space-x-3">
              <TouchableOpacity
                className="bg-white px-6 py-3 rounded-xl flex-row items-center border border-gray-200 flex-1 justify-center mr-2"
                onPress={() => showToast('Thanks for your feedback!', 'success')}
              >
                <Ionicons name="thumbs-up-outline" size={20} color="#10B981" style={{ marginRight: 6 }} />
                <Text className="text-sm font-sans-semibold text-gray-700">Yes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-white px-6 py-3 rounded-xl flex-row items-center border border-gray-200 flex-1 justify-center ml-2"
                onPress={() => showToast('Thanks for your feedback!', 'success')}
              >
                <Ionicons name="thumbs-down-outline" size={20} color="#EF4444" style={{ marginRight: 6 }} />
                <Text className="text-sm font-sans-semibold text-gray-700">No</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Contact Support Card */}
        <View className="px-6 pb-8">
          <View className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
            <View className="flex-row items-start mb-5">
              <View className="w-14 h-14 bg-primary rounded-2xl items-center justify-center mr-4">
                <Ionicons name="headset" size={28} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-sans-bold text-gray-900 mb-2">
                  Still Need Help?
                </Text>
                <Text className="text-sm font-sans text-gray-600 leading-5">
                  Our dedicated support team is available 24/7 to assist you with any questions or concerns you may have.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleContactSupport}
              className="bg-primary px-6 py-4 rounded-xl flex-row items-center justify-center shadow-sm"
            >
              <Ionicons name="chatbubbles" size={20} color="white" style={{ marginRight: 10 }} />
              <Text className="text-white font-sans-bold text-base">Contact Support Team</Text>
            </TouchableOpacity>

            <View className="flex-row items-center justify-center mt-4 pt-4 border-t border-primary/20">
              <Ionicons name="mail-outline" size={16} color="#67A9AF" style={{ marginRight: 6 }} />
              <Text className="text-sm font-sans text-gray-600">
                support@zydacare.com
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}