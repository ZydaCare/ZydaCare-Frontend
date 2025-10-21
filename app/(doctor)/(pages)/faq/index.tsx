import { useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { getFAQs, FAQItem } from '@/api/doctor/faq';
import { useToast } from '@/components/ui/Toast';

interface FAQCategory {
  title: string;
  icon: string;
  color: string;
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
  'patients': 'people-outline',
  'schedule': 'time-outline',
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
  'patients': '#F97316',
  'schedule': '#6366F1',
  'default': '#67A9AF'
};

export default function DoctorFAQScreen() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<FAQCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await getFAQs();
      
      if (response.success) {
        const faqCategories: FAQCategory[] = Object.entries(response.data).map(([category, items]) => {
          const formattedCategory = category.toLowerCase();
          return {
            title: category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' '),
            icon: CATEGORY_ICONS[formattedCategory] || CATEGORY_ICONS['default'],
            color: CATEGORY_COLORS[formattedCategory] || CATEGORY_COLORS['default'],
            items: items as FAQItem[]
          };
        });
        
        setCategories(faqCategories);
        setFilteredCategories(faqCategories);
      } else {
        throw new Error('Failed to load FAQs');
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
          faq.answer.toLowerCase().includes(searchLower)
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

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-sans-bold text-gray-900">FAQs</Text>
          <TouchableOpacity onPress={() => router.push('/(doctor)/(pages)/help')}>
            <Ionicons name="help-circle-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="relative mb-6">
          <Ionicons 
            name="search" 
            size={20} 
            color="#9CA3AF" 
            style={{ position: 'absolute', left: 16, top: 14, zIndex: 10 }} 
          />
          <TextInput
            placeholder="Search FAQs..."
            value={searchQuery}
            onChangeText={handleSearch}
            className="bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 font-sans"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#67A9AF']}
            tintColor="#67A9AF"
          />
        }
      >
        {filteredCategories.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-500 text-lg font-sans-medium mt-4">No FAQs found</Text>
            <Text className="text-gray-400 text-center mt-2 font-sans">
              We couldn't find any FAQs matching your search.
            </Text>
          </View>
        ) : (
          filteredCategories.map((category, index) => (
            <View key={index} className="mb-6">
              <View className="flex-row items-center mb-3">
                <View 
                  className="w-10 h-10 rounded-lg items-center justify-center mr-3"
                  style={{ backgroundColor: `${category.color}1A` }}
                >
                  <Ionicons name={category.icon as any} size={20} color={category.color} />
                </View>
                <Text className="text-lg font-sans-bold text-gray-900">{category.title}</Text>
              </View>
              
              <View className="space-y-3">
                {category.items.map((faq, idx) => (
                  <TouchableOpacity
                    key={faq._id}
                    onPress={() => router.push({
                      pathname: '/(doctor)/(pages)/faq/[id]',
                      params: { id: faq._id }
                    })}
                    className="bg-white rounded-xl p-4 border border-gray-100"
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="flex-1 text-base font-sans-medium text-gray-900 pr-2">
                        {faq.question}
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
