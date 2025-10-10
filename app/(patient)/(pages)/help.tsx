import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StatusBar, Image, Linking, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { getFAQs, FAQItem } from '@/api/patient/faq';
import { debounce } from 'lodash';

export default function HelpScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [popularFAQs, setPopularFAQs] = useState<FAQItem[]>([]);
  const [searchResults, setSearchResults] = useState<FAQItem[]>([]);
  const [loadingFAQs, setLoadingFAQs] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();
  const params = useLocalSearchParams();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setSearching(true);
        const response = await getFAQs(undefined, query);
        if (response.success) {
          const allResults = Object.values(response.data).flat();
          setSearchResults(allResults);
        }
      } catch (error) {
        console.error('Search error:', error);
        showToast('Error searching help articles', 'error');
      } finally {
        setSearching(false);
      }
    }, 500),
    []
  );

  // Handle search query changes
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim()) {
      debouncedSearch(text);
    } else {
      setSearchResults([]);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPopularFAQs().finally(() => setRefreshing(false));
  }, []);

  // Load initial data
  useEffect(() => {
    fetchPopularFAQs();
  }, []);

  const fetchPopularFAQs = async () => {
    try {
      setLoadingFAQs(true);
      const response = await getFAQs();
      
      if (response.success) {
        // Flatten all FAQs from all categories and get first 5
        const allFAQs: FAQItem[] = Object.values(response.data)
          .flat()
          .slice(0, 5);
        
        setPopularFAQs(allFAQs);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      showToast('Failed to load help content', 'error');
    } finally {
      setLoadingFAQs(false);
    }
  };

  // Handle category press
  const handleCategoryPress = (categoryId: string) => {
    router.push({
      pathname: '/(patient)/(pages)/faq',
      params: { category: categoryId }
    });
  };

  const handleFAQPress = (faqId: string) => {
    if (!faqId) {
      console.error('Invalid FAQ ID');
      showToast('Invalid FAQ item', 'error');
      return;
    }
    router.push({
      pathname: '/(patient)/(pages)/faq/[id]',
      params: { id: faqId }
    });
  };

  // Render search results
  const renderSearchResults = () => {
    if (!searchQuery.trim()) return null;
    
    if (searching) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#67A9AF" />
          <Text className="text-gray-500 mt-2 font-sans">Searching...</Text>
        </View>
      );
    }

    if (searchResults.length === 0 && searchQuery.trim()) {
      return (
        <View className="py-8 items-center">
          <Ionicons name="search" size={32} color="#9CA3AF" />
          <Text className="text-gray-500 mt-2 font-sans">No results found for "{searchQuery}"</Text>
        </View>
      );
    }

    return (
      <View className="mb-6">
        <Text className="text-lg font-sans-bold text-gray-900 mb-3">
          Search Results for "{searchQuery}"
        </Text>
        <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {searchResults.map((faq, index) => (
            <TouchableOpacity 
              key={faq._id}
              className={`px-4 py-4 flex-row items-center justify-between ${
                index !== searchResults.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onPress={() => handleFAQPress(faq._id)}
            >
              <View className="flex-1 pr-3">
                <Text className="text-gray-800 font-sans-medium leading-5">
                  {faq.question}
                </Text>
              </View>
              <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center">
                <Ionicons name="chevron-forward" size={16} color="#67A9AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  const helpCategories = [
    {
      id: 'appointments',
      title: 'Appointments',
      icon: 'calendar-clock',
      color: '#67A9AF',
      description: 'Booking, rescheduling, or cancelling appointments'
    },
    {
      id: 'prescriptions',
      title: 'Prescriptions',
      icon: 'prescription',
      color: '#8E6C88',
      description: 'Refills, status, and medication questions'
    },
    {
      id: 'billing',
      title: 'Billing & Insurance',
      icon: 'credit-card-check',
      color: '#F4A261',
      description: 'Payments, insurance claims, and receipts'
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: 'account-cog',
      color: '#2A9D8F',
      description: 'Login, security, and personal information'
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: 'tools',
      color: '#E76F51',
      description: 'App issues and troubleshooting'
    }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#67A9AF" />
      
      {/* Header */}
      <View className="bg-primary px-6 pt-8 pb-6 rounded-b-3xl">
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-2xl font-sans-bold text-white">Help Center</Text>
            <Text className="text-white/90 font-sans">How can we help you today?</Text>
          </View>
        </View>
        
        {/* Search Bar */}
        <View className="bg-white rounded-xl px-4 py-2 flex-row items-center">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 py-2 font-sans text-gray-900"
            placeholder="Search help articles..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#67A9AF']}
            tintColor="#67A9AF"
          />
        }
      >
        {/* Show welcome message only when not searching */}
        {/* {!searchQuery.trim() && (
          <View className="mb-6">
            <Text className="text-2xl font-sans-bold text-gray-900 mb-1">
              Hello{user?.firstName ? `, ${user.firstName}` : ''} 👋
            </Text>
            <Text className="text-gray-600 font-sans">
              How can we help you today?
            </Text>
          </View>
        )} */}

        {/* Show search results or regular content */}
        {searchQuery.trim() ? (
          renderSearchResults()
        ) : (
          <>
            {/* Help Categories */}
            <View className="mb-8">
              <Text className="text-lg font-sans-bold text-gray-900 mb-4">Help Categories</Text>
              <View className="flex-row flex-wrap -mx-2">
                {helpCategories.map((category) => (
                  <TouchableOpacity 
                    key={category.id} 
                    className="w-1/2 px-2 mb-4"
                    onPress={() => handleCategoryPress(category.id)}
                  >
                    <View className="bg-white p-4 rounded-xl border border-gray-100 active:border-primary/30 active:bg-primary/5">
                      <View className="w-10 h-10 rounded-lg items-center justify-center mb-2" style={{ backgroundColor: `${category.color}20` }}>
                        <MaterialCommunityIcons 
                          name={category.icon as any} 
                          size={24} 
                          color={category.color} 
                        />
                      </View>
                      <Text className="font-sans-semibold text-gray-900 mb-1">
                        {category.title}
                      </Text>
                      <Text className="text-xs text-gray-500 font-sans">
                        {category.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Popular Questions from FAQ */}
            <View className="mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-sans-bold text-gray-900">Popular Questions</Text>
                <TouchableOpacity 
                  onPress={() => router.push('/(patient)/(pages)/faq')}
                  className="flex-row items-center"
                >
                  <Text className="text-primary font-sans-medium text-sm mr-1">View All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#67A9AF" />
                </TouchableOpacity>
              </View>
              
              <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {loadingFAQs ? (
                  <View className="py-8 items-center">
                    <ActivityIndicator size="small" color="#67A9AF" />
                    <Text className="text-gray-500 font-sans text-sm mt-3">Loading questions...</Text>
                  </View>
                ) : popularFAQs.length > 0 ? (
                  popularFAQs.map((faq, index) => (
                    <TouchableOpacity 
                      key={faq._id}
                      className={`px-4 py-4 flex-row items-center justify-between ${
                        index !== popularFAQs.length - 1 ? 'border-b border-gray-100' : ''
                      } active:bg-gray-50`}
                      onPress={() => handleFAQPress(faq._id)}
                    >
                      <View className="flex-1 pr-3">
                        <Text className="text-gray-800 font-sans-medium leading-5">
                          {faq.question}
                        </Text>
                      </View>
                      <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center">
                        <Ionicons name="chevron-forward" size={16} color="#67A9AF" />
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View className="py-8 items-center">
                    <Ionicons name="help-circle-outline" size={40} color="#9CA3AF" />
                    <Text className="text-gray-500 font-sans mt-2">No help articles found</Text>
                    <TouchableOpacity 
                      className="mt-4 bg-primary/10 px-4 py-2 rounded-lg"
                      onPress={() => router.push('/(patient)/(pages)/supportChat')}
                    >
                      <Text className="text-primary font-sans-medium">Contact Support</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Browse All FAQs Button */}
            <TouchableOpacity 
              className="bg-primary/10 border border-primary/20 rounded-2xl p-5 mb-8 flex-row items-center justify-between"
              onPress={() => router.push('/(patient)/(pages)/faq')}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-primary/20 p-3 rounded-xl mr-4">
                  <Ionicons name="book-outline" size={24} color="#67A9AF" />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-bold text-gray-900 text-base mb-1">
                    Browse All FAQs
                  </Text>
                  <Text className="text-gray-600 text-sm font-sans">
                    Explore our complete knowledge base
                  </Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#67A9AF" />
            </TouchableOpacity>

            {/* Contact Support */}
            <View className="mb-8 bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <View className="flex-row items-start">
                <View className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Ionicons name="chatbubbles" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-bold text-gray-900 text-lg mb-1">Still need help?</Text>
                  <Text className="text-gray-600 text-sm font-sans mb-3">
                    Can't find what you're looking for? Our support team is here to help you 24/7.
                  </Text>
                  <TouchableOpacity 
                    className="bg-primary rounded-full py-3 items-center flex-row justify-center"
                    onPress={() => router.push('/(patient)/(pages)/supportChat')}
                  >
                    <Ionicons name="chatbubble-ellipses" size={18} color="white" />
                    <Text className="text-white font-sans-semibold ml-2">Chat with Support</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Emergency Contact - Only show when not searching */}
            {!searchQuery.trim() && (
              <View className="mb-14 bg-red-50 border border-red-100 rounded-2xl p-5">
                <View className="flex-row items-start">
                  <View className="bg-red-100 p-2 rounded-lg mr-3">
                    <Ionicons name="warning" size={24} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-bold text-red-900 text-lg mb-1">Emergency?</Text>
                    <Text className="text-red-700 text-sm font-sans mb-3">
                      If you're experiencing a medical emergency, please call your local emergency number immediately.
                    </Text>
                    <TouchableOpacity 
                      className="flex-row items-center"
                      onPress={() => {
                        // Nigerian emergency numbers
                        const emergencyNumber = 'tel:112';
                        Linking.openURL(emergencyNumber).catch(err => {
                          console.error('Error opening phone app:', err);
                          showToast(
                            'Could not open the phone app. Please dial 112 (Nigeria Emergency) manually.',
                            'error'
                          );
                        });
                      }}
                    >
                      <Ionicons name="call" size={16} color="#EF4444" />
                      <Text className="text-red-600 font-sans-semibold ml-2">Call 112 (Nigeria Emergency)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};