import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Dummy data for claims
const dummyClaims = [
  {
    id: '1',
    date: '2023-11-15',
    doctor: 'Dr. Ayo Ade',
    amount: 15000,
    status: 'Paid',
    type: 'Consultation',
    description: 'Follow-up consultation for annual checkup',
    receiptUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    date: '2023-10-28',
    doctor: 'Dr. Jane Okafor',
    amount: 8500,
    status: 'Paid',
    type: 'Lab Test',
    description: 'Blood work and urinalysis',
    receiptUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '3',
    date: '2023-10-10',
    doctor: 'Dr. Femi Bello',
    amount: 12000,
    status: 'Pending',
    type: 'Consultation',
    description: 'Initial consultation and examination',
    receiptUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '4',
    date: '2023-09-22',
    doctor: 'Dr. Ada Nwosu',
    amount: 25000,
    status: 'Paid',
    type: 'Dental',
    description: 'Dental cleaning and checkup',
    receiptUrl: 'https://via.placeholder.com/150',
  },
  {
    id: '5',
    date: '2023-09-05',
    doctor: 'Dr. Yusuf Bello',
    amount: 18000,
    status: 'Denied',
    type: 'Specialist',
    description: 'Cardiology consultation',
    reason: 'Specialist visit not covered under current plan',
  },
];

const statusColors = {
  Paid: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Denied: 'bg-red-100 text-red-700',
};

