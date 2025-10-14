import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

interface TimeSlotPickerProps {
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  disabled?: boolean;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled = false,
}) => {
  const [showStartPicker, setShowStartPicker] = React.useState(false);
  const [showEndPicker, setShowEndPicker] = React.useState(false);

  const parseTimeString = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const timeString = format(selectedDate, 'HH:mm');
      onStartTimeChange(timeString);
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      const timeString = format(selectedDate, 'HH:mm');
      onEndTimeChange(timeString);
    }
  };

  const startDate = parseTimeString(startTime);
  const endDate = parseTimeString(endTime);

  return (
    <View className="flex-row items-center">
      {/* Start Time Picker */}
      <View className={`relative flex-1 ${disabled ? 'opacity-50' : ''}`}>
        <TouchableOpacity
          onPress={() => !disabled && setShowStartPicker(true)}
          disabled={disabled}
          className="flex-row items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <Text className={`font-sans text-base ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {startTime}
          </Text>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
        </TouchableOpacity>
        
        {showStartPicker && (
          <View className="absolute top-12 left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <DateTimePicker
              value={startDate}
              mode="time"
              display="spinner"
              onChange={handleStartTimeChange}
              minuteInterval={15}
              textColor="#111827"
              themeVariant="light"
            />
            <View className="flex-row justify-end pt-2 border-t border-gray-100">
              <TouchableOpacity 
                onPress={() => setShowStartPicker(false)}
                className="px-4 py-2 rounded-md bg-primary"
              >
                <Text className="text-white font-sans-medium text-sm">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
      <Text className="mx-2 text-gray-500 font-sans">to</Text>
      
      <View className={`relative flex-1 ${disabled ? 'opacity-50' : ''}`}>
        <TouchableOpacity
          onPress={() => !disabled && setShowEndPicker(true)}
          disabled={disabled}
          className="flex-row items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <Text className={`font-sans text-base ${disabled ? 'text-gray-400' : 'text-gray-900'}`}>
            {endTime}
          </Text>
          <Ionicons name="time-outline" size={16} color="#6B7280" />
        </TouchableOpacity>
        
        {showEndPicker && (
          <View className="absolute top-12 left-0 right-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
            <DateTimePicker
              value={endDate}
              mode="time"
              display="spinner"
              onChange={handleEndTimeChange}
              minuteInterval={15}
              textColor="#111827"
              themeVariant="light"
            />
            <View className="flex-row justify-end pt-2 border-t border-gray-100">
              <TouchableOpacity 
                onPress={() => setShowEndPicker(false)}
                className="px-4 py-2 rounded-md bg-primary"
              >
                <Text className="text-white font-sans-medium text-sm">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
