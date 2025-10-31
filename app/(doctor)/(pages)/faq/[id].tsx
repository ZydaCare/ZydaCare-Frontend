import { Stack, useLocalSearchParams, router } from 'expo-router';
import { View, Text, ScrollView, Linking, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { getFAQById, FAQItem, markFAQHelpful } from '@/api/patient/faq';
import { useToast } from '@/components/ui/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FAQAnswerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [faq, setFaq] = useState<FAQItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
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

  const handleRelatedPress = (relatedFAQ: any) => {
    if (!relatedFAQ?._id) {
      console.error('Invalid related FAQ');
      showToast('Invalid FAQ reference', 'error');
      return;
    }
    router.push({
      pathname: '/(patient)/(pages)/faq/[id]',
      params: { id: relatedFAQ._id }
    });
  };

  const handleHelpfulFeedback = async (isHelpful: boolean) => {
    if (!id || feedbackGiven) return;

    try {
      await markFAQHelpful(id, isHelpful);
      setFeedbackGiven(true);
      showToast('Thanks for your feedback!', 'success');
      
      // Update local counts
      if (faq) {
        setFaq({
          ...faq,
          helpfulCount: isHelpful ? faq.helpfulCount + 1 : faq.helpfulCount,
          notHelpfulCount: !isHelpful ? faq.notHelpfulCount + 1 : faq.notHelpfulCount,
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('Failed to submit feedback', 'error');
    }
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(() => {
      showToast('Could not open link', 'error');
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
            {/* Category and Featured Badge */}
            <View className="flex-row items-center mb-4 flex-wrap">
              <View className="bg-primary/10 rounded-full px-4 py-1.5 flex-row items-center mr-2 mb-2">
                <Ionicons name="help-circle" size={16} color="#67A9AF" style={{ marginRight: 6 }} />
                <Text className="text-xs font-sans-bold text-primary uppercase tracking-wide">
                  {faq.category.replace('_', ' ')}
                </Text>
              </View>
              {faq.isFeatured && (
                <View className="bg-amber-50 rounded-full px-4 py-1.5 flex-row items-center mb-2">
                  <Ionicons name="star" size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                  <Text className="text-xs font-sans-bold text-amber-600 uppercase tracking-wide">
                    Featured
                  </Text>
                </View>
              )}
            </View>

            {/* Question Text */}
            <Text className="text-2xl font-sans-bold text-gray-900 leading-8 mb-4">
              {faq.question}
            </Text>

            {/* Tags */}
            {faq.tags && faq.tags.length > 0 && (
              <View className="flex-row flex-wrap mb-6">
                {faq.tags.map((tag, index) => (
                  <View key={index} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-xs font-sans text-gray-600">#{tag}</Text>
                  </View>
                ))}
              </View>
            )}

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

            {/* Stats Row */}
            <View className="mt-6 pt-4 border-t border-gray-100 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="eye-outline" size={16} color="#9CA3AF" style={{ marginRight: 6 }} />
                <Text className="text-sm font-sans text-gray-600">
                  {faq.viewCount} views
                </Text>
              </View>
              
              {(faq.helpfulCount > 0 || faq.notHelpfulCount > 0) && (
                <View className="flex-row items-center">
                  <Ionicons name="thumbs-up-outline" size={16} color="#10B981" style={{ marginRight: 4 }} />
                  <Text className="text-sm font-sans text-gray-600">
                    {faq.helpfulnessRatio}% helpful
                  </Text>
                </View>
              )}
            </View>

            {/* Last Updated */}
            {faq.updatedAt && (
              <View className="mt-3 flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
                <Text className="text-xs font-sans text-gray-500">
                  Last updated {new Date(faq.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Media Section */}
        {faq.media && faq.media.length > 0 && (
          <View className="px-6 pb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-1 h-6 bg-primary rounded-full mr-3" />
              <Text className="text-lg font-sans-bold text-gray-900">
                Related Media
              </Text>
            </View>

            <View className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 p-4">
              {faq.media.map((item, index) => (
                <View key={index} className={`${index !== 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}`}>
                  {item.type === 'image' && (
                    <View>
                      <Image
                        source={{ uri: item.url }}
                        className="w-full h-48 rounded-xl mb-2"
                        resizeMode="cover"
                      />
                      {item.caption && (
                        <Text className="text-sm font-sans text-gray-600">{item.caption}</Text>
                      )}
                    </View>
                  )}
                  {(item.type === 'video' || item.type === 'document') && (
                    <TouchableOpacity
                      onPress={() => handleLinkPress(item.url)}
                      className="flex-row items-center p-3 bg-gray-50 rounded-xl"
                    >
                      <View className="w-10 h-10 bg-primary/10 rounded-lg items-center justify-center mr-3">
                        <Ionicons
                          name={item.type === 'video' ? 'videocam' : 'document-text'}
                          size={20}
                          color="#67A9AF"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-sans-medium text-gray-800">
                          {item.title || `View ${item.type}`}
                        </Text>
                        {item.caption && (
                          <Text className="text-xs font-sans text-gray-500">{item.caption}</Text>
                        )}
                      </View>
                      <Ionicons name="open-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Related Links */}
        {faq.relatedLinks && faq.relatedLinks.length > 0 && (
          <View className="px-6 pb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-1 h-6 bg-primary rounded-full mr-3" />
              <Text className="text-lg font-sans-bold text-gray-900">
                Helpful Resources
              </Text>
            </View>

            <View className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {faq.relatedLinks.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleLinkPress(link.url)}
                  className={`px-5 py-4 flex-row items-center ${
                    index !== faq.relatedLinks!.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-4">
                    <Ionicons
                      name={link.isExternal ? 'open-outline' : 'link-outline'}
                      size={20}
                      color="#67A9AF"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-sans-medium text-gray-800 mb-1">
                      {link.title}
                    </Text>
                    {link.description && (
                      <Text className="text-xs font-sans text-gray-500" numberOfLines={2}>
                        {link.description}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

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
              {faq.relatedFAQs.map((relatedFAQ, index) => (
                <TouchableOpacity
                  key={relatedFAQ._id}
                  onPress={() => handleRelatedPress(relatedFAQ)}
                  className={`px-5 py-4 ${
                    index !== faq.relatedFAQs!.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  activeOpacity={0.7}
                  disabled={relatedFAQ._id === id}
                >
                  <View className="flex-row items-start">
                    <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-4 mt-1">
                      <Ionicons
                        name={relatedFAQ._id === id ? 'checkmark-circle' : 'help-circle-outline'}
                        size={20}
                        color={relatedFAQ._id === id ? '#10B981' : '#67A9AF'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`text-base font-sans-medium mb-1 ${
                          relatedFAQ._id === id ? 'text-green-600' : 'text-gray-800'
                        }`}
                      >
                        {relatedFAQ.question}
                      </Text>
                      {relatedFAQ.shortAnswer && relatedFAQ._id !== id && (
                        <Text className="text-sm font-sans text-gray-500" numberOfLines={2}>
                          {relatedFAQ.shortAnswer}
                        </Text>
                      )}
                      <View className="flex-row items-center mt-2 flex-wrap">
                        <View className="bg-gray-100 rounded-full px-2 py-1 mr-2 mb-1">
                          <Text className="text-xs font-sans text-gray-600">
                            {relatedFAQ.category.replace('_', ' ')}
                          </Text>
                        </View>
                        {relatedFAQ.tags.slice(0, 2).map((tag, tagIndex) => (
                          <View key={tagIndex} className="bg-gray-50 rounded-full px-2 py-1 mr-2 mb-1">
                            <Text className="text-xs font-sans text-gray-500">#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                    {relatedFAQ._id !== id && (
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" style={{ marginTop: 12 }} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Helpful Feedback Section */}
        <View className="px-6 pb-4">
          <View className="bg-gray-100 rounded-2xl p-5 border border-gray-200">
            <Text className="text-base font-sans-semibold text-gray-900 text-center mb-3">
              {feedbackGiven ? 'Thank you for your feedback!' : 'Was this helpful?'}
            </Text>
            <View className="flex-row justify-center space-x-3">
              <TouchableOpacity
                className={`px-6 py-3 rounded-xl flex-row items-center border flex-1 justify-center mr-2 ${
                  feedbackGiven ? 'bg-gray-200 border-gray-300' : 'bg-white border-gray-200'
                }`}
                onPress={() => handleHelpfulFeedback(true)}
                disabled={feedbackGiven}
              >
                <Ionicons
                  name={feedbackGiven ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={20}
                  color={feedbackGiven ? '#9CA3AF' : '#10B981'}
                  style={{ marginRight: 6 }}
                />
                <Text className={`text-sm font-sans-semibold ${feedbackGiven ? 'text-gray-500' : 'text-gray-700'}`}>
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-6 py-3 rounded-xl flex-row items-center border flex-1 justify-center ml-2 ${
                  feedbackGiven ? 'bg-gray-200 border-gray-300' : 'bg-white border-gray-200'
                }`}
                onPress={() => handleHelpfulFeedback(false)}
                disabled={feedbackGiven}
              >
                <Ionicons
                  name={feedbackGiven ? 'thumbs-down' : 'thumbs-down-outline'}
                  size={20}
                  color={feedbackGiven ? '#9CA3AF' : '#EF4444'}
                  style={{ marginRight: 6 }}
                />
                <Text className={`text-sm font-sans-semibold ${feedbackGiven ? 'text-gray-500' : 'text-gray-700'}`}>
                  No
                </Text>
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