const ClaimItem = ({ claim, onPress }: { claim: any; onPress: (claim: any) => void }) => {
  return (
    <TouchableOpacity 
      onPress={() => onPress(claim)}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View>
          <Text className="text-gray-500 font-sans text-sm">
            {new Date(claim.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </Text>
          <Text className="font-sans-medium text-gray-800 text-lg">{claim.doctor}</Text>
          <Text className="text-gray-600 text-sm font-sans">{claim.type}</Text>
        </View>
        <View className="items-end">
          <Text className="font-sans-bold text-gray-800 text-lg">
            ₦{claim.amount.toLocaleString()}
          </Text>
          <View className={`px-2 py-1 rounded-full mt-1 ${statusColors[claim.status]}`}>
            <Text className={`text-xs font-sans-medium`}>
              {claim.status}
            </Text>
          </View>
        </View>
      </View>
      <Text className="text-gray-600 font-sans text-sm mt-2" numberOfLines={1}>
        {claim.description}
      </Text>
      {claim.reason && (
        <View className="flex-row items-start mt-2">
          <Ionicons name="warning" size={16} color="#EF4444" style={{ marginTop: 2 }} />
          <Text className="text-red-600 font-sans mt-1 text-xs ml-1 flex-1">
            {claim.reason}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ClaimsScreen = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showClaimDetails, setShowClaimDetails] = useState(false);

  const filters = ['All', 'Paid', 'Pending', 'Denied'];
  
  const filteredClaims = selectedFilter === 'All' 
    ? dummyClaims 
    : dummyClaims.filter(claim => claim.status === selectedFilter);

  const handleClaimPress = (claim: any) => {
    setSelectedClaim(claim);
    setShowClaimDetails(true);
  };

  const handleFileClaim = () => {
    // Navigate to file claim screen
    router.push('/(patient)/(pages)/insurance/file-claim');
  };

  const renderClaimDetails = () => {
    if (!selectedClaim) return null;
    
    return (
      <View className="absolute inset-0 bg-black/50 justify-center p-4 z-10">
        <View className="bg-white rounded-2xl p-5">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-sans-bold text-gray-800">Claim Details</Text>
            <TouchableOpacity onPress={() => setShowClaimDetails(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="space-y-4">
              <View className="flex-row justify-between">
                <Text className="text-gray-500 font-sans">Claim ID</Text>
                <Text className="font-sans-medium">{selectedClaim?.id}</Text>
              </View>
              
              <View className="flex-row justify-between mt-2">
                <Text className="text-gray-500 font-sans">Date</Text>
                <Text className="font-sans-medium">
                  {new Date(selectedClaim.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
              
              <View className="flex-row justify-between mt-2">
                <Text className="text-gray-500 font-sans">Provider</Text>
                <Text className="font-sans-medium">{selectedClaim.doctor}</Text>
              </View>
              
              <View className="flex-row justify-between mt-2">
                <Text className="text-gray-500 font-sans">Type</Text>
                <Text className="font-sans-medium">{selectedClaim.type}</Text>
              </View>
              
              <View className="flex-row justify-between mt-2">
                <Text className="text-gray-500 font-sans">Amount</Text>
                <Text className="font-sans-bold text-lg">
                  ₦{selectedClaim.amount.toLocaleString()}
                </Text>
              </View>
              
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-gray-500 font-sans">Status</Text>
                <View className={`px-3 py-1 rounded-full ${statusColors[selectedClaim.status]}`}>
                  <Text className={`text-sm font-sans-medium`}>
                    {selectedClaim.status}
                  </Text>
                </View>
              </View>
              
              <View>
                <Text className="text-gray-500 font-sans mb-1 mt-2">Description</Text>
                <Text className="font-sans-medium">{selectedClaim.description}</Text>
              </View>
              
              {selectedClaim.reason && (
                <View className="bg-red-50 p-3 rounded-lg mt-2">
                  <Text className="text-red-700 text-sm font-sans-medium">
                    <Ionicons name="warning" size={16} color="#EF4444" /> {' '}
                    Claim Denied
                  </Text>
                  <Text className="text-red-600 font-sans text-sm mt-1">{selectedClaim.reason}</Text>
                </View>
              )}
              
              {selectedClaim.receiptUrl && (
                <View className="mt-2">
                  <Text className="text-gray-500 mb-2 font-sans">Receipt</Text>
                  <Image 
                    source={{ uri: selectedClaim.receiptUrl }} 
                    className="w-full h-40 rounded-lg"
                    resizeMode="cover"
                  />
                  <TouchableOpacity className="flex-row items-center justify-center mt-2">
                    <Ionicons name="download-outline" size={16} color="#3B82F6" />
                    <Text className="text-blue-500 font-sans-medium ml-1">Download Receipt</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <TouchableOpacity 
                className="bg-primary py-3 rounded-xl items-center mt-4"
                onPress={() => {
                  // Handle appeal or other actions
                  setShowClaimDetails(false);
                }}
              >
                <Text className="text-white font-sans-medium">
                  {selectedClaim.status === 'Denied' ? 'Appeal Decision' : 'View EOB'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6 pt-10 px-4">
          <View>
            <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-2">
              <Ionicons name="arrow-back" size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>
          <Text className="text-xl font-sans-bold text-gray-800">Insurance Claims</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Filter Tabs */}
        <View className="mb-4">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                className={`px-4 py-2 rounded-full mr-2 ${selectedFilter === filter ? 'bg-primary' : 'bg-white'}`}
              >
                <Text className={`font-sans-medium ${selectedFilter === filter ? 'text-white' : 'text-gray-600'}`}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Claims List */}
        <View className="flex-1 px-4">
          {filteredClaims.length > 0 ? (
            <FlatList
              data={filteredClaims}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ClaimItem 
                  claim={item} 
                  onPress={handleClaimPress} 
                />
              )}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 font-sans mt-4 text-center">
                No {selectedFilter.toLowerCase()} claims found
              </Text>
            </View>
          )}
        </View>
        
        {/* File New Claim Button */}
        <View className="px-4 pb-6">
          <TouchableOpacity 
            onPress={handleFileClaim}
            className="bg-primary py-4 rounded-xl items-center"
          >
            <Text className="text-white font-sans-medium">File New Claim</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Claim Details Modal */}
      {showClaimDetails && renderClaimDetails()}
    </SafeAreaView>
  );
};

export default ClaimsScreen;