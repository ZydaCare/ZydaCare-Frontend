import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchPatients, searchAppointments, PatientSearchResult, AppointmentSearchResult } from '@/api/doctor/search';
import { format } from 'date-fns';

type SearchTab = 'patients' | 'appointments';

const SearchScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('patients');
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search results state
  const [patients, setPatients] = useState<PatientSearchResult[]>([]);
  const [appointments, setAppointments] = useState<AppointmentSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setPatients([]);
      setAppointments([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      if (activeTab === 'patients') {
        const result = await searchPatients(searchQuery);
        setPatients(result.data);
      } else {
        const result = await searchAppointments(searchQuery);
        setAppointments(result.data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
      setRefreshing(false);
    }
  }, [searchQuery, activeTab]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, handleSearch]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    handleSearch();
  }, [handleSearch]);

  const renderPatientItem = (patient: PatientSearchResult) => (
    <TouchableOpacity
      key={patient._id}
      className="bg-white p-4 rounded-xl mb-3 flex-row items-center"
      onPress={() => router.push(`/(doctor)/(pages)/patient/${patient._id}`)}
    >
      {patient.profileImage ? (
        <Image 
          source={{ uri: patient.profileImage.url }} 
          className="w-12 h-12 rounded-full mr-4"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-4">
          <Ionicons name="person" size={24} color="#6B7280" />
        </View>
      )}
      <View className="flex-1">
        <Text className="font-sans-medium text-gray-900">
          {patient.firstName} {patient.lastName}
        </Text>
        <Text className="text-sm text-gray-500 font-sans">
          {patient.email}
        </Text>
        {patient.phone && (
          <Text className="text-sm text-gray-500 font-sans">
            {patient.phone}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderAppointmentItem = (appointment: AppointmentSearchResult) => (
    <TouchableOpacity
      key={appointment._id}
      className="bg-white p-4 rounded-xl mb-3"
      onPress={() => router.push(`/(doctor)/(pages)/appointment/${appointment._id}`)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="font-sans-medium text-gray-900">
          {appointment.patient.firstName} {appointment.patient.lastName}
        </Text>
        <View className={`px-2 py-1 rounded-full ${
          appointment.status === 'completed' ? 'bg-green-100' : 
          appointment.status === 'cancelled' ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          <Text className={`text-xs font-sans-medium ${
            appointment.status === 'completed' ? 'text-green-800' : 
            appointment.status === 'cancelled' ? 'text-red-800' : 'text-blue-800'
          }`}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center mb-1">
        <Ionicons name="calendar-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
        <Text className="text-sm text-gray-600 font-sans">
          {format(new Date(appointment.appointmentDate), 'MMM d, yyyy h:mm a')}
        </Text>
      </View>
      
      {appointment.appointmentType && (
        <View className="flex-row items-center">
          <Ionicons name="medical-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
          <Text className="text-sm text-gray-600 font-sans">
            {appointment.appointmentType}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderNoResults = () => (
    <View className="flex-1 items-center justify-center py-10">
      <Ionicons 
        name={activeTab === 'patients' ? 'people-outline' : 'calendar-outline'} 
        size={48} 
        color="#D1D5DB" 
      />
      <Text className="text-lg font-sans-medium text-gray-500 mt-4">
        {hasSearched 
          ? 'No results found' 
          : activeTab === 'patients' 
            ? 'Search for patients by name, email, or phone' 
            : 'Search for appointments by patient name or type'}
      </Text>
      {!hasSearched && (
        <Text className="text-gray-400 text-center mt-2 font-sans">
          Type to start searching
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="p-2 -ml-2 mr-2"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          
          {/* Search Bar */}
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              placeholder={
                activeTab === 'patients' 
                  ? 'Search patients...' 
                  : 'Search appointments...'
              }
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 font-sans text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row mt-4 border-b border-gray-100">
          {(['patients', 'appointments'] as SearchTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-3 items-center ${
                activeTab === tab ? 'border-b-2 border-primary' : ''
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                className={`font-sans-medium ${
                  activeTab === tab ? 'text-primary' : 'text-gray-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Search Results */}
      <ScrollView
        className="flex-1 px-4 py-2"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#67A9AF']}
            tintColor="#67A9AF"
          />
        }
      >
        {isSearching ? (
          <View className="py-10">
            <ActivityIndicator size="large" color="#67A9AF" />
          </View>
        ) : activeTab === 'patients' ? (
          patients.length > 0 ? (
            patients.map(renderPatientItem)
          ) : (
            renderNoResults()
          )
        ) : appointments.length > 0 ? (
          appointments.map(renderAppointmentItem)
        ) : (
          renderNoResults()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchScreen;
