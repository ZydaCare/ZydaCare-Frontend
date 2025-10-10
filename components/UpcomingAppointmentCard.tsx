import React from 'react';
import { View, Text, TouchableOpacity, Image as RNImage } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface AppointmentCardProps {
  appointment: {
    _id: string;
    doctorName: string;
    speciality: string;
    dateISO: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    doctor?: {
      profile?: {
        imageUrl?: string;
      };
    };
  };
}

const UpcomingAppointmentCard: React.FC<AppointmentCardProps> = ({ appointment }) => {
  const appointmentDate = new Date(appointment.dateISO);
  
  return (
    <View className="mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-sans-semibold text-gray-900">
          {appointment.status === 'ongoing' ? 'Current Appointment' : 'Upcoming Appointment'}
        </Text>
        <View className={`px-2 py-1 rounded-md ${
          appointment.status === 'ongoing' ? 'bg-amber-100' : 'bg-blue-50'
        }`}>
          <Text className={`text-xs font-sans-medium ${
            appointment.status === 'ongoing' ? 'text-amber-800' : 'text-blue-800'
          }`}>
            {appointment.status === 'ongoing' ? 'In Progress' : 'Upcoming'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center">
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mr-4">
          {appointment.doctor?.profile?.imageUrl ? (
            <RNImage
              source={{ uri: appointment.doctor.profile.imageUrl }}
              className="w-full h-full rounded-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person" size={28} color="#67A9AF" />
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-base font-sans-semibold text-gray-900">
            {appointment.doctorName}
          </Text>
          <Text className="text-sm font-sans text-gray-600 mb-1">
            {appointment.speciality}
          </Text>
          <View className="flex-row items-center">
            <Ionicons name="calendar" size={14} color="#6B7280" style={{ marginRight: 4 }} />
            <Text className="text-xs font-sans text-gray-600">
              {format(appointmentDate, 'EEEE, MMMM d, yyyy • h:mm a')}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity 
        onPress={() => router.push(`/(patient)/(pages)/appointment/${appointment._id}`)}
        className="mt-4 bg-primary py-2 rounded-lg items-center"
      >
        <Text className="text-white font-sans-medium">
          {appointment.status === 'ongoing' ? 'Join Now' : 'View Details'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default UpcomingAppointmentCard;