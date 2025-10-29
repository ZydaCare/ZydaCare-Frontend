import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { getAppointments, getAppointmentStats, Appointment, AppointmentStats } from '@/api/admin/appointments';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { LinearGradient } from 'expo-linear-gradient';

type StatusFilter = 'all' | 'pending' | 'accepted' | 'awaiting_payment' | 'paid' | 'cancelled';

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await getAppointments();
      const appointmentsData = response?.data || [];

      if (appointmentsData.length === 0) {
        showToast('No appointments found', 'info');
      }

      setAppointments(appointmentsData);
      setFilteredAppointments(appointmentsData);

      if (user?.role === 'admin' || user?.role === 'super_admin') {
        try {
          const statsRes = await getAppointmentStats();
          setStats(statsRes.data);
        } catch (error) {
          if (error.response?.status !== 403) {
            console.error('Error fetching appointment stats:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      showToast('Failed to load appointments', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast, user?.role]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    let filtered = [...appointments];

    if (searchQuery?.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(appt => {
        const patientName = `${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`.toLowerCase();
        const email = appt.patient?.email?.toLowerCase() || '';
        const ref = appt.reference?.toLowerCase() || '';
        const doctorName = appt.doctor?.fullName?.toLowerCase() || '';

        return (
          patientName.includes(query) ||
          email.includes(query) ||
          ref.includes(query) ||
          doctorName.includes(query)
        );
      });
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(appt => appt.status === statusFilter);
    }

    setFilteredAppointments(filtered);
  }, [searchQuery, statusFilter, appointments]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAppointments();
  }, [fetchAppointments]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { gradient: ['#10B981', '#059669'], text: 'Paid', icon: 'checkmark-circle' };
      case 'accepted':
      case 'confirmed':
        return { gradient: ['#3B82F6', '#2563EB'], text: 'Confirmed', icon: 'checkmark-done' };
      case 'pending':
        return { gradient: ['#F59E0B', '#D97706'], text: 'Pending', icon: 'time' };
      case 'awaiting_payment':
        return { gradient: ['#F59E0B', '#D97706'], text: 'Awaiting Payment', icon: 'card' };
      case 'cancelled':
        return { gradient: ['#EF4444', '#DC2626'], text: 'Cancelled', icon: 'close-circle' };
      default:
        return { gradient: ['#6B7280', '#4B5563'], text: status || 'Unknown', icon: 'ellipse' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy • h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl mb-3 mx-4 shadow-md overflow-hidden"
        style={{ elevation: 3 }}
        onPress={() => router.push({
          pathname: '/(admin)/(pages)/appointment/[id]',
          params: { id: item._id }
        })}
      >
        {/* Status Bar */}
        <LinearGradient
          colors={statusConfig.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 py-2"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name={statusConfig.icon as any} size={14} color="white" />
              <Text className="text-white text-xs font-sans-bold ml-1.5 uppercase">
                {statusConfig.text}
              </Text>
            </View>
            <Text className="text-white/90 text-xs font-sans-medium">
              #{item.reference || item._id?.substring(0, 8)}
            </Text>
          </View>
        </LinearGradient>

        <View className="p-4">
          {/* Patient Info */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center flex-1">
              <View className="bg-primary/10 p-2.5 rounded-xl mr-3">
                <Ionicons name="person" size={20} color="#67A9AF" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-sans-bold text-base">
                  {`${item.patient.firstName} ${item.patient.lastName}`}
                </Text>
                <Text className="text-gray-500 text-xs font-sans mt-0.5">
                  {item.patient.email}
                </Text>
              </View>
            </View>
            <View className="bg-teal-50 px-3 py-1.5 rounded-xl">
              <Text className="text-teal-700 font-sans-bold text-sm">
                ₦{item.amount.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Doctor Info */}
          <View className="flex-row items-center mb-3 pb-3 border-b border-gray-100">
            <View className="bg-orange-50 p-2 rounded-lg mr-2">
              <Ionicons name="medical" size={16} color="#F97316" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-700 font-sans-medium text-sm">
                {item?.doctor?.profile?.title} {item.doctor?.fullName || 'N/A'}
              </Text>
              {item.doctor?.speciality && (
                <Text className="text-gray-500 text-xs font-sans mt-0.5">
                  {item.doctor.speciality}
                </Text>
              )}
            </View>
          </View>

          {/* Date & Type */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text className="text-gray-600 font-sans text-sm ml-2">
                {formatDate(item.appointmentDate)}
              </Text>
            </View>
            <View className={`px-3 py-1 rounded-lg ${item.appointmentType === 'virtual' ? 'bg-blue-50' :
              item.appointmentType === 'home' ? 'bg-green-50' : 'bg-purple-50'
              }`}>
              <View className="flex-row items-center">
                <Ionicons
                  name={item.appointmentType === 'virtual' ? 'videocam' : 'home'}
                  size={12}
                  color={
                    item.appointmentType === 'virtual' ? '#3B82F6' :
                      item.appointmentType === 'home' ? '#10B981' : '#8B5CF6'
                  }
                />
                <Text className={`text-xs font-sans-bold ml-1 ${item.appointmentType === 'virtual' ? 'text-blue-700' :
                  item.appointmentType === 'home' ? 'text-green-700' : 'text-purple-700'
                  }`}>
                  {item.appointmentType.charAt(0).toUpperCase() + item.appointmentType.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#67A9AF" />
        <Text className="text-gray-600 font-sans-medium mt-4">Loading appointments...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-6 pb-4 pt-10">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-sans-bold text-gray-900">Appointments</Text>
            <Text className="text-gray-500 font-sans text-sm mt-0.5">
              {filteredAppointments.length} total appointments
            </Text>
          </View>
          <TouchableOpacity
            className="p-2"
            onPress={() => setShowFilterMenu(!showFilterMenu)}
          >
            <Ionicons name="filter" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="relative">
            <Ionicons
              name="search"
              size={18}
              color="#9CA3AF"
              style={{ position: 'absolute', left: 12, top: 14, zIndex: 10 }}
            />
            <TextInput
              className="bg-gray-100 rounded-xl pl-10 pr-4 py-4 text-base font-sans text-gray-900"
              placeholder="Search appointments..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          {/* </View> */}

          {/* Filter Dropdown Menu - Original Style */}
          {showFilterMenu && (
            <View className="absolute right-0 top-14 bg-white rounded-lg shadow-lg z-50 w-48" style={{ elevation: 8 }}>
              <TouchableOpacity
                className={`px-4 py-3 ${statusFilter === 'all' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('all');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'all' ? 'text-teal-700' : 'text-gray-700'}`}>
                  All Appointments
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
                  Pending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-3 ${statusFilter === 'accepted' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('accepted');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'accepted' ? 'text-teal-700' : 'text-gray-700'}`}>
                  Accepted
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-3 ${statusFilter === 'awaiting_payment' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('awaiting_payment');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'awaiting_payment' ? 'text-teal-700' : 'text-gray-700'}`}>
                  Awaiting Payment
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-3 ${statusFilter === 'paid' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('paid');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'paid' ? 'text-teal-700' : 'text-gray-700'}`}>
                  Paid
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-3 ${statusFilter === 'cancelled' ? 'bg-teal-50' : ''}`}
                onPress={() => {
                  setStatusFilter('cancelled');
                  setShowFilterMenu(false);
                }}
              >
                <Text className={`font-sans ${statusFilter === 'cancelled' ? 'text-teal-700' : 'text-gray-700'}`}>
                  Cancelled
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Collapsible Stats Card */}
      {stats && (
        <View className="px-6 pt-4">
          <TouchableOpacity
            onPress={() => setShowStats(!showStats)}
            activeOpacity={0.7}
          >
            <View className="bg-white rounded-2xl shadow-md overflow-hidden" style={{ elevation: 3 }}>
              <LinearGradient
                colors={['#67A9AF', '#5A9BA0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="px-5 py-4"
              >
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <View className='flex-row items-center justify-between'>
                      <Text className="text-white font-sans-bold text-sm mb-2 opacity-90">STATISTICS OVERVIEW</Text>
                      <View className="bg-white/20 p-1 rounded-xl">
                        <Ionicons
                          name={showStats ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="white"
                        />
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between mt-3">
                      <View>
                        <Text className="text-white text-2xl font-sans-bold mr-4 text-center">{stats.total || 0}</Text>
                        <Text className="text-white/80 text-xs font-sans-medium mt-1 text-center">
                          Bookings
                        </Text>
                      </View>
                      <View>
                        <Text className="text-white text-lg font-sans-bold text-center">
                          ₦{stats.totalRevenue?.toLocaleString('en-NG') || '0'}
                        </Text>
                        <Text className="text-white/80 text-xs font-sans-medium text-center">Revenue</Text>
                      </View>
                    </View>
                  </View>

                </View>
              </LinearGradient>

              {showStats && (
                <View className="p-5">
                  <View className="flex-row justify-between mb-4">
                    <View className="items-center">
                      <View className="bg-emerald-50 p-3 rounded-xl mb-2">
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      </View>
                      <Text className="text-gray-900 font-sans-bold text-lg">{stats.paid || 0}</Text>
                      <Text className="text-gray-500 text-xs font-sans-medium">Paid</Text>
                    </View>

                    <View className="items-center">
                      <View className="bg-amber-50 p-3 rounded-xl mb-2">
                        <Ionicons name="time" size={24} color="#F59E0B" />
                      </View>
                      <Text className="text-gray-900 font-sans-bold text-lg">{stats.awaiting_payment || 0}</Text>
                      <Text className="text-gray-500 text-xs font-sans-medium">Pending</Text>
                    </View>

                    <View className="items-center">
                      <View className="bg-rose-50 p-3 rounded-xl mb-2">
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </View>
                      <Text className="text-gray-900 font-sans-bold text-lg">{stats.cancelled || 0}</Text>
                      <Text className="text-gray-500 text-xs font-sans-medium">Cancelled</Text>
                    </View>
                  </View>

                  <View className="bg-gray-50 rounded-xl p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-600 font-sans-medium text-sm">Success Rate</Text>
                      <Text className="text-gray-900 font-sans-bold text-base">
                        {stats.completionRate ? Math.round(stats.completionRate * 100) : 0}%
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Appointments List */}
      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointmentItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#67A9AF']}
            tintColor="#67A9AF"
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-20 px-10">
            <View className="bg-gray-100 p-6 rounded-full mb-4">
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
            </View>
            <Text className="text-xl font-sans-bold text-gray-800 mb-2 text-center">
              No appointments found
            </Text>
            <Text className="text-sm font-sans text-gray-500 text-center">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Appointments will appear here once they are booked'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}