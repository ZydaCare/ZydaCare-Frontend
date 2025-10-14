import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/authContext';
import { DoctorProfile } from '@/types/Doctor';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/config';
import { useToast } from '@/components/ui/Toast';

type Section = 'personal' | 'professional' | 'education' | 'experience' | 'bank';

const ProfileSettings = () => {
  const router = useRouter();
  const { doctorProfile, updateDoctorProfile, user, getDoctorProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  
  // Form state
  const [formData, setFormData] = useState<Partial<DoctorProfile>>({
    fullName: '',
    phoneNumber: '',
    email: '',
    speciality: '',
    contactAddress: '',
    educationDetails: {
      certificate: '',
      medicalSchool: '',
      graduationYear: new Date().getFullYear(),
      degree: ''
    },
    profile: {
      title: 'Dr.',
      gender: 'Male',
      professionalSummary: '',
      yearsOfExperience: 0,
      location: {
        address: '',
        city: '',
        state: '',
        country: 'Nigeria',
        postalCode: '',
        coordinates: [0, 0]
      },
      experience: [],
      services: [],
      languages: [],
      availability: {
        workingDays: [],
        isAvailableForHomeVisits: false,
        isAvailableForOnlineConsultations: false,
        isAvailableForInPersonConsultations: true,
        noticePeriod: 24
      },
      consultationFees: {
        inPerson: 0,
        video: 0,
        homeVisit: 0,
        currency: 'NGN'
      },
      isProfileComplete: false
    }
  });

  // Load profile data when component mounts
  useEffect(() => {
    if (doctorProfile) {
      setFormData({
        ...doctorProfile,
        profile: {
          ...formData.profile,
          ...doctorProfile.profile
        }
      });
    }
  }, [doctorProfile]);

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof DoctorProfile] as any),
            [child]: value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof DoctorProfile] as any),
            [child]: {
              ...((prev[parent as keyof DoctorProfile] as any)?.[child] || {}),
              [grandchild]: value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], // Updated to use new API
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        console.log('✅ Image picked:', imageUri);
        
        // Store the local URI temporarily for preview with explicit isLocal flag
        const newImageData = { 
          url: imageUri,
          public_id: '', // Clear any existing public_id
          isLocal: true // Flag to indicate this needs to be uploaded
        };
        
        console.log('Setting image data:', newImageData);
        handleInputChange('profile.profileImage', newImageData);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Failed to pick image', 'error');
    }
  };

  const addExperience = () => {
    const newExperience = {
      position: '',
      hospital: '',
      startDate: new Date(),
      endDate: new Date(),
      isCurrent: false,
      description: ''
    };
    const currentExperiences = formData.profile?.experience || [];
    handleInputChange('profile.experience', [...currentExperiences, newExperience]);
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const experiences = [...(formData.profile?.experience || [])];
    experiences[index] = {
      ...experiences[index],
      [field]: value
    };
    handleInputChange('profile.experience', experiences);
  };

  const removeExperience = (index: number) => {
    const experiences = [...(formData.profile?.experience || [])];
    experiences.splice(index, 1);
    handleInputChange('profile.experience', experiences);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Check if there's a new profile image to upload
      const hasNewImage = formData.profile?.profileImage?.isLocal;
      
      console.log('Has new image?', hasNewImage);
      console.log('Image data:', formData.profile?.profileImage);
      
      if (hasNewImage) {
        console.log('📸 Uploading with FormData...');
        
        // Use FormData for image upload
        const formDataToSend = new FormData();
        
        // Add the image file
        const imageUri = formData.profile?.profileImage?.url;
        const filename = imageUri?.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        console.log('Image details:', { imageUri, filename, type });
        
        formDataToSend.append('profileImage', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);
        
        // Add other fields as individual fields
        formDataToSend.append('fullName', formData.fullName || '');
        formDataToSend.append('phoneNumber', formData.phoneNumber || '');
        formDataToSend.append('speciality', formData.speciality || '');
        formDataToSend.append('contactAddress', formData.contactAddress || '');
        formDataToSend.append('title', formData.profile?.title || '');
        formDataToSend.append('gender', formData.profile?.gender || '');
        formDataToSend.append('professionalSummary', formData.profile?.professionalSummary || '');
        formDataToSend.append('yearsOfExperience', formData.profile?.yearsOfExperience?.toString() || '0');
        
        // Add complex objects as JSON strings
        if (formData.profile?.location) {
          formDataToSend.append('location', JSON.stringify(formData.profile.location));
        }
        if (formData.profile?.consultationFees) {
          formDataToSend.append('consultationFees', JSON.stringify(formData.profile.consultationFees));
        }
        if (formData.profile?.experience && formData.profile.experience.length > 0) {
          formDataToSend.append('experience', JSON.stringify(formData.profile.experience));
        }
        if (formData.educationDetails) {
          formDataToSend.append('educationDetails', JSON.stringify(formData.educationDetails));
        }
        
        console.log('FormData prepared, making API call...');
        
        // Make API call with FormData
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(`${BASE_URL}/doctors/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type, let fetch set it with boundary for FormData
          },
          body: formDataToSend,
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.message || 'Failed to update profile');
        }
        
        const responseData = await response.json();
        const updatedProfile = responseData.data || responseData;
        
        console.log('✅ Profile updated with image:', updatedProfile.profile?.profileImage);
        
        // Update local form data with the new profile image while preserving all required fields
        setFormData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            profileImage: updatedProfile.profile?.profileImage,
            title: prev.profile?.title || '',
            gender: prev.profile?.gender || '',
            professionalSummary: prev.profile?.professionalSummary || '',
            location: prev.profile?.location,
            consultationFees: prev.profile?.consultationFees,
            experience: prev.profile?.experience || [],
            services: prev.profile?.services || [],
            specialties: prev.profile?.specialties || [],
            isProfileComplete: prev.profile?.isProfileComplete || false,
            lastProfileUpdate: new Date()
          } as DoctorProfile['profile']
        }));
        
        // Refresh the doctor profile and navigate back
        try {
          // Force a refresh of the doctor profile
          const updatedProfile = await getDoctorProfile();
          
          // Update the form data with the latest profile
          if (updatedProfile) {
            setFormData(prev => ({
              ...prev,
              ...updatedProfile,
              profile: {
                ...prev.profile,
                ...updatedProfile.profile
              }
            }));
          }
          
        //   Alert.alert('Success', 'Profile updated successfully', [
        //     { text: 'OK', onPress: () => router.back() }
        //   ]);
        showToast('Profile updated successfully', 'success');
        router.back();
        } catch (error) {
          console.error('Error refreshing profile:', error);
        //   showToast('Profile updated, but could not refresh data', 'error');
          router.back();
        }
      } else {
        console.log('📝 Updating without image (using JSON)...');
        
        // No image update, use regular JSON request
        const updateData = {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          speciality: formData.speciality,
          contactAddress: formData.contactAddress,
          educationDetails: formData.educationDetails,
          title: formData.profile?.title,
          gender: formData.profile?.gender,
          professionalSummary: formData.profile?.professionalSummary,
          yearsOfExperience: formData.profile?.yearsOfExperience,
          location: formData.profile?.location,
          experience: formData.profile?.experience,
          consultationFees: formData.profile?.consultationFees,
        };

        console.log('Submitting update data:', updateData);
        await updateDoctorProfile(updateData);
        showToast('Profile updated successfully', 'success');
        router.back();
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPersonalDetails = () => (
    <View style={{ gap: 16 }}>
      {/* Profile Image Card */}
      <View className="bg-primary/10 rounded-xl p-5 items-center border border-primary/20">
        <Text className="text-gray-600 text-xs font-semibold mb-3">PROFILE PHOTO</Text>
        
        <TouchableOpacity onPress={handleImagePick} className="relative" activeOpacity={0.8}>
          {formData.profile?.profileImage?.url ? (
            <Image 
              source={{ uri: formData.profile.profileImage.url }} 
              className="w-32 h-32 rounded-full"
              style={{
                borderWidth: 3,
                borderColor: '#67A9AF',
              }}
            />
          ) : (
            <View 
              className="w-32 h-32 rounded-full bg-gray-100 items-center justify-center"
              style={{
                borderWidth: 3,
                borderColor: '#67A9AF',
              }}
            >
              <Ionicons name="person" size={48} color="#67A9AF" />
            </View>
          )}
          <View 
            className="absolute bottom-0 right-0 bg-primary rounded-full p-2"
            style={{
              borderWidth: 2,
              borderColor: 'white',
            }}
          >
            <Ionicons name="camera" size={16} color="white" />
          </View>
        </TouchableOpacity>
        <Text className="text-gray-500 text-xs mt-3 text-center">
          Tap to update photo
        </Text>
      </View>

      {/* Title Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Professional Title <Text className="text-red-500">*</Text>
        </Text>
        <View className="bg-white rounded-lg border border-gray-200">
          <Picker
            selectedValue={formData.profile?.title}
            onValueChange={(value) => handleInputChange('profile.title', value)}
            style={{ height: 50 }}
          >
            <Picker.Item label="Dr. (Doctor)" value="Dr." />
            <Picker.Item label="Prof. (Professor)" value="Prof." />
            <Picker.Item label="Mr." value="Mr." />
            <Picker.Item label="Mrs." value="Mrs." />
            <Picker.Item label="Ms." value="Ms." />
          </Picker>
        </View>
      </View>

      {/* Full Name Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Full Name <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
          <Ionicons name="person-outline" size={18} color="#67A9AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-800 text-sm"
            value={formData.fullName}
            onChangeText={(text) => handleInputChange('fullName', text)}
            placeholder="Enter your full name"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Email Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Email Address
        </Text>
        <View className="flex-row items-center bg-gray-50 rounded-lg border border-gray-200 px-3">
          <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-500 text-sm"
            value={formData.email}
            editable={false}
            placeholder="Email address"
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View className="flex-row items-center mt-1 ml-1">
          <Ionicons name="lock-closed" size={10} color="#9CA3AF" />
          <Text className="text-xs text-gray-500 ml-1">Email cannot be changed</Text>
        </View>
      </View>

      {/* Phone Number Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Phone Number <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
          <Ionicons name="call-outline" size={18} color="#67A9AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-800 text-sm"
            value={formData.phoneNumber}
            onChangeText={(text) => handleInputChange('phoneNumber', text)}
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
        </View>
      </View>

      {/* Gender Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Gender <Text className="text-red-500">*</Text>
        </Text>
        <View className="bg-white rounded-lg border border-gray-200">
          <Picker
            selectedValue={formData.profile?.gender}
            onValueChange={(value) => handleInputChange('profile.gender', value)}
            style={{ height: 50 }}
          >
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
            <Picker.Item label="Prefer not to say" value="Prefer not to say" />
          </Picker>
        </View>
      </View>

      {/* Contact Address */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Contact Address <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-start bg-white rounded-lg border border-gray-200 px-3">
          <Ionicons name="location-outline" size={18} color="#67A9AF" style={{ marginTop: 12 }} />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-800 text-sm"
            value={formData.contactAddress}
            onChangeText={(text) => handleInputChange('contactAddress', text)}
            placeholder="Enter your contact address"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={2}
          />
        </View>
      </View>
    </View>
  );

  const renderProfessionalDetails = () => (
    <View style={{ gap: 16 }}>
      {/* Specialty Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Medical Specialty <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
          <Ionicons name="medical-outline" size={18} color="#67A9AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-800 text-sm"
            value={formData.speciality}
            onChangeText={(text) => handleInputChange('speciality', text)}
            placeholder="e.g., Cardiology, Pediatrics"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Years of Experience Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Years of Experience <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
          <Ionicons name="time-outline" size={18} color="#67A9AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-800 text-sm"
            value={formData.profile?.yearsOfExperience?.toString()}
            onChangeText={(text) => handleInputChange('profile.yearsOfExperience', parseInt(text) || 0)}
            placeholder="Enter years of experience"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Professional Summary Field */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Professional Summary
        </Text>
        <View className="bg-white rounded-lg border border-gray-200 px-3">
          <TextInput
            className="py-3 text-gray-800 text-sm"
            style={{ minHeight: 100, textAlignVertical: 'top' }}
            value={formData.profile?.professionalSummary}
            onChangeText={(text) => handleInputChange('profile.professionalSummary', text)}
            placeholder="Share your professional background and expertise..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={5}
          />
        </View>
        <Text className="text-xs text-gray-500 mt-1 ml-1">
          Help patients understand your experience
        </Text>
      </View>

      {/* Consultation Fees Section */}
      <View className="bg-[#67A9AF]/5 rounded-xl p-4 border border-[#67A9AF]/20">
        <View className="flex-row items-center mb-3">
          <View className="bg-[#67A9AF] rounded-full p-2 mr-2">
            <Ionicons name="cash-outline" size={16} color="white" />
          </View>
          <View>
            <Text className="text-sm font-bold text-gray-800">Consultation Fees</Text>
            <Text className="text-xs text-gray-600">Set your rates</Text>
          </View>
        </View>

        {/* In-Person Fee */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            In-Person <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
            <Text className="text-gray-600 font-semibold text-sm">₦</Text>
            <TextInput
              className="flex-1 py-3 px-3 text-gray-800 text-sm font-medium"
              value={formData.profile?.consultationFees?.inPerson?.toString()}
              onChangeText={(text) => handleInputChange('profile.consultationFees', {
                ...formData.profile?.consultationFees,
                inPerson: parseInt(text) || 0
              })}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Video Consultation Fee */}
        <View className="mb-3">
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Video Consultation
          </Text>
          <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
            <Text className="text-gray-600 font-semibold text-sm">₦</Text>
            <TextInput
              className="flex-1 py-3 px-3 text-gray-800 text-sm font-medium"
              value={formData.profile?.consultationFees?.video?.toString()}
              onChangeText={(text) => handleInputChange('profile.consultationFees', {
                ...formData.profile?.consultationFees,
                video: parseInt(text) || 0
              })}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Home Visit Fee */}
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-1.5">
            Home Visit
          </Text>
          <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
            <Text className="text-gray-600 font-semibold text-sm">₦</Text>
            <TextInput
              className="flex-1 py-3 px-3 text-gray-800 text-sm font-medium"
              value={formData.profile?.consultationFees?.homeVisit?.toString()}
              onChangeText={(text) => handleInputChange('profile.consultationFees', {
                ...formData.profile?.consultationFees,
                homeVisit: parseInt(text) || 0
              })}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View className="flex-row items-center mt-2 bg-blue-50 p-2 rounded-lg">
          <Ionicons name="information-circle" size={14} color="#3B82F6" />
          <Text className="text-xs text-blue-700 ml-1.5 flex-1">
            All amounts in Nigerian Naira (NGN)
          </Text>
        </View>
      </View>
    </View>
  );

  const renderEducation = () => (
    <View style={{ gap: 16 }}>
      <View className="bg-blue-50 rounded-lg p-3 flex-row items-start">
        <Ionicons name="information-circle" size={18} color="#3B82F6" />
        <Text className="text-xs text-blue-700 ml-2 flex-1">
          Add your educational qualifications to help patients trust your expertise
        </Text>
      </View>

      {/* Medical School */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Medical School <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
          <Ionicons name="school-outline" size={18} color="#67A9AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-800 text-sm"
            value={formData.educationDetails?.medicalSchool}
            onChangeText={(text) => handleInputChange('educationDetails.medicalSchool', text)}
            placeholder="Enter medical school name"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Degree */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Degree Obtained <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
          <Ionicons name="ribbon-outline" size={18} color="#67A9AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-800 text-sm"
            value={formData.educationDetails?.degree}
            onChangeText={(text) => handleInputChange('educationDetails.degree', text)}
            placeholder="e.g., MBBS, MD, DO"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Graduation Year */}
      <View>
        <Text className="text-sm font-medium text-gray-700 mb-1.5">
          Graduation Year <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3">
          <Ionicons name="calendar-outline" size={18} color="#67A9AF" />
          <TextInput
            className="flex-1 py-3 px-3 text-gray-800 text-sm"
            value={formData.educationDetails?.graduationYear?.toString()}
            onChangeText={(text) => handleInputChange('educationDetails.graduationYear', parseInt(text) || new Date().getFullYear())}
            placeholder="Enter graduation year"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Certificate Upload Info */}
      <View className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <View className="flex-row items-center mb-2">
          <Ionicons name="document-outline" size={20} color="#67A9AF" />
          <Text className="text-sm font-medium text-gray-700 ml-2">Certificate Upload</Text>
        </View>
        <Text className="text-xs text-gray-600 mb-3">
          Upload your medical degree certificate for verification
        </Text>
        <TouchableOpacity 
          className="bg-white rounded-lg border-2 border-dashed border-gray-300 py-4 items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={32} color="#67A9AF" />
          <Text className="text-sm text-gray-600 mt-2">Tap to upload certificate</Text>
          <Text className="text-xs text-gray-400 mt-1">PDF or Image (Max 5MB)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExperience = () => (
    <View style={{ gap: 16 }}>
      <View className="bg-blue-50 rounded-lg p-3 flex-row items-start">
        <Ionicons name="information-circle" size={18} color="#3B82F6" />
        <Text className="text-xs text-blue-700 ml-2 flex-1">
          Add your work experience to showcase your professional journey
        </Text>
      </View>

      {/* Experience List */}
      {(formData.profile?.experience || []).map((exp, index) => (
        <View key={index} className="bg-white rounded-lg border border-gray-200 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm font-bold text-gray-800">Experience {index + 1}</Text>
            <TouchableOpacity onPress={() => removeExperience(index)}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* Position */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Position</Text>
            <View className="flex-row items-center bg-gray-50 rounded-lg border border-gray-200 px-3">
              <Ionicons name="briefcase-outline" size={16} color="#67A9AF" />
              <TextInput
                className="flex-1 py-2.5 px-3 text-gray-800 text-sm"
                value={exp.position}
                onChangeText={(text) => updateExperience(index, 'position', text)}
                placeholder="e.g., Consultant Cardiologist"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Hospital */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Hospital/Clinic</Text>
            <View className="flex-row items-center bg-gray-50 rounded-lg border border-gray-200 px-3">
              <Ionicons name="business-outline" size={16} color="#67A9AF" />
              <TextInput
                className="flex-1 py-2.5 px-3 text-gray-800 text-sm"
                value={exp.hospital}
                onChangeText={(text) => updateExperience(index, 'hospital', text)}
                placeholder="e.g., General Hospital Lagos"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Description */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Description</Text>
            <View className="bg-gray-50 rounded-lg border border-gray-200 px-3">
              <TextInput
                className="py-2.5 text-gray-800 text-sm"
                style={{ minHeight: 70, textAlignVertical: 'top' }}
                value={exp.description}
                onChangeText={(text) => updateExperience(index, 'description', text)}
                placeholder="Describe your role and responsibilities..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Current Position Toggle */}
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={() => updateExperience(index, 'isCurrent', !exp.isCurrent)}
            activeOpacity={0.7}
          >
            <View className={`w-5 h-5 rounded border-2 items-center justify-center ${exp.isCurrent ? 'bg-primary border-primary' : 'border-gray-300'}`}>
              {exp.isCurrent && <Ionicons name="checkmark" size={14} color="white" />}
            </View>
            <Text className="text-sm text-gray-700 ml-2">I currently work here</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Experience Button */}
      <TouchableOpacity 
        className="bg-primary/10 rounded-lg border-2 border-dashed border-primary/30 py-4 items-center"
        onPress={addExperience}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle-outline" size={32} color="#67A9AF" />
        <Text className="text-sm font-medium text-primary mt-2">Add Experience</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'personal':
        return renderPersonalDetails();
      case 'professional':
        return renderProfessionalDetails();
      case 'education':
        return renderEducation();
      case 'experience':
        return renderExperience();
      default:
        return renderPersonalDetails();
    }
  };

  const sectionIcons: Record<Section, string> = {
    personal: 'person-outline',
    professional: 'briefcase-outline',
    education: 'school-outline',
    experience: 'star-outline',
    bank: 'card-outline'
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-5 py-4"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 3
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity 
              onPress={() => router.back()} 
              className="mr-4 p-2 -ml-2 rounded-full active:bg-gray-100"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Profile Settings</Text>
              <Text className="text-sm text-gray-500 mt-0.5">Update your professional information</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Navigation Tabs */}
        <View 
          className="bg-white px-5 py-4 mb-2"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2
          }}
        >
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {(['personal', 'professional', 'education', 'experience'] as Section[]).map((section) => (
              <TouchableOpacity
                key={section}
                onPress={() => setActiveSection(section)}
                className={`px-5 py-3 mr-3 rounded-full flex-row items-center ${
                  activeSection === section 
                    ? 'bg-[#67A9AF]' 
                    : 'bg-gray-100'
                }`}
                style={{
                  shadowColor: activeSection === section ? '#67A9AF' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: activeSection === section ? 4 : 0
                }}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={sectionIcons[section] as any} 
                  size={18} 
                  color={activeSection === section ? 'white' : '#6B7280'} 
                />
                <Text 
                  className={`ml-2 text-sm font-semibold ${
                    activeSection === section ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {section.charAt(0).toUpperCase() + section.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Form Content */}
        <View className="px-5 py-6">
          {renderSection()}
        </View>
      </ScrollView>

      {/* Save Button - Floating */}
      <View 
        className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4"
        style={{
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 12
        }}
      >
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center flex-row justify-center ${
            isLoading ? 'bg-gray-300' : 'bg-[#67A9AF]'
          }`}
          style={{
            shadowColor: isLoading ? 'transparent' : '#67A9AF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8
          }}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <>
              <Ionicons name="hourglass-outline" size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">Saving Changes...</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProfileSettings;