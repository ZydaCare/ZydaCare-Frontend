import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChangePasswordFormProps {
  onSubmit: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      const { success, error } = await onSubmit(formData.currentPassword, formData.newPassword);
      
      if (success) {
        setSuccess(true);
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setErrors({});
        
        setTimeout(() => setSuccess(false), 5000);
      } else if (error) {
        setErrors(prev => ({
          ...prev,
          submit: error
        }));
      }
    }
  };

  return (
    <View>
      {success && (
        <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <View className="flex-row items-start">
            <View style={{ marginTop: 2, marginRight: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-green-800 font-sans-medium">Password updated successfully</Text>
              <Text className="text-green-700 text-sm font-sans mt-1">
                Your password has been changed successfully.
              </Text>
            </View>
          </View>
        </View>
      )}
      
      {errors.submit && (
        <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <Text className="text-red-700 font-sans">{errors.submit}</Text>
        </View>
      )}

      <View className="mb-4">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          <Text>Current Password </Text>
          <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center border ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 h-12`}>
          <View style={{ marginRight: 10 }}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
          </View>
          <TextInput
            className="flex-1 font-sans text-gray-900"
            placeholder="Enter current password"
            value={formData.currentPassword}
            onChangeText={(text) => setFormData({ ...formData, currentPassword: text })}
            secureTextEntry={!showPassword.current}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowPassword({ ...showPassword, current: !showPassword.current })}>
            <Ionicons 
              name={showPassword.current ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>
        </View>
        {errors.currentPassword && (
          <Text className="text-red-500 text-xs mt-1 font-sans">{errors.currentPassword}</Text>
        )}
      </View>

      <View className="mb-4">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          <Text>New Password </Text>
          <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 h-12`}>
          <View style={{ marginRight: 10 }}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
          </View>
          <TextInput
            className="flex-1 font-sans text-gray-900"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
            secureTextEntry={!showPassword.new}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowPassword({ ...showPassword, new: !showPassword.new })}>
            <Ionicons 
              name={showPassword.new ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>
        </View>
        {errors.newPassword ? (
          <Text className="text-red-500 text-xs mt-1 font-sans">{errors.newPassword}</Text>
        ) : (
          <Text className="text-gray-500 text-xs mt-1 font-sans">
            Must be at least 8 characters
          </Text>
        )}
      </View>

      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          <Text>Confirm New Password </Text>
          <Text className="text-red-500">*</Text>
        </Text>
        <View className={`flex-row items-center border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 h-12`}>
          <View style={{ marginRight: 10 }}>
            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
          </View>
          <TextInput
            className="flex-1 font-sans text-gray-900"
            placeholder="Confirm new password"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry={!showPassword.confirm}
            autoCapitalize="none"
            editable={!isLoading}
          />
          <TouchableOpacity onPress={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}>
            <Ionicons 
              name={showPassword.confirm ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#9CA3AF" 
            />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text className="text-red-500 text-xs mt-1 font-sans">{errors.confirmPassword}</Text>
        )}
      </View>

      <TouchableOpacity
        className={`bg-primary rounded-lg py-3 items-center justify-center ${isLoading ? 'opacity-70' : ''}`}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-white font-sans-medium">Update Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ChangePasswordForm;