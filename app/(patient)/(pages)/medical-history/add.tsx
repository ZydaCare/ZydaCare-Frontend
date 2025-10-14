// Add Medical Record Screen - Complete Implementation

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddMedicalRecordScreen() {
  const [formData, setFormData] = useState({
    condition: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    category: 'acute' as 'acute' | 'chronic',
    severity: 'mild' as 'mild' | 'moderate' | 'severe',
  });
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  // const { user, token } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      showToast('Maximum 5 images allowed', 'error');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        showToast('Permission to access gallery is required', 'error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check file size if available (5MB limit)
        // fileSize is available on most platforms
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          showToast('Image size must be less than 5MB', 'error');
          return;
        }

        setImages(prev => [...prev, asset.uri]);
        setImageFiles(prev => [...prev, {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `medical_${Date.now()}.jpg`
        }]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Failed to pick image', 'error');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const token = await AsyncStorage.getItem('token');

    if (!formData.condition) {
      showToast('Please enter a medical condition', 'error');
      return;
    }

    if (!token) {
      showToast('Authentication required', 'error');
      return;
    }

    try {
      setLoading(true);
      setIsUploading(imageFiles.length > 0);

      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('date', formData.date);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('severity', formData.severity);
      
      if (formData.diagnosis) {
        formDataToSend.append('diagnosis', formData.diagnosis);
      }
      if (formData.treatment) {
        formDataToSend.append('treatment', formData.treatment);
      }
      if (formData.notes) {
        formDataToSend.append('notes', formData.notes);
      }

      // Append images
      imageFiles.forEach((file) => {
        formDataToSend.append('images', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
      });

      const response = await fetch(`${BASE_URL}/medical-history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - fetch will set it automatically with boundary
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add medical record');
      }

      if (data.success) {
        showToast('Medical record added successfully', 'success');
        router.replace({
          pathname: '/(patient)/(pages)/medical-history/records',
          params: { refresh: Date.now() }
        });
      }
    } catch (error) {
      console.error('Error adding medical record:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to add medical record',
        'error'
      );
    } finally {
      setLoading(false);
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-sans-bold text-gray-900">Add Medical Record</Text>
              <Text className="text-sm text-gray-600 mt-1">Document your health information</Text>
            </View>
          </View>

          {/* Basic Information Section */}
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="bg-teal-100 w-8 h-8 rounded-lg items-center justify-center mr-2">
                <Ionicons name="document-text" size={18} color="#0D9488" />
              </View>
              <Text className="text-lg font-sans-semibold text-gray-900">Basic Information</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">
                Condition / Illness *
              </Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-base font-sans text-gray-900"
                placeholder="e.g., Diabetes, Hypertension, Migraine"
                placeholderTextColor="#9CA3AF"
                value={formData.condition}
                onChangeText={(text) => handleInputChange('condition', text)}
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">Date *</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-base font-sans text-gray-900"
                value={formData.date}
                onChangeText={(text) => handleInputChange('date', text)}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                keyboardType="numbers-and-punctuation"
                editable={!loading}
              />
              <Text className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD</Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-sans-medium text-gray-700 mb-2">Category *</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleInputChange('category', 'acute')}
                    className={`flex-1 py-3 rounded-lg border ${formData.category === 'acute'
                      ? 'bg-primary border-primary'
                      : 'bg-white border-gray-200'
                      }`}
                    disabled={loading}
                  >
                    <Text
                      className={`text-center font-sans-medium ${formData.category === 'acute' ? 'text-white' : 'text-gray-700'
                        }`}
                    >
                      Acute
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleInputChange('category', 'chronic')}
                    className={`flex-1 py-3 rounded-lg border ${formData.category === 'chronic'
                      ? 'bg-primary border-primary'
                      : 'bg-white border-gray-200'
                      }`}
                    disabled={loading}
                  >
                    <Text
                      className={`text-center font-sans-medium ${formData.category === 'chronic' ? 'text-white' : 'text-gray-700'
                        }`}
                    >
                      Chronic
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">Severity *</Text>
              <View className="flex-row gap-2">
                {(['mild', 'moderate', 'severe'] as const).map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    onPress={() => handleInputChange('severity', severity)}
                    className={`flex-1 py-3 rounded-lg border ${formData.severity === severity
                      ? 'bg-primary border-primary'
                      : 'bg-white border-gray-200'
                      }`}
                    disabled={loading}
                  >
                    <Text
                      className={`text-center font-sans-medium capitalize ${formData.severity === severity ? 'text-white' : 'text-gray-700'
                        }`}
                    >
                      {severity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Medical Details Section */}
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="bg-teal-100 w-8 h-8 rounded-lg items-center justify-center mr-2">
                <Ionicons name="pulse" size={18} color="#0D9488" />
              </View>
              <Text className="text-lg font-sans-semibold text-gray-900">Medical Details</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">Diagnosis</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-base font-sans text-gray-900"
                placeholder="Detailed diagnosis from healthcare provider..."
                placeholderTextColor="#9CA3AF"
                value={formData.diagnosis}
                onChangeText={(text) => handleInputChange('diagnosis', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
              <Text className="text-xs text-gray-500 mt-1">
                Include any test results or observations
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">
                Treatment / Medication
              </Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-base font-sans text-gray-900"
                placeholder="Prescribed treatment plan, medications, dosages..."
                placeholderTextColor="#9CA3AF"
                value={formData.treatment}
                onChangeText={(text) => handleInputChange('treatment', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
              <Text className="text-xs text-gray-500 mt-1">
                List medications with dosages and frequency
              </Text>
            </View>

            <View>
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">
                Additional Notes
              </Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-base font-sans text-gray-900"
                placeholder="Any additional information, symptoms, follow-up instructions..."
                placeholderTextColor="#9CA3AF"
                value={formData.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>

            {/* Image Upload Section */}
            <View className="mt-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">
                Attach Images (Max 5)
              </Text>
              <Text className="text-xs text-gray-500 mb-3">
                Add photos of prescriptions, test results, or affected areas
              </Text>

              <View className="flex-row flex-wrap">
                {images.map((uri, index) => (
                  <View key={index} className="relative mr-2 mb-2">
                    <Image
                      source={{ uri }}
                      className="w-20 h-20 rounded-lg"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                      onPress={() => removeImage(index)}
                      disabled={loading || isUploading}
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}

                {images.length < 5 && (
                  <TouchableOpacity
                    className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
                    onPress={pickImage}
                    disabled={loading || isUploading}
                  >
                    <Ionicons name="add" size={24} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500 mt-1">
                      {images.length}/5
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {(loading || isUploading) && (
                <View className="mt-2 flex-row items-center">
                  <ActivityIndicator size="small" color="#67A9AF" />
                  <Text className="text-xs text-gray-500 ml-2">
                    {isUploading ? 'Uploading images...' : 'Saving record...'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Buttons */}
      <View className="bg-white px-4 py-5 pb-7 border-t border-gray-100">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-white border-2 border-gray-200 py-3 rounded-xl items-center justify-center"
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text className="text-gray-700 font-sans-semibold text-base">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-primary py-3 rounded-xl items-center justify-center"
            onPress={handleSubmit}
            disabled={loading || !formData.condition}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="checkmark" size={20} color="white" />
                <Text className="text-white font-sans-semibold text-base ml-1">
                  Save Record
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}