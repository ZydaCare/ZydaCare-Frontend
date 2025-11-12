import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToast } from '@/components/ui/Toast';

const insuranceProviders = [
  { id: '1', name: 'TRANSPARENCY SCAPE BROKERS', logo: 'https://transcapebrokers.com/wp-content/uploads/2023/03/logo_transcape.png' },
  // { id: '2', name: 'AXA Mansard', logo: 'https://via.placeholder.com/40' },
  // { id: '3', name: 'Hygeia HMO', logo: 'https://via.placeholder.com/40' },
  // { id: '4', name: 'Avon HMO', logo: 'https://via.placeholder.com/40' },
  // { id: '5', name: 'Redcare HMO', logo: 'https://via.placeholder.com/40' },
];

const InsuranceLinkScreen = () => {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [policyNumber, setPolicyNumber] = useState('');
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [insuranceCard, setInsuranceCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Select provider, 2: Enter details
  const { showToast } = useToast();

  const handleSelectProvider = (provider: any) => {
    setSelectedProvider(provider);
    setStep(2);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showToast('Permission required! Please allow access to your photos to upload insurance card.', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setInsuranceCard(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!policyNumber.trim()) {
      showToast('Please enter your policy number', 'error');  
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      showToast('Your insurance has been verified and linked successfully!', 'success');
      router.replace('/(patient)/(tabs)/insurance');
    }, 2000);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <View className="flex-row items-center mb-6 pt-8">
          <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(1)} className="p-2 -ml-2">
            <Ionicons name="arrow-back" size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-gray-800 ml-2">
            {step === 1 ? 'Select Insurance Provider' : 'Link Insurance'}
          </Text>
        </View>

        {step === 1 ? (
          <View>
            <Text className="text-gray-600 font-sans mb-4">
              Select your insurance provider from the list below to link your insurance.
            </Text>
            
            <View className="space-y-3">
              {insuranceProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  onPress={() => handleSelectProvider(provider)}
                  className="bg-white p-4 rounded-xl flex-row items-center shadow-sm"
                >
                  <Image
                    source={{ uri: provider.logo }}
                    className="w-14 h-14 rounded-full mr-4 object-contain"
                  />
                  <Text className="font-sans-medium text-gray-800 flex-1">
                    {provider.name}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View>
            <View className="bg-white rounded-xl p-4 mb-6">
              <View className="flex-row items-center mb-4">
                <Image
                  source={{ uri: selectedProvider?.logo }}
                  className="w-14 h-14 rounded-full mr-3 object-contain"
                />
                <View>
                  <Text className="font-sans-medium text-gray-800">{selectedProvider?.name}</Text>
                  <Text className="text-gray-500 font-sans text-sm">Selected Provider</Text>
                </View>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-gray-700 font-sans-medium mb-1">Policy Number</Text>
                  <TextInput
                    value={policyNumber}
                    onChangeText={setPolicyNumber}
                    placeholder="Enter your policy number"
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-sans"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View>
                  <Text className="text-gray-700 font-sans-medium mb-1 mt-4">Date of Birth</Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <Text className="font-sans">{formatDate(dob)}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={dob}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                          setDob(selectedDate);
                        }
                      }}
                    />
                  )}
                </View>

                <View>
                  <Text className="text-gray-700 font-sans-medium mb-1 mt-4">
                    Insurance Card (Optional)
                  </Text>
                  <TouchableOpacity
                    onPress={pickImage}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center justify-center"
                  >
                    {insuranceCard ? (
                      <Image
                        source={{ uri: insuranceCard }}
                        className="w-full h-40 rounded-lg"
                        resizeMode="contain"
                      />
                    ) : (
                      <View className="items-center">
                        <Ionicons name="cloud-upload-outline" size={32} color="#9CA3AF" />
                        <Text className="text-gray-500 font-sans text-sm mt-2 text-center">
                          Tap to upload a photo of your insurance card
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading}
              className={`py-4 rounded-xl items-center ${isLoading ? 'bg-primary/80' : 'bg-primary'}`}
            >
              {isLoading ? (
                <Text className="text-white font-sans-medium">Verifying...</Text>
              ) : (
                <Text className="text-white font-sans-medium">Verify & Link Insurance</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default InsuranceLinkScreen;
