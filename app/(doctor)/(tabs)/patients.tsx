import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { getDoctorPatients, Patient } from '@/api/doctor/appointments';
import { useToast } from '@/components/ui/Toast';

export default function PatientsScreen() {
  const params = useLocalSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState((params.search as string) || '');
  const { showToast } = useToast();

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchQuery, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await getDoctorPatients();
      if (response.success) {
        setPatients(response.data);
        setFilteredPatients(response.data);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      showToast('Failed to load patients', 'error')
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  };

  const filterPatients = () => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = patients.filter((patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const email = patient.email.toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        patient.firstName.toLowerCase().includes(query) ||
        patient.lastName.toLowerCase().includes(query)
      );
    });
    setFilteredPatients(filtered);
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    const fullName = `${item.firstName} ${item.lastName}`;
    const lastVisit = item.lastAppointment
      ? format(parseISO(item.lastAppointment), 'MMM dd, yyyy')
      : 'No visits';

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
        style={{ elevation: 2 }}
        onPress={() =>
          router.push({
            pathname: '/(doctor)/(pages)/patient/[id]',
            params: { id: item._id },
          })
        }
      >
        <View className="flex-row items-center">
          <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
            {item.profileImage?.url ? (
              <Image
                source={{ uri: item.profileImage.url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={28} color="#9CA3AF" />
            )}
          </View>

          <View className="flex-1 ml-3">
            <Text className="text-base font-sans-bold text-gray-900">{fullName}</Text>
            <Text className="text-sm font-sans text-gray-500 mt-1">{item.email}</Text>
            <View className="flex-row items-center mt-2">
              <View className="flex-row items-center mr-4">
                <Ionicons name="calendar-outline" size={14} color="#67A9AF" />
                <Text className="text-xs font-sans-medium text-gray-600 ml-1">
                  {item.totalAppointments} visits
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color="#67A9AF" />
                <Text className="text-xs font-sans-medium text-gray-600 ml-1">
                  {lastVisit}
                </Text>
              </View>
            </View>
          </View>

          <View className="items-center">
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            {item.shareProfile && (
              <View className="bg-green-50 px-2 py-1 rounded-full mt-2">
                <Text className="text-xs font-sans-medium text-green-600">Shared</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      <View className="bg-white px-6 pt-6 pb-4">
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl font-sans-bold text-gray-900 flex-1">My Patients</Text>
          <View className="bg-teal-50 px-3 py-1 rounded-full">
            <Text className="text-sm font-sans-bold text-[#67A9AF]">
              {filteredPatients.length}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 font-sans text-gray-800 py-1"
            placeholder="Search by name or email..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#67A9AF" />
          <Text className="text-gray-500 font-sans mt-4">Loading patients...</Text>
        </View>
      ) : filteredPatients.length > 0 ? (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#67A9AF"
            />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="people-outline" size={64} color="#D1D5DB" />
          <Text className="text-lg font-sans-bold text-gray-900 mt-4">
            {searchQuery ? 'No patients found' : 'No patients yet'}
          </Text>
          <Text className="text-sm font-sans text-gray-500 text-center mt-2">
            {searchQuery
              ? 'Try adjusting your search'
              : 'Patients will appear here once they book appointments'}
          </Text>
        </View>
      )}

      <View className='h-24' />
    </SafeAreaView>
  );
}