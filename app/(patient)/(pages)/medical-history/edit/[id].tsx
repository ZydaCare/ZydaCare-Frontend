// Edit Medical Record Screen - Complete Implementation

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, SafeAreaView, Image, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';


const EditMedicalRecord = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    condition: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    category: 'acute',
    severity: 'mild',
  });

  // const { user, token } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };

    loadToken();
  }, []);


  useEffect(() => {
    if (id && token) {
      fetchMedicalRecord();
    }
  }, [id, token]);

  const fetchMedicalRecord = async () => {
    try {
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      const response = await fetch(`${BASE_URL}/medical-history/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch medical record');
      }

      if (data.success && data.data) {
        const record = data.data;
        setFormData({
          condition: record.condition || '',
          diagnosis: record.diagnosis || '',
          treatment: record.treatment || '',
          notes: record.notes || '',
          date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
          category: record.category || 'acute',
          severity: record.severity || 'mild',
        });
        setImages(record.images || []);
      }
    } catch (error) {
      console.error('Error fetching medical record:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load record', 'error');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
        setNewImageFiles(prev => [...prev, {
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

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExistingImage = async (imageId: string, publicId: string) => {
    try {
      setDeletingImage(true);

      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      const response = await fetch(`${BASE_URL}/medical-history/${id}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete image');
      }

      if (data.success) {
        setImages(prev => prev.filter(img =>
          (img._id && img._id !== imageId) || (img.public_id && img.public_id !== publicId)
        ));
        showToast('Image deleted successfully', 'success');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete image', 'error');
    } finally {
      setDeletingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.condition) {
      showToast('Medical condition is required', 'error');
      return;
    }

    if (!token) {
      showToast('Authentication required', 'error');
      return;
    }

    try {
      setSubmitting(true);

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

      // Append new images only
      newImageFiles.forEach((file) => {
        formDataToSend.append('images', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        } as any);
      });

      const response = await fetch(`${BASE_URL}/medical-history/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - fetch will set it automatically with boundary
        },
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update record');
      }

      if (data.success) {
        showToast('Medical record updated successfully', 'success');
        router.replace({
          pathname: '/(patient)/(pages)/medical-history/records',
          params: { refresh: Date.now() }
        });
      }
    } catch (error) {
      console.error('Error updating record:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setShowDeleteModal(false);
    handleDelete();
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);

      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      const response = await fetch(`${BASE_URL}/medical-history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete record');
      }

      if (data.success) {
        showToast('Medical record deleted successfully', 'success');
        router.back();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View>
              <Text className="text-2xl font-sans-bold text-gray-900">Edit Medical Record</Text>
              <Text className="text-sm text-gray-600 mt-1">Update your health information</Text>
            </View>
          </View>

          {/* Basic Information */}
          <View className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="bg-teal-100 w-8 h-8 rounded-lg items-center justify-center mr-2">
                <Ionicons name="document-text" size={18} color="#0D9488" />
              </View>
              <Text className="text-lg font-sans-semibold text-gray-900">Basic Information</Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">Condition *</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-base font-sans text-gray-900"
                placeholder="e.g., Diabetes, Hypertension"
                value={formData.condition}
                onChangeText={(text) => handleInputChange('condition', text)}
                editable={!submitting}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">Date *</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-base font-sans text-gray-900"
                value={formData.date}
                onChangeText={(text) => handleInputChange('date', text)}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                editable={!submitting}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">Category *</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg border ${formData.category === 'acute' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                  onPress={() => handleInputChange('category', 'acute')}
                  disabled={submitting}
                >
                  <Text className={`text-center font-sans-medium ${formData.category === 'acute' ? 'text-white' : 'text-gray-700'}`}>
                    Acute
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg border ${formData.category === 'chronic' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                  onPress={() => handleInputChange('category', 'chronic')}
                  disabled={submitting}
                >
                  <Text className={`text-center font-sans-medium ${formData.category === 'chronic' ? 'text-white' : 'text-gray-700'}`}>
                    Chronic
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">Severity *</Text>
              <View className="flex-row gap-2">
                {(['mild', 'moderate', 'severe'] as const).map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    className={`flex-1 py-3 rounded-lg border ${formData.severity === severity ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                    onPress={() => handleInputChange('severity', severity)}
                    disabled={submitting}
                  >
                    <Text className={`text-center font-sans-medium capitalize ${formData.severity === severity ? 'text-white' : 'text-gray-700'}`}>
                      {severity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Medical Details */}
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
                placeholder="Enter diagnosis details"
                value={formData.diagnosis}
                onChangeText={(text) => handleInputChange('diagnosis', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">Treatment</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-base font-sans text-gray-900"
                placeholder="Enter treatment details"
                value={formData.treatment}
                onChangeText={(text) => handleInputChange('treatment', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            <View>
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">Notes</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-4 py-3 text-base font-sans text-gray-900"
                placeholder="Additional notes"
                value={formData.notes}
                onChangeText={(text) => handleInputChange('notes', text)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!submitting}
              />
            </View>

            {/* Images Section */}
            <View className="mt-4">
              <Text className="text-sm font-sans-medium text-gray-700 mb-2">
                Images (Max 5 total)
              </Text>
              <View className="flex-row flex-wrap">
                {/* Existing Images */}
                {images.map((image, index) => (
                  <View key={`existing-${index}`} className="relative mr-2 mb-2">
                    <Image
                      source={{ uri: image.url || image }}
                      className="w-20 h-20 rounded-md"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                      onPress={() => deleteExistingImage(image._id, image.public_id)}
                      disabled={submitting || deletingImage}
                    >
                      {deletingImage ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Ionicons name="close" size={14} color="white" />
                      )}
                    </TouchableOpacity>
                  </View>
                ))}

                {/* New Images */}
                {newImages.map((uri, index) => (
                  <View key={`new-${index}`} className="relative mr-2 mb-2">
                    <Image
                      source={{ uri }}
                      className="w-20 h-20 rounded-md"
                      resizeMode="cover"
                    />
                    <View className="absolute top-0 right-0 bg-green-500 px-1 rounded-bl">
                      <Text className="text-xs text-white">New</Text>
                    </View>
                    <TouchableOpacity
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                      onPress={() => removeNewImage(index)}
                      disabled={submitting}
                    >
                      <Ionicons name="close" size={14} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add Button */}
                {(images.length + newImages.length) < 5 && (
                  <TouchableOpacity
                    className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-md items-center justify-center"
                    onPress={pickImage}
                    disabled={submitting}
                  >
                    <Ionicons name="add" size={24} color="#9CA3AF" />
                    <Text className="text-xs text-gray-500 mt-1">
                      {images.length + newImages.length}/5
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="bg-white px-4 py-5 pb-7 border-t border-gray-100">
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-red-50 border-2 border-red-200 py-3 rounded-xl items-center justify-center"
            onPress={confirmDelete}
            disabled={submitting}
          >
            <Text className="text-red-700 font-sans-semibold text-base">Delete</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-primary py-3 rounded-xl items-center justify-center"
            onPress={handleSubmit}
            disabled={submitting || !formData.condition}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-sans-semibold text-base">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-sans-bold text-gray-900 mb-2">Delete Record</Text>
            <Text className="text-gray-700 mb-6">
              Are you sure you want to delete this medical record? This action cannot be undone.
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-4 py-2 rounded-lg"
                onPress={() => setShowDeleteModal(false)}
                disabled={submitting}
              >
                <Text className="text-gray-700 font-sans-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 bg-red-600 rounded-lg"
                onPress={handleConfirmDelete}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans-medium">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EditMedicalRecord;