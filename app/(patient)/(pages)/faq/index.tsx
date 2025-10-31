import { Link, useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { getFAQs, getFeaturedFAQs, getPopularFAQs, FAQItem } from '@/api/patient/faq';
import { useToast } from '@/components/ui/Toast';

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const CATEGORY_ICONS: Record<string, string> = {
  'general': 'help-circle-outline',
  'account': 'person-outline',
  'payments': 'card-outline',
  'appointments': 'calendar-outline',
  'privacy': 'shield-checkmark-outline',
  'technical': 'phone-portrait-outline',
  'billing': 'cash-outline',
  'prescriptions': 'medical-outline',
  'patient': 'fitness-outline',
  'doctor': 'medkit-outline',
  'medical_records': 'document-text-outline',
  'default': 'help-outline'
};

const CATEGORY_COLORS: Record<string, string> = {
  'general': '#67A9AF',
  'account': '#8B5CF6',
  'payments': '#10B981',
  'appointments': '#F59E0B',
  'privacy': '#EF4444',
  'technical': '#3B82F6',
  'billing': '#EC4899',
  'prescriptions': '#14B8A6',
  'patient': '#06B6D4',
  'doctor': '#8B5CF6',
  'medical_records': '#F59E0B',
  'default': '#67A9AF'
};

export default function FAQScreen() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<FAQCategory[]>([]);
  const [featuredFAQs, setFeaturedFAQs] = useState<FAQItem[]>([]);
  const [popularFAQs, setPopularFAQs] = useState<FAQItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [faqsResponse, featuredResponse, popularResponse] = await Promise.all([
        getFAQs(undefined, undefined, 'patient'),
        getFeaturedFAQs('patient', 3),
        getPopularFAQs('patient', 5)
      ]);
      
      if (faqsResponse.success) {
        const faqCategories: FAQCategory[] = Object.entries(faqsResponse.data).map(([category, items]) => ({
          title: category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' '),
          icon: CATEGORY_ICONS[category] || CATEGORY_ICONS['default'],
          items: items as FAQItem[]
        }));
        
        setCategories(faqCategories);
        setFilteredCategories(faqCategories);
      }
      
      if (featuredResponse.success) {
        setFeaturedFAQs(featuredResponse.data);
      }
      
      if (popularResponse.success) {
        setPopularFAQs(popularResponse.data);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      showToast('Failed to load FAQs. Please try again.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredCategories(categories);
      return;
    }

    const searchLower = query.toLowerCase().trim();
    
    const filtered = categories
      .map(category => ({
        ...category,
        items: category.items.filter(faq => 
          faq.question.toLowerCase().includes(searchLower) ||
          faq.answer.toLowerCase().includes(searchLower) ||
          (faq.shortAnswer && faq.shortAnswer.toLowerCase().includes(searchLower)) ||
          (faq.tags && faq.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        )
      }))
      .filter(category => category.items.length > 0);
    
    setFilteredCategories(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchFAQs();
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const getCategoryColor = (categoryTitle: string): string => {
    const key = categoryTitle.toLowerCase().replace(/\s+/g, '_');
    return CATEGORY_COLORS[key] || CATEGORY_COLORS['default'];
  };

  const navigateToFAQ = (faqId: string) => {
    if (!faqId) {
      console.error('Invalid FAQ ID:', faqId);
      showToast('Invalid FAQ item', 'error');
      return;
    }
    router.push({
      pathname: '/(patient)/(pages)/faq/[id]',
      params: { id: faqId }
    });
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header Section */}
      <View className="px-6 pt-6 pb-4 bg-white border-b border-gray-100">
        <Text className="text-3xl font-sans-bold text-gray-900 mb-2">FAQ Center</Text>
        <Text className="text-sm font-sans text-gray-500">Find answers to your questions</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#67A9AF']}
            tintColor="#67A9AF"
          />
        }
      >
        {/* Search Bar */}
        <View className="px-6 pt-6 pb-4">
          <View className="bg-white rounded-2xl shadow-md px-5 py-4 flex-row items-center border border-gray-100">
            <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
              <Ionicons name="search" size={20} color="#67A9AF" />
            </View>
            <TextInput
              className="flex-1 ml-4 text-base font-sans text-gray-900"
              placeholder="Search for help..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                onPress={() => handleSearch('')}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={16} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Featured FAQs Section */}
        {featuredFAQs.length > 0 && !searchQuery && (
          <View className="px-6 pb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-1 h-6 bg-amber-500 rounded-full mr-3" />
              <Text className="text-lg font-sans-bold text-gray-900">Featured Questions</Text>
              <View className="ml-2 bg-amber-50 rounded-full px-2 py-0.5">
                <Text className="text-xs font-sans-bold text-amber-600">★ POPULAR</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
              {featuredFAQs.map((faq) => (
                <TouchableOpacity
                  key={faq._id}
                  onPress={() => navigateToFAQ(faq._id)}
                  className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 mr-4 w-72 border border-amber-200"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start mb-3">
                    <View className="w-10 h-10 bg-amber-500 rounded-xl items-center justify-center mr-3">
                      <Ionicons name="star" size={20} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-sans-bold text-amber-600 mb-1">FEATURED</Text>
                      <Text className="text-base font-sans-bold text-gray-900 leading-5" numberOfLines={2}>
                        {faq.question}
                      </Text>
                    </View>
                  </View>
                  {faq.shortAnswer && (
                    <Text className="text-sm font-sans text-gray-600 leading-5 mb-3" numberOfLines={2}>
                      {faq.shortAnswer}
                    </Text>
                  )}
                  <View className="flex-row items-center justify-between pt-3 border-t border-amber-200">
                    <View className="flex-row items-center">
                      <Ionicons name="eye-outline" size={14} color="#D97706" />
                      <Text className="text-xs font-sans text-amber-700 ml-1">{faq.viewCount} views</Text>
                    </View>
                    <View className="flex-row items-center bg-white rounded-full px-2 py-1">
                      <Text className="text-xs font-sans-medium text-amber-600">Read more</Text>
                      <Ionicons name="arrow-forward" size={12} color="#D97706" style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular FAQs Section */}
        {popularFAQs.length > 0 && !searchQuery && (
          <View className="px-6 pb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-1 h-6 bg-blue-500 rounded-full mr-3" />
              <Text className="text-lg font-sans-bold text-gray-900">Trending Questions</Text>
              <View className="ml-2 bg-blue-50 rounded-full px-2 py-0.5">
                <Text className="text-xs font-sans-bold text-blue-600">🔥 HOT</Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {popularFAQs.map((faq, index) => (
                <TouchableOpacity
                  key={faq._id}
                  onPress={() => navigateToFAQ(faq._id)}
                  className={`px-5 py-4 ${index !== popularFAQs.length - 1 ? 'border-b border-gray-100' : ''}`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-start">
                    <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3 mt-0.5">
                      <Text className="text-sm font-sans-bold text-blue-600">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-sans-semibold text-gray-800 leading-5 mb-2">
                        {faq.question}
                      </Text>
                      {faq.tags && faq.tags.length > 0 && (
                        <View className="flex-row flex-wrap mb-2">
                          {faq.tags.slice(0, 3).map((tag, tagIndex) => (
                            <View key={tagIndex} className="bg-gray-100 rounded-full px-2 py-1 mr-2 mb-1">
                              <Text className="text-xs font-sans text-gray-600">#{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      <View className="flex-row items-center">
                        <Ionicons name="eye-outline" size={14} color="#6B7280" />
                        <Text className="text-xs font-sans text-gray-500 ml-1">{faq.viewCount} views</Text>
                        <Ionicons name="thumbs-up-outline" size={14} color="#6B7280" style={{ marginLeft: 12 }} />
                        <Text className="text-xs font-sans text-gray-500 ml-1">{faq.helpfulCount} helpful</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View className="px-6 pb-8">
          {filteredCategories.length > 0 ? (
            <>
              {searchQuery.length > 0 && (
                <View className="mb-6 px-4 py-3 bg-primary/5 rounded-xl border border-primary/20">
                  <Text className="text-sm font-sans-medium text-primary">
                    🔍 Found {filteredCategories.reduce((acc, cat) => acc + cat.items.length, 0)} result(s) for "{searchQuery}"
                  </Text>
                </View>
              )}
              
              {!searchQuery && (
                <View className="flex-row items-center mb-4 mt-4">
                  <View className="w-1 h-6 bg-primary rounded-full mr-3" />
                  <Text className="text-lg font-sans-bold text-gray-900">Browse by Category</Text>
                </View>
              )}
              
              {filteredCategories.map((category) => {
                const categoryColor = getCategoryColor(category.title);
                return (
                  <View key={category.title} className="mb-8">
                    {/* Category Header */}
                    <View className="flex-row items-center mb-4">
                      <View 
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                        style={{ backgroundColor: `${categoryColor}15` }}
                      >
                        <Ionicons 
                          name={category.icon as any} 
                          size={24} 
                          color={categoryColor}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-xl font-sans-bold text-gray-900">
                          {category.title}
                        </Text>
                        <Text className="text-xs font-sans text-gray-500 mt-0.5">
                          {category.items.length} {category.items.length === 1 ? 'question' : 'questions'}
                        </Text>
                      </View>
                    </View>
                    
                    {/* FAQ Items */}
                    <View className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                      {category.items.map((faq, index) => (
                        <TouchableOpacity 
                          key={faq._id} 
                          onPress={() => navigateToFAQ(faq._id)}
                          className={`px-5 py-4 ${index !== category.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-center">
                            <View className="flex-1 pr-3">
                              <Text className="text-base font-sans-medium text-gray-800 leading-6 mb-1">
                                {faq.question}
                              </Text>
                              {faq.shortAnswer && (
                                <Text className="text-sm font-sans text-gray-500 leading-5 mb-2" numberOfLines={2}>
                                  {faq.shortAnswer}
                                </Text>
                              )}
                              {faq.tags && faq.tags.length > 0 && (
                                <View className="flex-row flex-wrap mt-1">
                                  {faq.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <View key={tagIndex} className="bg-gray-100 rounded-full px-2 py-0.5 mr-2 mb-1">
                                      <Text className="text-xs font-sans text-gray-600">#{tag}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                            <View 
                              className="w-8 h-8 rounded-full items-center justify-center"
                              style={{ backgroundColor: `${categoryColor}10` }}
                            >
                              <Ionicons 
                                name="chevron-forward" 
                                size={18} 
                                color={categoryColor}
                              />
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <View className="items-center justify-center py-16 px-6">
              <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
                <Ionicons 
                  name={searchQuery ? "search" : "help-circle-outline"} 
                  size={48} 
                  color="#D1D5DB" 
                />
              </View>
              <Text className="text-xl font-sans-semibold text-gray-900 mb-2 text-center">
                {searchQuery ? 'No Results Found' : 'No FAQs Available'}
              </Text>
              <Text className="text-base text-gray-500 font-sans text-center mb-6">
                {searchQuery 
                  ? `We couldn't find any FAQs matching "${searchQuery}"`
                  : 'FAQs will appear here once available'}
              </Text>
              {searchQuery && (
                <TouchableOpacity 
                  onPress={() => handleSearch('')}
                  className="bg-primary px-6 py-3 rounded-xl flex-row items-center"
                >
                  <Ionicons name="close-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text className="text-white font-sans-semibold">Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          {/* Contact Support Card */}
          <View className="mt-6 mb-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
            <View className="flex-row items-start mb-4">
              <View className="w-12 h-12 bg-primary rounded-2xl items-center justify-center mr-4">
                <Ionicons name="chatbubbles" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-sans-bold text-gray-900 mb-1">
                  Need More Help?
                </Text>
                <Text className="text-sm font-sans text-gray-600 leading-5">
                  Can't find what you're looking for? Our support team is ready to assist you.
                </Text>
              </View>
            </View>
            <Link href="/(patient)/(pages)/help" asChild>
              <TouchableOpacity className="bg-primary px-6 py-3.5 rounded-xl flex-row items-center justify-center shadow-sm">
                <Ionicons name="headset-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-sans-bold text-base">Contact Support</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}