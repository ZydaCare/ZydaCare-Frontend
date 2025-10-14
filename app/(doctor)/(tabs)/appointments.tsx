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
  ScrollView
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isTomorrow, isYesterday } from 'date-fns';
import { getDoctorAppointments, Appointment } from '@/api/doctor/appointments';
import { useToast } from '@/components/ui/Toast';

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-600',
  awaiting_payment: 'bg-primary text-white',
  paid: 'bg-green-50 text-green-600',
  cancelled: 'bg-red-50 text-red-600',
};

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { showToast } = useToast();

  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'awaiting_payment', label: 'Awaiting Payment' },
    { value: 'paid', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [searchQuery, statusFilter, appointments]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await getDoctorAppointments();
      if (response.success) {
        // Sort appointments by date (newest first)
        const sortedAppointments = response.data.sort((a, b) => 
          new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        );
        setAppointments(sortedAppointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showToast('Failed to load appointments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const isDateMatch = (date: Date, query: string): boolean => {
    // Try different date formats
    const formats = {
      fullDate: format(date, 'MMMM d yyyy'),     // December 10 2025
      fullDateWithComma: format(date, 'MMMM d, yyyy'), // December 10, 2025
      shortDate: format(date, 'MMM d yyyy'),     // Dec 10 2025
      shortDateWithComma: format(date, 'MMM d, yyyy'), // Dec 10, 2025
      numericDate1: format(date, 'M/d/yyyy'),    // 12/10/2025
      numericDate2: format(date, 'd/M/yyyy'),    // 10/12/2025
      isoDate: format(date, 'yyyy-MM-dd'),       // 2025-12-10
    };

    return Object.values(formats).some(formattedDate => 
      formattedDate.toLowerCase().includes(query.toLowerCase())
    );
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appt => appt.status === statusFilter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim();
      filtered = filtered.filter(appt => {
        const appointmentDate = parseISO(appt.appointmentDate);
        return (
          appt.patientInfo.fullName.toLowerCase().includes(query.toLowerCase()) ||
          appt.medicalContext.reasonForAppointment.toLowerCase().includes(query.toLowerCase()) ||
          appt.appointmentType.toLowerCase().includes(query.toLowerCase()) ||
          getFormattedDate(appt.appointmentDate).toLowerCase().includes(query.toLowerCase()) ||
          getTime(appt.appointmentDate).toLowerCase().includes(query.toLowerCase()) ||
          isDateMatch(appointmentDate, query)
        );
      });
    }

    setFilteredAppointments(filtered);
  };

  const getFormattedDate = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    
    return format(date, 'MMM dd, yyyy');
  };

  const getTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
  };

  const renderAppointmentCard = ({ item }: { item: Appointment }) => {
    const status = item.status as keyof typeof statusColors;
    const statusStyle = statusColors[status] || 'bg-gray-100 text-gray-800';
    
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
        style={{ elevation: 2 }}
        onPress={() =>
          router.push({
            pathname: '/(doctor)/(pages)/appointment/[id]',
            params: { id: item._id },
          })
        }
      >
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-sans-bold text-gray-900">
              {item.patientInfo.fullName}
            </Text>
            <Text className="text-sm font-sans text-gray-500">
              {item.appointmentType.charAt(0).toUpperCase() + item.appointmentType.slice(1)}
            </Text>
          </View>
          
          <View className={`px-2 py-1 rounded-full ${statusStyle}`}>
            <Text className={`text-xs font-sans-medium capitalize ${statusStyle}`}>
              {item.status}
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <View className="flex-row items-center mb-1">
            <Ionicons name="calendar-outline" size={16} color="#67A9AF" />
            <Text className="text-sm font-sans text-gray-700 ml-2">
              {getFormattedDate(item.appointmentDate)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={16} color="#67A9AF" />
            <Text className="text-sm font-sans text-gray-700 ml-2">
              {getTime(item.appointmentDate)}
            </Text>
          </View>
        </View>

        {item.medicalContext.reasonForAppointment && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <Text className="text-sm font-sans text-gray-700" numberOfLines={2}>
              {item.medicalContext.reasonForAppointment}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      <View className="bg-white px-6 pt-6 pb-4">
        <View className="flex-row items-center mb-4">
          <Text className="text-2xl font-sans-bold text-gray-900 flex-1">My Appointments</Text>
          <View className="bg-teal-50 px-3 py-1 rounded-full">
            <Text className="text-sm font-sans-bold text-[#67A9AF]">
              {filteredAppointments.length}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-2 mb-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 font-sans text-gray-800 py-1"
            placeholder="Search by patient or reason..."
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

        {/* Status Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="mb-2"
          contentContainerStyle={{ paddingRight: 24 }}
        >
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`px-4 py-2 rounded-full mr-2 ${
                statusFilter === option.value
                  ? 'bg-[#67A9AF]'
                  : 'bg-gray-100'
              }`}
              onPress={() => setStatusFilter(option.value)}
            >
              <Text
                className={`text-sm font-sans-medium ${
                  statusFilter === option.value ? 'text-white' : 'text-gray-700'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#67A9AF" />
          <Text className="text-gray-500 font-sans mt-4">Loading appointments...</Text>
        </View>
      ) : filteredAppointments.length > 0 ? (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentCard}
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
          <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
          <Text className="text-lg font-sans-bold text-gray-900 mt-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'No appointments found' 
              : 'No appointments yet'}
          </Text>
          <Text className="text-sm font-sans text-gray-500 text-center mt-2">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Appointments will appear here once scheduled'}
          </Text>
        </View>
      )}

        <View className='h-24' />
    </SafeAreaView>
  );
}