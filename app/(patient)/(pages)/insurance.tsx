import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Dummy data
const dummyInsurance = {
  hasInsurance: true,
  provider: 'Reliance HMO',
  plan: 'Gold Plan',
  status: 'Active',
  expiryDate: '2024-12-31',
  cardNumber: 'RHC-7890-5678-1234',
  coverage: {
    consultations: true,
    labTests: true,
    drugs: false,
    hospitalization: true,
    maternity: false,
  },
  recentClaims: [
    { id: '1', date: '2023-11-15', doctor: 'Dr. Ayo Ade', amount: 15000, status: 'Paid' },
    { id: '2', date: '2023-10-28', doctor: 'Dr. Jane Okafor', amount: 8500, status: 'Paid' },
    { id: '3', date: '2023-10-10', doctor: 'Dr. Femi Bello', amount: 12000, status: 'Pending' },
  ]
};
const InsuranceScreen = () => {
  const router = useRouter();
  const [insurance, setInsurance] = useState(dummyInsurance);

  const handleLinkInsurance = () => {
    router.push('/(patient)/(pages)/insurance/link');
  };

  const handleViewDetails = () => {
    router.push({
      pathname: '/(patient)/(pages)/insurance/details',
      params: { insurance: JSON.stringify(insurance) }
    });
  };

  const handleUnlinkInsurance = () => {
    setInsurance(prev => ({ ...prev, hasInsurance: false }));
  };

  if (!insurance.hasInsurance) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 p-6">
        <View className="flex-1 justify-center items-center">
          <View className="bg-white p-6 rounded-2xl w-full max-w-md">
            <View className="items-center mb-6">
              <View className="bg-gray-100 p-4 rounded-full mb-4">
                <Ionicons name="shield-outline" size={48} color="#67A9AF" />
              </View>
              <Text className="text-xl font-sans-semibold text-gray-800 mb-2">No Insurance Linked</Text>
              <Text className="text-gray-500 font-sans text-center mb-6">
                You don't have any insurance linked yet. Link your insurance to enjoy seamless medical services.
              </Text>
              <TouchableOpacity
                onPress={handleLinkInsurance}
                className="bg-primary py-3 px-6 rounded-lg w-full items-center"
              >
                <Text className="text-white font-sans-semibold">Link Insurance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4 pt-10">
        <Text className="text-2xl font-sans-bold text-gray-800 mb-6">My Insurance Coverage</Text>
        
        {/* Insurance Card */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-gray-500 text-sm font-sans">Provider</Text>
              <Text className="text-xl font-sans-semibold text-gray-800">{insurance.provider}</Text>
            </View>
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text className="text-green-700 text-xs font-sans-semibold">{insurance.status}</Text>
            </View>
          </View>
          
          <View className="mb-4">
            <Text className="text-gray-500 text-sm font-sans">Plan</Text>
            <Text className="text-lg font-sans-medium text-gray-800">{insurance.plan}</Text>
          </View>
          
          <View className="flex-row justify-between mb-6">
            <View>
              <Text className="text-gray-500 text-sm font-sans">Expires</Text>
              <Text className="text-gray-800 font-sans">
                {new Date(insurance.expiryDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View>
              <Text className="text-gray-500 text-sm font-sans">Card Number</Text>
              <Text className="text-gray-800 font-sans">{insurance.cardNumber}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={handleViewDetails}
            className="border border-primary py-3 rounded-lg items-center"
          >
            <Text className="text-primary font-sans-semibold">View Coverage Details</Text>
          </TouchableOpacity>
        </View>
        
        {/* Recent Claims */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-sans-semibold text-gray-800">Recent Claims</Text>
            <TouchableOpacity onPress={() => router.push('/(patient)/(pages)/insurance/claims')}>
              <Text className="text-primary text-sm font-sans-medium">View All</Text>
            </TouchableOpacity>
          </View>
          
          {insurance.recentClaims.slice(0, 2).map((claim) => (
            <View key={claim.id} className="bg-white rounded-xl p-4 mb-3 flex-row justify-between items-center">
              <View>
                <Text className="text-gray-500 font-sans text-sm">
                  {new Date(claim.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text className="font-sans-medium text-gray-800 mt-1">{claim.doctor}</Text>
              </View>
              <View className="items-end">
                <Text className="font-sans-bold text-gray-800">₦{claim.amount.toLocaleString()}</Text>
                <View className={`px-2 py-1 rounded-full mt-1 ${
                  claim.status === 'Paid' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  <Text className={`text-xs font-sans-medium ${
                    claim.status === 'Paid' ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {claim.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        
        {/* Actions */}
        <View className="mb-6">
          <TouchableOpacity
            onPress={handleLinkInsurance}
            className="border border-primary py-3 rounded-lg items-center"
          >
            <Text className="text-primary font-sans-semibold">Update Insurance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleUnlinkInsurance}
            className="border border-red-300 py-3 rounded-lg items-center mt-5"
          >
            <Text className="text-red-500 font-sans-semibold">Unlink Insurance</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className='h-20' />

    </SafeAreaView>
  );
};

export default InsuranceScreen;