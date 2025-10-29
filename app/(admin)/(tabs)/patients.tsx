import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { getPatients } from '@/api/admin/patients';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';

interface ProfileImage {
  public_id: string;
  url: string;
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  lastActive?: string;
  createdAt: string;
  profileImage?: ProfileImage | string | null;
  healthProfile?: {
    bloodType?: string;
    height?: number;
    weight?: number;
  };
}

export default function PatientsScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const fetchPatients = useCallback(async () => {
    try {
      const data = await getPatients({});
      console.log('Fetched patients data:', data);
      // Ensure profileImage URLs are properly formatted
      const formattedData = data.map((patient: Patient) => {
        // If profileImage is an object with url, use that, otherwise use the value as is
        const profileImage = typeof patient.profileImage === 'object' && patient.profileImage !== null 
          ? patient.profileImage.url 
          : patient.profileImage;
          
        return {
          ...patient,
          profileImage: profileImage || null
        };
      });
      setPatients(formattedData);
      setFilteredPatients(formattedData);
    } catch (error) {
      console.error('Error fetching patients:', error);
      showToast('Failed to fetch patients', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    let filtered = [...patients];
    
    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(patient => patient.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(patient => !patient.isActive);
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(query) ||
        patient.email.toLowerCase().includes(query) ||
        (patient.phone && patient.phone.includes(searchQuery))
      );
    }
    
    setFilteredPatients(filtered);
  }, [searchQuery, patients, statusFilter]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPatients();
  }, [fetchPatients]);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-gray-500';
  };
  
  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const renderPatientItem = ({ item }: { item: Patient }) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    const lastActive = item.lastActive 
      ? format(parseISO(item.lastActive), 'MMM dd, yyyy')
      : 'Never';

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm"
        style={{ elevation: 2 }}
        onPress={() => router.push(`/(admin)/(pages)/patient/${item._id}`)}
      >
        <View className="flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
            {item.profileImage && typeof item.profileImage === 'string' ? (
              <Image
                source={{ uri: item.profileImage }}
                className="w-full h-full"
                resizeMode="cover"
                onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
              />
            ) : (
              <Ionicons name="person" size={28} color="#9CA3AF" />
            )}
          </View>

          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-sans-bold text-gray-900">{fullName}</Text>
              <View className={`px-2 py-0.5 rounded-full ${item.isActive ? 'bg-green-50' : 'bg-gray-100'}`}>
                <Text className={`text-xs font-sans-medium ${item.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                  {getStatusText(item.isActive)}
                </Text>
              </View>
            </View>
            <Text className="text-sm font-sans text-gray-500 mt-1">{item.email}</Text>
            <View className="flex-row items-center mt-2">
              <View className="flex-row items-center">
                <Ionicons name="phone-portrait-outline" size={14} color="#67A9AF" />
                <Text className="text-xs font-sans-medium text-gray-600 ml-1">
                  {item.phone || 'No phone'}
                </Text>
              </View>
              {/* <View className="flex-row items-center ml-4">
                <Ionicons name="time-outline" size={14} color="#67A9AF" />
                <Text className="text-xs font-sans-medium text-gray-600 ml-1">
                  {lastActive}
                </Text>
              </View> */}
            </View>
          </View>

          <View className="items-center ml-2">
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#67A9AF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      <View className="bg-white px-6 pt-6 pb-4">
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl font-sans-bold text-gray-900 flex-1">Patients</Text>
          <View className="bg-teal-50 px-3 py-1 rounded-full">
            <Text className="text-sm font-sans-bold text-[#67A9AF]">
              {filteredPatients.length}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 mt-2">
          <View className="flex-1 flex-row items-center bg-gray-50 rounded-lg px-4 py-2">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 h-10 px-3 font-sans text-gray-900"
              placeholder="Search patients..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            className={`h-12 px-3 rounded-lg items-center justify-center ${statusFilter !== 'all' ? 'bg-primary/20' : 'bg-gray-50'}`}
            onPress={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={statusFilter === 'all' ? '#9CA3AF' : '#67A9AF'} 
            />
          </TouchableOpacity>
          
          {showFilterMenu && (
            <View className="absolute right-0 top-12 bg-white rounded-lg shadow-lg z-10 w-40">
              <TouchableOpacity 
                className={`px-4 py-3 ${statusFilter === 'all' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('all');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'all' ? 'text-teal-700' : 'text-gray-700'}`}>
                  All Patients
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-4 py-3 ${statusFilter === 'active' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('active');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'active' ? 'text-teal-700' : 'text-gray-700'}`}>
                  Active Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-4 py-3 ${statusFilter === 'inactive' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('inactive');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'inactive' ? 'text-teal-700' : 'text-gray-700'}`}>
                  Inactive Only
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredPatients}
        renderItem={renderPatientItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24, paddingHorizontal: 0 }}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh}
            colors={['#67A9AF']}
            tintColor="#67A9AF"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-16 px-10">
            <Ionicons name="people-outline" size={60} color="#E5E7EB" />
            <Text className="text-lg font-sans-bold text-gray-500 mt-4 text-center">
              No patients found
            </Text>
            <Text className="text-sm font-sans text-gray-400 mt-2 text-center">
              {searchQuery ? 'Try a different search term' : 'No patients available'}
            </Text>
          </View>
        }
      />

      <View className='h-20' />
    </SafeAreaView>
  );
}