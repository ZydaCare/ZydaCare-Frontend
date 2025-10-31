import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfileFormProps {
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  onSubmit: (data: { firstName: string; lastName: string; phone?: string }) => Promise<void>;
  isLoading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    phone: initialData.phone || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      try {
        await onSubmit(formData);
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  };

  return (
    <View>
      <View className="mb-4">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          <Text>Full Name </Text>
          <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 h-12`}>
          <View style={{ marginRight: 10 }}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          </View>
          <TextInput
            className="flex-1 font-sans text-gray-900"
            placeholder="Enter your full name"
            value={formData.firstName}
            onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            editable={!isLoading}
          />
        </View>
        {errors.firstName && <Text className="text-red-500 text-xs mt-1 font-sans">{errors.firstName}</Text>}
      </View>

      <View className="mb-4">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          <Text>Last Name </Text>
          <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 h-12`}>
          <View style={{ marginRight: 10 }}>
            <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          </View>
          <TextInput
            className="flex-1 font-sans text-gray-900"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            editable={!isLoading}
          />
        </View>
        {errors.lastName && <Text className="text-red-500 text-xs mt-1 font-sans">{errors.lastName}</Text>}
      </View>

      <View className="mb-4">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          Email Address
        </Text>
        <View className="flex-row items-center bg-gray-100 rounded-lg px-4 h-12">
          <View style={{ marginRight: 10 }}>
            <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
          </View>
          <Text className="flex-1 font-sans text-gray-500">
            {initialData.email}
          </Text>
        </View>
        <Text className="text-gray-400 text-xs mt-1 font-sans">
          Contact support to change your email address
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          Phone Number
        </Text>
        <View className={`flex-row items-center border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 h-12`}>
          <View style={{ marginRight: 10 }}>
            <Ionicons name="call-outline" size={20} color="#9CA3AF" />
          </View>
          <TextInput
            className="flex-1 font-sans text-gray-900"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>
        {errors.phone && <Text className="text-red-500 text-xs mt-1 font-sans">{errors.phone}</Text>}
      </View>

      <TouchableOpacity
        className={`bg-primary rounded-lg py-3 items-center justify-center ${isLoading ? 'opacity-70' : ''}`}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-white font-sans-medium">Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ProfileForm;