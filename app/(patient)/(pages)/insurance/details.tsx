import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const coverageItems = [
  { id: 'consultations', label: 'Doctor Consultations', icon: 'medical' },
  { id: 'labTests', label: 'Lab Tests', icon: 'flask' },
  { id: 'drugs', label: 'Prescription Drugs', icon: 'medkit' },
  { id: 'hospitalization', label: 'Hospitalization', icon: 'medal' },
  { id: 'maternity', label: 'Maternity Care', icon: 'female' },
  { id: 'surgery', label: 'Surgical Procedures', icon: 'cut' },
];

const InsuranceDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insurance = params.insurance ? JSON.parse(params.insurance as string) : null;

  if (!insurance) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center p-6">
        <Text className="text-gray-500 mb-4">No insurance details found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary py-3 px-6 rounded-lg"
        >
          <Text className="text-white font-sans-medium">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const getCoverageStatus = (itemId: string) => {
    return insurance.coverage[itemId] ? 'Covered' : 'Not Covered';
  };

  const getCoverageColor = (itemId: string) => {
    return insurance.coverage[itemId] ? 'text-green-600' : 'text-red-600';
  };

  const getCoverageIcon = (itemId: string) => {
    return insurance.coverage[itemId] ? 'checkmark-circle' : 'close-circle';
  };

  const getCoverageIconColor = (itemId: string) => {
    return insurance.coverage[itemId] ? '#10B981' : '#EF4444';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 py-4 pt-10">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-2">
              <Ionicons name="arrow-back" size={24} color="#4B5563" />
            </TouchableOpacity>
            <Text className="text-xl font-sans-bold text-gray-800 ml-2">
              Coverage Details
            </Text>
          </View>
          
          <View className="bg-primary/5 p-4 rounded-xl">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg font-sans-bold text-gray-800">{insurance.provider}</Text>
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-700 text-xs font-sans-semibold">{insurance.status}</Text>
              </View>
            </View>
            <Text className="text-gray-600 font-sans-medium mb-1">{insurance.plan}</Text>
            <Text className="text-gray-500 text-sm font-sans">Expires {new Date(insurance.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
        </View>

        {/* Coverage Summary */}
        <View className="p-6">
          <Text className="text-lg font-sans-bold text-gray-800 mb-4">What's Covered</Text>
          
          <View className="bg-white rounded-xl p-4 mb-6">
            <View className="flex-row flex-wrap -mx-2">
              {coverageItems.slice(0, 4).map((item) => (
                <View key={item.id} className="w-2/1 px-2 mb-4">
                  <View className="bg-gray-50 p-4 rounded-lg">
                    <View className="flex-row items-center mb-2">
                      <Ionicons 
                        name={item.icon as any} 
                        size={20} 
                        color={getCoverageIconColor(item.id)} 
                        style={{ marginRight: 8 }}
                      />
                      <Text className="font-sans-medium text-gray-700">{item.label}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons 
                        name={getCoverageIcon(item.id) as any} 
                        size={16} 
                        color={getCoverageIconColor(item.id)} 
                      />
                      <Text className={`text-sm ml-1 font-sans-medium ${getCoverageColor(item.id)}`}>
                        {getCoverageStatus(item.id)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Coverage Details */}
          <Text className="text-lg font-sans-bold text-gray-800 mb-4">Coverage Details</Text>
          <View className="bg-white rounded-xl overflow-hidden">
            {coverageItems.map((item, index) => (
              <View 
                key={item.id} 
                className={`flex-row items-center justify-between p-4 ${index !== coverageItems.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <View className="flex-row items-center">
                  <Ionicons 
                    name={item.icon as any} 
                    size={20} 
                    color={getCoverageIconColor(item.id)} 
                    style={{ marginRight: 12 }}
                  />
                  <Text className="font-sans text-gray-700">{item.label}</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons 
                    name={getCoverageIcon(item.id) as any} 
                    size={16} 
                    color={getCoverageIconColor(item.id)} 
                  />
                  <Text className={`text-sm ml-1 font-sans-medium ${getCoverageColor(item.id)}`}>
                    {getCoverageStatus(item.id)}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Benefits */}
          <Text className="text-lg font-sans-bold text-gray-800 mt-8 mb-4">Plan Benefits</Text>
          <View className="bg-white rounded-xl p-4 mb-6">
            <View className="flex-row items-start mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
              <Text className="flex-1 text-gray-700 text-[13px] mt-1 font-sans">Access to over 500+ hospitals and clinics nationwide</Text>
            </View>
            <View className="flex-row items-start mb-3">
              <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
              <Text className="flex-1 text-gray-700 text-[13px] mt-1 font-sans">24/7 telemedicine support with licensed doctors</Text>
            </View>
            <View className="flex-row items-start">
              <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginTop: 2, marginRight: 8 }} />
              <Text className="flex-1 text-gray-700 text-[13px] mt-1 font-sans">Direct billing at all partner healthcare providers</Text>
            </View>
          </View>

          {/* Contact Support */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" style={{ marginTop: 2, marginRight: 8 }} />
              <View className="flex-1">
                <Text className="font-sans-medium text-blue-800 mb-1">Need help with your coverage?</Text>
                <Text className="text-blue-700 font-sans text-[12px] mt-1">Contact {insurance.provider} support for any questions about your benefits or claims.</Text>
                <TouchableOpacity className="flex-row items-center mt-2">
                  <Ionicons name="call" size={16} color="#3B82F6" />
                  <Text className="text-blue-600 font-sans-medium ml-1">Contact Support</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* View All Claims Button */}
          <TouchableOpacity 
            onPress={() => router.push('/(patient)/(pages)/insurance/claims')}
            className="border border-primary py-3 rounded-lg items-center mb-6"
          >
            <Text className="text-primary font-sans-medium">View All Claims</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default InsuranceDetailsScreen;
