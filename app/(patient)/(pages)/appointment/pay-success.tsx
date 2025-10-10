import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';

export default function PaymentSuccessScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { showToast } = useToast();
  const { token } = useAuth();

  const handleViewAppointment = () => {
    if (bookingId) {
      router.replace({
        pathname: '/(patient)/(tabs)/appointment',
        params: { id: bookingId }
      });
    } else {
      router.replace('/(patient)/(tabs)/appointment');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <View className="items-center">
          <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-6">
            <Ionicons name="checkmark-done" size={48} color="#10B981" />
          </View>
          
          <Text className="text-2xl font-sans-bold text-gray-900 mb-2 text-center">
            Payment Successful!
          </Text>
          
          <Text className="text-base font-sans text-gray-600 text-center mb-8">
            Your appointment has been confirmed. We've sent you a confirmation email with all the details.
          </Text>
          
          <TouchableOpacity
            onPress={handleViewAppointment}
            className="bg-primary w-full p-4 rounded-lg items-center"
          >
            <Text className="text-white font-sans-semibold text-base">
              View My Appointment
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.replace('/(patient)/(tabs)/home')}
            className="mt-4"
          >
            <Text className="text-primary font-sans-medium">
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
