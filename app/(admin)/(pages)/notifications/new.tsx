import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { createNotification } from '@/api/admin/notifications';
import NotificationForm from '@/components/notifications/NotificationForm';

export default function NewNotificationScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Prepare the notification data
      const notificationData = {
        ...data,
        // Ensure we don't send recipient if it's not a specific user
        recipient: data.recipientType === 'specific_user' ? data.recipient : undefined,
      };

      // Send the notification - backend returns { success: true, data: notification }
      const response = await createNotification(notificationData);
      
      // Show success message
      showToast('Notification sent successfully', 'success');
      
      // Navigate back to notifications list after a short delay
      setTimeout(() => {
        router.replace('/(admin)/(pages)/notifications');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error sending notification:', error);
      
      // Extract error message from different error formats
      let errorMessage = 'Failed to send notification';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 -ml-2 mr-2"
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-gray-900">
            New Notification
          </Text>
        </View>
        
        {isSubmitting && (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#67A9AF" style={{ marginRight: 8 }} />
            <Text className="text-primary font-sans-medium">Sending...</Text>
          </View>
        )}
      </View>

      {/* Notification Form */}
      <View className="flex-1">
        <NotificationForm 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}