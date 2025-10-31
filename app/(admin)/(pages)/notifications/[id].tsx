import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { getNotificationById, Notification } from '@/api/admin/notifications';
import { format } from 'date-fns';

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotification = async () => {
      try {
        setLoading(true);
        const response = await getNotificationById(id as string);
        // Backend returns { success: true, data: notification }
        setNotification(response.data);
      } catch (error: any) {
        console.error('Error loading notification:', error);
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load notification';
        showToast(errorMessage, 'error');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadNotification();
    }
  }, [id]);

  const getIcon = () => {
    if (!notification) return { name: 'notifications', color: '#6B7280' };
    
    switch (notification.type) {
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

  const getRecipientLabel = () => {
    if (!notification) return '';
    
    switch (notification.recipientType) {
      case 'all':
        return 'All Users';
      case 'patients':
        return 'All Patients';
      case 'doctors':
        return 'All Doctors';
      case 'specific_user':
        return 'Specific User';
      default:
        return notification.recipientType || '';
    }
  };

  const handleOpenLink = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      Linking.openURL(url).catch(err => {
        console.error('Failed to open URL:', err);
        showToast('Could not open the link', 'error');
      });
    } else {
      // Handle deep linking within the app
      router.push(url);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </SafeAreaView>
    );
  }

  if (!notification) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text className="text-lg font-sans-medium text-gray-900 mt-4 text-center">
          Notification not found
        </Text>
        <Text className="text-gray-500 text-center mt-2 font-sans">
          The notification you're looking for doesn't exist or has been deleted.
        </Text>
        <TouchableOpacity
          className="mt-6 bg-primary rounded-lg px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-sans-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const icon = getIcon();
  const formattedCreatedAt = notification.createdAt 
    ? format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')
    : 'N/A';
  const formattedScheduledAt = notification.scheduledAt 
    ? format(new Date(notification.scheduledAt), 'MMM d, yyyy h:mm a')
    : 'Immediately';
  const formattedExpiresAt = notification.expiresAt 
    ? format(new Date(notification.expiresAt), 'MMM d, yyyy h:mm a')
    : 'Never';
  const statusLabel = notification.status 
    ? notification.status.charAt(0).toUpperCase() + notification.status.slice(1)
    : 'Unknown';

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 -ml-2 mr-2"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-gray-900">
            Notification Details
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Notification Header */}
        <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <View className="flex-row items-start">
            <View 
              className="p-3 rounded-full mr-3"
              style={{ backgroundColor: `${icon.color}20` }}
            >
              <Ionicons name={icon.name as any} size={24} color={icon.color} />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-sans-bold text-gray-900">
                {notification.title}
              </Text>
              <Text className="text-gray-500 text-sm mt-1 font-sans">
                {formattedCreatedAt}
              </Text>
            </View>
          </View>
          
          <View className="mt-4">
            <Text className="text-gray-800 font-sans">
              {notification.message}
            </Text>
          </View>
        </View>

        {/* Details Section */}
        <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <Text className="text-lg font-sans-bold text-gray-900 mb-4">
            Details
          </Text>
          
          <View className="space-y-3">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500 font-sans">Status</Text>
              <View className={`px-2 py-1 rounded-full ${
                notification.status === 'sent' ? 'bg-green-100' : 
                notification.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <Text className={`text-xs font-sans-medium ${
                  notification.status === 'sent' ? 'text-green-800' : 
                  notification.status === 'pending' ? 'text-yellow-800' : 'text-red-800'
                }`}>
                  {statusLabel}
                </Text>
              </View>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500 font-sans">Recipients</Text>
              <Text className="text-gray-900 font-sans-medium">
                {getRecipientLabel()}
              </Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500 font-sans">Type</Text>
              <Text className="text-gray-900 font-sans-medium capitalize">
                {notification.type?.replace('_', ' ') || 'General'}
              </Text>
            </View>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500 font-sans">Scheduled</Text>
              <Text className="text-gray-900 font-sans-medium">
                {formattedScheduledAt}
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-gray-500 font-sans">Expires</Text>
              <Text className="text-gray-900 font-sans-medium">
                {formattedExpiresAt}
              </Text>
            </View>
          </View>
        </View>

        {/* Additional Data Section */}
        {notification.data && Object.keys(notification.data).length > 0 && (
          <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
            <Text className="text-lg font-sans-bold text-gray-900 mb-4">
              Additional Data
            </Text>
            <View className="bg-gray-50 rounded-lg p-3">
              {Object.entries(notification.data).map(([key, value]) => {
                // Skip if value is null, undefined, or empty string
                if (value === null || value === undefined || value === '') return null;
                
                // Handle URL values
                const isUrl = typeof value === 'string' && 
                  (value.startsWith('http://') || value.startsWith('https://') || 
                   value.startsWith('/'));
                
                return (
                  <View key={key} className="mb-2">
                    <Text className="text-sm font-sans-medium text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                    {isUrl ? (
                      <TouchableOpacity 
                        onPress={() => handleOpenLink(value as string)}
                        className="mt-1"
                      >
                        <Text className="text-primary font-sans-medium">
                          {value}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text className="text-gray-900 font-sans mt-1">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Error Message (if any) */}
        {notification.error && (
          <View className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg mb-6">
            <View className="flex-row">
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-sans-medium text-red-800">
                  Error Details
                </Text>
                <Text className="text-sm text-red-700 mt-1 font-sans">
                  {notification.error}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats Section */}
        <View className="bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-sans-bold text-gray-900 mb-4">
            Statistics
          </Text>
          <View className="space-y-3">
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500 font-sans">Read By</Text>
              <Text className="text-gray-900 font-sans-medium">
                {notification.readBy?.length || 0} users
              </Text>
            </View>
            
            {notification.sentAt && (
              <View className="flex-row justify-between">
                <Text className="text-gray-500 font-sans">Sent At</Text>
                <Text className="text-gray-900 font-sans-medium">
                  {format(new Date(notification.sentAt), 'MMM d, yyyy h:mm a')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View className="p-4 border-t border-gray-100 bg-white">
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 bg-white border border-gray-300 rounded-lg py-3 items-center mr-3"
            onPress={() => router.back()}
          >
            <Text className="text-gray-900 font-sans-medium">Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 rounded-lg py-3 items-center ${
              notification.status === 'pending' ? 'bg-gray-300' : 'bg-primary'
            }`}
            onPress={() => {
              // TODO: Implement resend functionality
              showToast('Resend functionality will be implemented here', 'info');
            }}
            disabled={notification.status === 'pending'}
          >
            <Text className={`font-sans-medium ${
              notification.status === 'pending' ? 'text-gray-500' : 'text-white'
            }`}>
              {notification.status === 'pending' ? 'Sending...' : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}