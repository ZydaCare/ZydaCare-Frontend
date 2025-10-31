import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  TextInput,
  RefreshControl,
  ScrollView,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { getFAQs, toggleFAQStatus, FAQ, FAQStats, searchFAQs, getFAQStats, toggleFeaturedStatus, getFAQCategories } from '@/api/admin/faqs';

type FilterParams = {
  category?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  search?: string;
  sort?: string;
};

const FAQListScreen = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<FAQStats | null>(null);
  const [categories, setCategories] = useState<Array<{_id: string; count: number; subcategories: string[]}>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterParams>({
    category: undefined,
    isFeatured: undefined,
    isActive: true,
    sort: '-createdAt',
  });
  const [showFilters, setShowFilters] = useState(false);
  
  const router = useRouter();
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [faqsData, statsData, categoriesData] = await Promise.all([
        getFAQs(filters),
        getFAQStats(),
        getFAQCategories()
      ]);
      
      setFaqs(faqsData.data);
      setFilteredFaqs(faqsData.data);
      setStats(statsData.overview);
      // Map the categories to match our expected format
      const mappedCategories = categoriesData.map((cat: { _id: string; count: number; subcategories?: string[] }) => ({
        _id: cat._id,
        count: cat.count,
        subcategories: cat.subcategories || []
      }));
      setCategories(mappedCategories);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, showToast]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }
    
    try {
      setLoading(true);
      const searchResults = await searchFAQs(searchQuery, filters);
      setFilteredFaqs(searchResults.data);
    } catch (error) {
      console.error('Search error:', error);
      showToast('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filters, showToast, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updatedFAQ = await toggleFAQStatus(id);
      setFaqs(faqs.map(faq => 
        faq._id === id ? updatedFAQ : faq
      ));
      showToast('FAQ status updated successfully', 'success');
    } catch (error) {
      console.error('Error toggling FAQ status:', error);
      showToast('Failed to update FAQ status', 'error');
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      const updatedFAQ = await toggleFeaturedStatus(id);
      setFaqs(faqs.map(faq => 
        faq._id === id ? updatedFAQ : faq
      ));
      showToast('Featured status updated', 'success');
    } catch (error) {
      console.error('Error toggling featured status:', error);
      showToast('Failed to update featured status', 'error');
    }
  };

  const applyFilters = (newFilters: Partial<FilterParams>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setShowFilters(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setFilteredFaqs(faqs);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, faqs, handleSearch]);

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
          <ActivityIndicator size="large" color="#67A9AF" />
        </View>
        <Text className="text-base font-sans-medium text-gray-600">Loading FAQs...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 bg-white border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-3xl font-sans-bold text-gray-900">FAQ Management</Text>
            <Text className="text-sm font-sans text-gray-500">Manage your frequently asked questions</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(admin)/(pages)/faqs/create')}
            className="bg-primary p-3 rounded-xl flex-row items-center"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-sans-medium ml-1">New FAQ</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        {stats && (
          <View className="flex-row flex-wrap -mx-2 mt-4">
            <StatCard 
              icon="help-circle" 
              label="Total FAQs" 
              value={stats.totalFAQs} 
              color="blue"
            />
            <StatCard 
              icon="eye" 
              label="Total Views" 
              value={stats.totalViews} 
              color="green"
            />
            <StatCard 
              icon="star" 
              label="Featured" 
              value={stats.featuredFAQs} 
              color="amber"
            />
            <StatCard 
              icon="checkmark-circle" 
              label="Active" 
              value={stats.activeFAQs} 
              color="green"
            />
          </View>
        )}

        {/* Search and Filters */}
        <View className="mt-6 flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-1">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 font-sans text-gray-900"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            onPress={() => setShowFilters(true)}
            className="w-12 h-13 bg-white border border-gray-200 rounded-xl items-center justify-center"
          >
            <Ionicons name="options" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredFaqs}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#67A9AF']}
            tintColor="#67A9AF"
          />
        }
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-16 px-6">
            <Ionicons name="help-circle-outline" size={48} color="#D1D5DB" />
            <Text className="text-lg font-sans-semibold text-gray-900 mt-4">
              No FAQs found
            </Text>
            <Text className="text-gray-500 font-sans text-center mt-2 mb-6">
              {searchQuery 
                ? 'No FAQs match your search criteria.'
                : 'Create your first FAQ to get started.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                onPress={() => router.push('/(admin)/(pages)/faqs/create')}
                className="bg-primary px-6 py-3 rounded-xl flex-row items-center"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-sans-medium ml-2">Create FAQ</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  {item.isFeatured && (
                    <View className="bg-amber-50 rounded-full px-2 py-1 flex-row items-center mr-2">
                      <Ionicons name="star" size={12} color="#D97706" />
                      <Text className="text-amber-700 text-xs font-sans-medium ml-1">
                        Featured
                      </Text>
                    </View>
                  )}
                  <View className="bg-primary/10 rounded-full px-2 py-1">
                    <Text className="text-primary text-xs font-sans-medium">
                      {item.category.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                
                <Text className="text-base font-sans-semibold text-gray-900 mb-1">
                  {item.question}
                </Text>
                
                {item.shortAnswer && (
                  <Text className="text-sm text-gray-600 font-sans mb-3" numberOfLines={2}>
                    {item.shortAnswer}
                  </Text>
                )}
                
                <View className="flex-row items-center justify-between mt-3 flex-1">
                  <View className="flex-row items-center gap-3">
                    <View className={`px-2 py-1 rounded-full ${item.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Text className={`text-xs font-sans-medium ${item.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center">
                      <Ionicons name="eye-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-500 font-sans ml-1">
                        {item.viewCount}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center">
                      <Ionicons name="thumbs-up-outline" size={14} color="#6B7280" />
                      <Text className="text-xs text-gray-500 font-sans ml-1">
                        {item.helpfulCount}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-xs text-gray-400 font-sans">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View className="flex-row gap-3 ml-2">
                <TouchableOpacity
                  onPress={() => handleToggleFeatured(item._id)}
                  className={`p-2 rounded-lg ${item.isFeatured ? 'bg-amber-50' : 'bg-gray-50'}`}
                >
                  <Ionicons 
                    name={item.isFeatured ? 'star' : 'star-outline'} 
                    size={18} 
                    color={item.isFeatured ? '#D97706' : '#6B7280'} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => router.push(`/(admin)/(pages)/faqs/${item._id}`)}
                  className="p-2 bg-gray-50 rounded-lg"
                >
                  <Ionicons name="create-outline" size={18} color="#4B5563" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleToggleStatus(item._id)}
                  className="p-2 bg-gray-50 rounded-lg"
                >
                  <Ionicons 
                    name={item.isActive ? 'eye-off-outline' : 'eye-outline'} 
                    size={18} 
                    color={item.isActive ? '#EF4444' : '#6B7280'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
      
      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-3/4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-sans-bold text-gray-900">Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <View className="mb-6">
                <Text className="text-sm font-sans-medium text-gray-500 mb-3">Category</Text>
                <View className="flex-row flex-wrap -mx-1">
                  <TouchableOpacity
                    onPress={() => applyFilters({ category: undefined })}
                    className={`px-3 py-2 rounded-lg mx-1 mb-2 ${!filters.category ? 'bg-primary' : 'bg-gray-100'}`}
                  >
                    <Text className={`text-sm font-sans ${!filters.category ? 'text-white' : 'text-gray-700'}`}>
                      All Categories
                    </Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat._id}
                      onPress={() => applyFilters({ category: cat._id })}
                      className={`px-3 py-2 rounded-lg mx-1 mb-2 ${filters.category === cat._id ? 'bg-primary' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-sm font-sans ${filters.category === cat._id ? 'text-white' : 'text-gray-700'}`}>
                        {cat._id} ({cat.count})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View className="mb-6">
                <Text className="text-sm font-sans-medium text-gray-500 mb-3">Status</Text>
                <View className="flex-row flex-wrap -mx-1">
                  {[
                    { value: undefined, label: 'All' },
                    { value: true, label: 'Active' },
                    { value: false, label: 'Inactive' },
                  ].map(({ value, label }) => (
                    <TouchableOpacity
                      key={String(value)}
                      onPress={() => applyFilters({ isActive: value })}
                      className={`px-3 py-2 rounded-lg mx-1 mb-2 ${filters.isActive === value ? 'bg-primary' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-sm font-sans ${filters.isActive === value ? 'text-white' : 'text-gray-700'}`}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View className="mb-6">
                <Text className="text-sm font-sans-medium text-gray-500 mb-3">Featured</Text>
                <View className="flex-row flex-wrap -mx-1">
                  {[
                    { value: undefined, label: 'All' },
                    { value: true, label: 'Featured' },
                    { value: false, label: 'Not Featured' },
                  ].map(({ value, label }) => (
                    <TouchableOpacity
                      key={String(value)}
                      onPress={() => applyFilters({ isFeatured: value })}
                      className={`px-3 py-2 rounded-lg mx-1 mb-2 ${filters.isFeatured === value ? 'bg-primary' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-sm font-sans ${filters.isFeatured === value ? 'text-white' : 'text-gray-700'}`}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View className="mb-6">
                <Text className="text-sm font-sans-medium text-gray-500 mb-3">Sort By</Text>
                <View className="flex-row flex-wrap -mx-1">
                  {[
                    { value: '-createdAt', label: 'Newest' },
                    { value: 'createdAt', label: 'Oldest' },
                    { value: 'question', label: 'A-Z' },
                    { value: '-viewCount', label: 'Most Viewed' },
                    { value: '-helpfulCount', label: 'Most Helpful' },
                  ].map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      onPress={() => applyFilters({ sort: value })}
                      className={`px-3 py-2 rounded-lg mx-1 mb-2 ${filters.sort === value ? 'bg-primary' : 'bg-gray-100'}`}
                    >
                      <Text className={`text-sm font-sans ${filters.sort === value ? 'text-white' : 'text-gray-700'}`}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
            
            <View className="flex-row gap-4 mt-4">
              <TouchableOpacity
                onPress={() => {
                  setFilters({
                    category: undefined,
                    isFeatured: undefined,
                    isActive: true,
                    sort: '-createdAt',
                  });
                  setSearchQuery('');
                  setShowFilters(false);
                }}
                className="flex-1 border border-gray-300 rounded-xl py-3 items-center"
              >
                <Text className="text-gray-700 font-sans-medium">Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                className="flex-1 bg-primary rounded-xl py-3 items-center"
              >
                <Text className="text-white font-sans-medium">Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Stat Card Component
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: 'primary' | 'blue' | 'green' | 'amber' | 'red';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color = 'primary' }) => {
  // Define color classes based on the color prop
  const bgColor = color === 'primary' ? 'bg-primary/10' : 
                 color === 'blue' ? 'bg-blue-100' :
                 color === 'green' ? 'bg-green-100' :
                 color === 'amber' ? 'bg-amber-100' : 'bg-red-100';
                 
  const textColor = color === 'primary' ? 'text-primary' : 
                   color === 'blue' ? 'text-blue-700' :
                   color === 'green' ? 'text-green-700' :
                   color === 'amber' ? 'text-amber-700' : 'text-red-700';
  
  return (
    <View className="w-1/2 p-2">
      <View className={`p-4 rounded-xl ${bgColor}`}>
        <View className="flex-row items-center justify-between">
          <View className="p-2 rounded-lg bg-white/20">
            <Ionicons name="help-circle" size={20} color={textColor} />
          </View>
          <Text className={`text-xs font-sans-medium ${textColor} opacity-80`}>{label}</Text>
        </View>
        <Text className={`mt-2 text-2xl font-sans-bold ${textColor}`}>{value}</Text>
      </View>
    </View>
  );
};

export default FAQListScreen;
