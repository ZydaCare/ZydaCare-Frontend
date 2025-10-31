import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { Notification, getNotifications } from '@/api/admin/notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDistanceToNow } from 'date-fns';

const NotificationsScreen = () => {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const loadNotifications = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const params: any = {
        page: pageNum,
        limit: 20,
      };

      if (selectedFilter !== 'all') {
        params.recipientType = selectedFilter;
      }

      const response = await getNotifications(params);
      
      // Handle mongoose-paginate-v2 response structure
      // Backend spreads pagination result: { success, docs, totalDocs, page, totalPages, ... }
      const newNotifications = response.docs || [];
      
      if (refresh || pageNum === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }

      // Check if there are more pages
      const currentPage = response.page || pageNum;
      const totalPages = response.totalPages || 1;
      setHasMore(currentPage < totalPages);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
      showToast('Failed to load notifications', 'error');
      // Initialize with empty array on error
      if (pageNum === 1) {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNotifications(1, true);
  }, [selectedFilter]);

  const handleRefresh = () => {
    setPage(1);
    loadNotifications(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadNotifications(nextPage);
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const getIcon = () => {
      switch (item.type) {
        case 'alert':
          return { name: 'alert-circle', color: '#EF4444' };
        case 'warning':
          return { name: 'warning', color: '#F59E0B' };
        case 'update':
          return { name: 'refresh-circle', color: '#8B5CF6' };
        case 'promotion':
          return { name: 'pricetag', color: '#EC4899' };
        case 'appointment':
          return { name: 'calendar', color: '#10B981' };
        case 'payment':
          return { name: 'card', color: '#6366F1' };
        case 'message':
          return { name: 'chatbubbles', color: '#3B82F6' };
        case 'reminder':
          return { name: 'time', color: '#8B5CF6' };
        default:
          return { name: 'notifications', color: '#6B7280' };
      }
    };

    const icon = getIcon();
    
    return (
      <TouchableOpacity 
        className="bg-white rounded-xl p-4 mb-3 shadow-sm"
        onPress={() => router.push(`/(admin)/(pages)/notifications/${item._id}`)}
      >
        <View className="flex-row items-start">
          <View className="bg-gray-100 p-2 rounded-full mr-3">
            <Ionicons name={icon.name as any} size={20} color={icon.color} />
          </View>
          <View className="flex-1">
            <View className="flex-row justify-between items-start">
              <Text className="font-sans-semibold text-base text-gray-900 flex-1 mr-2" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-xs text-gray-400 font-sans">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </Text>
            </View>
            <Text className="text-gray-600 text-sm mt-1 font-sans" numberOfLines={2}>
              {item.message}
            </Text>
            <View className="flex-row items-center mt-2">
              <View 
                className={`px-2 py-0.5 rounded-full ${
                  item.status === 'sent' ? 'bg-green-100' : 
                  item.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                }`}
              >
                <Text 
                  className={`text-xs font-sans-medium ${
                    item.status === 'sent' ? 'text-green-800' : 
                    item.status === 'pending' ? 'text-yellow-800' : 'text-red-800'
                  }`}
                >
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
              <View className="bg-gray-100 rounded-full px-2 py-0.5 ml-2">
                <Text className="text-xs text-gray-600 font-sans-medium">
                  {item.recipientType === 'all' ? 'All Users' : 
                   item.recipientType === 'patients' ? 'Patients' :
                   item.recipientType === 'doctors' ? 'Doctors' : 'Specific User'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center py-10">
      <Ionicons name="notifications-off-outline" size={48} color="#9CA3AF" />
      <Text className="text-gray-500 text-lg font-sans-medium mt-4">
        No notifications found
      </Text>
      <Text className="text-gray-400 text-center mt-2 font-sans">
        {selectedFilter === 'all' 
          ? 'You haven\'t sent any notifications yet.'
          : `No ${selectedFilter} notifications found.`}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading || !hasMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#67A9AF" />
      </View>
    );
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'all_users', label: 'All Users' },
    { id: 'patients', label: 'Patients' },
    { id: 'doctors', label: 'Doctors' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="p-2 -ml-2 mr-2"
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-sans-bold text-gray-900">
              Notifications
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(admin)/(pages)/notifications/new')}
            className="p-2 bg-primary rounded-full"
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mt-4 -mx-4 px-4"
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedFilter === filter.id 
                  ? 'bg-primary' 
                  : 'bg-gray-100'
              }`}
            >
              <Text 
                className={`text-sm font-sans-medium ${
                  selectedFilter === filter.id 
                    ? 'text-white' 
                    : 'text-gray-600'
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Notifications List */}
      <View className="flex-1 px-4 py-2">
        {loading && notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#67A9AF" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            renderItem={renderNotificationItem}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#67A9AF']}
                tintColor="#67A9AF"
              />
            }
            contentContainerStyle={{
              paddingBottom: 20,
              flexGrow: 1,
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default NotificationsScreen;