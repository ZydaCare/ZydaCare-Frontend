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
import { format } from 'date-fns';
import { getDoctors } from '@/api/admin/doctors';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';

type StatusFilter = 'all' | 'approved' | 'pending' | 'under_review' | 'rejected' | 'suspended';

interface Doctor {
  _id: string;
  fullName: string;
  email: string;
  specialty: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  profile?: {
    profileImage?: {
      url: string;
      public_id: string;
    };
    specialty?: string;
  };
  user?: {
    isActive: boolean;
  };
}

export default function DoctorsScreen() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const fetchDoctors = useCallback(async () => {
    try {
      const data = await getDoctors({});
      console.log('Fetched doctors data:', JSON.stringify(data, null, 2));
      
      // Transform the data to match our interface
      const formattedData = data.map((doctor: any) => {
        console.log('Processing doctor:', doctor._id, 'status:', doctor.status, 'isActive:', doctor.user?.isActive);
        
        return {
          ...doctor,
          // Ensure we have a valid status, default to 'pending' if not provided
          status: doctor.status?.toLowerCase() || 'pending',
          // Get isActive from user object if available
          isActive: doctor.user?.isActive ?? true,
          // Get specialty from the most appropriate source
          specialty: doctor.specialty || doctor.speciality || doctor.profile?.specialty?.[0] || 'General Practitioner',
          // Ensure we have the full profile data
          profile: {
            ...doctor.profile,
            profileImage: doctor.profile?.profileImage || { url: '' },
          },
          // Ensure email is available at the root level
          email: doctor.email || doctor.user?.email || '',
        };
      });
      
      console.log('Formatted doctors data:', JSON.stringify(formattedData, null, 2));
      
      setDoctors(formattedData);
      setFilteredDoctors(formattedData);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      showToast('Failed to load doctors', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  useEffect(() => {
    let filtered = [...doctors];
    
    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(doctor => doctor.isActive && doctor.status === 'approved');
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(doctor => doctor.status === 'pending');
    } else if (statusFilter === 'suspended') {
      filtered = filtered.filter(doctor => !doctor.isActive || doctor.status === 'suspended');
    }
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor =>
        doctor.fullName.toLowerCase().includes(query) ||
        doctor.email.toLowerCase().includes(query) ||
        doctor.specialty.toLowerCase().includes(query)
      );
    }
    
    setFilteredDoctors(filtered);
  }, [searchQuery, doctors, statusFilter]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDoctors();
  }, [fetchDoctors]);

  const getStatusStyles = (status: string, isActive: boolean) => {
    const baseStyles = 'px-2 py-0.5 rounded-full text-xs font-sans-medium';
    
    // If account is not active, show as Inactive regardless of status
    if (!isActive) {
      return {
        container: `${baseStyles} bg-red-50`,
        text: 'text-red-700',
        label: 'Inactive'
      };
    }

    // If account is active, show the status
    switch (status?.toLowerCase()) {
      case 'approved':
        return {
          container: `${baseStyles} bg-green-50`,
          text: 'text-green-700',
          label: 'Active'
        };
      case 'pending':
        return {
          container: `${baseStyles} bg-yellow-50`,
          text: 'text-yellow-700',
          label: 'Pending Approval'
        };
      case 'under_review':
        return {
          container: `${baseStyles} bg-blue-50`,
          text: 'text-blue-700',
          label: 'Under Review'
        };
      case 'rejected':
        return {
          container: `${baseStyles} bg-red-50`,
          text: 'text-red-700',
          label: 'Rejected'
        };
      case 'suspended':
        return {
          container: `${baseStyles} bg-red-50`,
          text: 'text-red-700',
          label: 'Suspended'
        };
      default:
        return {
          container: `${baseStyles} bg-gray-50`,
          text: 'text-gray-700',
          label: status || 'Unknown'
        };
    }
  };

  const renderDoctorItem = ({ item }: { item: Doctor }) => {
    const profileImage = item.profile?.profileImage?.url;

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm"
        style={{ elevation: 2 }}
        onPress={() => router.push(`/(admin)/(pages)/doctor/${item._id}`)}
      >
        <View className="flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-full h-full"
                resizeMode="cover"
                onError={(e) => console.log('Error loading image:', e.nativeEvent.error)}
              />
            ) : (
              <Ionicons name="medical" size={28} color="#67A9AF" />
            )}
          </View>

          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-sans-bold text-gray-900">{item.fullName}</Text>
              {(() => {
                const statusStyles = getStatusStyles(item.status, item.isActive);
                return (
                  <View className={statusStyles.container}>
                    <Text className={statusStyles.text}>
                      {statusStyles.label}
                    </Text>
                  </View>
                );
              })()}
            </View>
            <Text className="text-sm font-sans text-gray-500 mt-1">{item.specialty}</Text>
            <Text className="text-xs font-sans text-gray-400 mt-1">{item.email}</Text>
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
          <Text className="text-2xl font-sans-bold text-gray-900 flex-1">Doctors</Text>
          <View className="bg-teal-50 px-3 py-1 rounded-full">
            <Text className="text-sm font-sans-bold text-[#67A9AF]">
              {filteredDoctors.length}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2 mt-2">
          <View className="flex-1 flex-row items-center bg-gray-50 rounded-lg px-4 py-2">
            <Ionicons name="search" size={18} color="#9CA3AF" />
            <TextInput
              className="flex-1 h-10 px-3 font-sans text-gray-900"
              placeholder="Search doctors..."
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
            className={`h-12 px-3 rounded-lg items-center justify-center ${
              statusFilter !== 'all' ? 'bg-primary/20' : 'bg-gray-50'
            }`}
            onPress={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={statusFilter === 'all' ? '#9CA3AF' : '#67A9AF'} 
            />
          </TouchableOpacity>
          
          {showFilterMenu && (
            <View className="absolute right-0 top-12 bg-white rounded-lg shadow-lg z-10 w-48">
              <TouchableOpacity 
                className={`px-4 py-3 ${statusFilter === 'all' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('all');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'all' ? 'text-teal-700' : 'text-gray-700'}`}>
                  All Doctors
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-4 py-3 ${statusFilter === 'approved' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('approved');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'approved' ? 'text-teal-700' : 'text-gray-700'}`}>
                  Approved Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-4 py-3 ${statusFilter === 'pending' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('pending');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'pending' ? 'text-teal-700' : 'text-gray-700'}`}>
                  Pending Approval
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-4 py-3 ${statusFilter === 'suspended' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('suspended');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'suspended' ? 'text-teal-700' : 'text-gray-700'}`}>
                  Suspended
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctorItem}
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
            <Ionicons name="medical-outline" size={60} color="#E5E7EB" />
            <Text className="text-lg font-sans-bold text-gray-500 mt-4 text-center">
              No doctors found
            </Text>
            <Text className="text-sm font-sans text-gray-400 mt-2 text-center">
              {searchQuery ? 'Try a different search term' : 'No doctors available'}
            </Text>
          </View>
        }
      />

      <View className='h-20' />
    </SafeAreaView>
  );
}