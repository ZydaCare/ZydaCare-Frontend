import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/authContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isFuture, startOfDay, endOfDay } from 'date-fns';
import { Appointment, AppointmentStats, getAppointmentStats, getDoctorAppointments } from '@/api/doctor/appointments';
import HealthTipsSection from '@/components/HealthTipsSection';

export default function DoctorHome() {
  const { user, doctorProfile, getDoctorProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await getDoctorProfile();
      await Promise.all([fetchStats(), fetchAppointments()]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getAppointmentStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const futureDate = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString(); // 3 months ahead

      const response = await getDoctorAppointments({
        startDate: todayStart,
        endDate: futureDate,
      });

      if (response.success) {
        const appointments = response.data;
        
        // Filter appointments into today and upcoming
        const today: Appointment[] = [];
        const upcoming: Appointment[] = [];

        appointments.forEach((appointment) => {
          const appointmentDate = parseISO(appointment.appointmentDate);
          
          if (isToday(appointmentDate)) {
            today.push(appointment);
          } else if (isFuture(appointmentDate)) {
            upcoming.push(appointment);
          }
        });

        // Sort by date/time
        today.sort((a, b) => parseISO(a.appointmentDate).getTime() - parseISO(b.appointmentDate).getTime());
        upcoming.sort((a, b) => parseISO(a.appointmentDate).getTime() - parseISO(b.appointmentDate).getTime());

        setTodayAppointments(today);
        setUpcomingAppointments(upcoming);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
        return 'bg-[#10B981]';
      case 'pending':
        return 'bg-[#F59E0B]';
      case 'awaiting_payment':
        return 'bg-[#67A9AF]';
      case 'cancelled':
        return 'bg-[#EF4444]';
      default:
        return 'bg-gray-400';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTotalPaidCount = () => {
    if (!stats) return 0;
    return (stats.stats.paid?.count || 0) + (stats.stats.confirmed?.count || 0);
  };

  const getTotalCancelledCount = () => {
    return stats?.stats.totalCancelledBookings?.count || 0;
  };

  const renderAppointmentCard = (appointment: Appointment) => {
    const appointmentDate = parseISO(appointment.appointmentDate);
    const timeString = format(appointmentDate, 'h:mm a');
    const dateString = format(appointmentDate, 'MMM d, yyyy');

    return (
      <TouchableOpacity
        key={appointment._id}
        className="bg-white rounded-2xl p-4 shadow-sm mb-3"
        style={{ elevation: 1 }}
        onPress={() =>
          router.push({
            pathname: '/(doctor)/(pages)/appointment/[id]',
            params: { id: appointment._id },
          })
        }
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mr-3 overflow-hidden">
              {appointment.patient?.profileImage?.url ? (
                <Image
                  source={{ uri: appointment.patient.profileImage.url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={24} color="#9CA3AF" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-base font-sans-medium text-gray-900">
                {appointment.patientInfo.fullName}
              </Text>
              <Text className="text-sm font-sans text-gray-500" numberOfLines={1}>
                {appointment.medicalContext.reasonForAppointment || 'Consultation'}
              </Text>
            </View>
          </View>
          <View className="items-end ml-2">
            <Text className="text-sm font-sans-medium text-gray-900 mb-1">
              {timeString}
            </Text>
            <View
              className={`px-2 py-1 rounded-full ${getStatusBgColor(
                appointment.status
              )}`}
            >
              <Text className="text-xs font-sans-medium text-white capitalize">
                {appointment.status}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#67A9AF"
          />
        }
      >
        {/* Header */}
        <View className="bg-white px-6 pt-6 pb-4">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-sm text-gray-500 font-sans-medium mb-1">{getGreeting()}</Text>
              <Text className="text-2xl font-sans-bold text-gray-900">
                {doctorProfile?.profile?.title} {doctorProfile?.fullName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(doctor)/(tabs)/profile')}
              className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center overflow-hidden"
            >
              {doctorProfile?.profile?.profileImage?.url ? (
                <Image
                  source={{ uri: doctorProfile.profile.profileImage.url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={24} color="#67A9AF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-2">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 font-sans text-gray-800 py-1"
              placeholder="Search patients, appointments..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  router.push({
                    pathname: '/(doctor)/(tabs)/patients',
                    params: { search: searchQuery },
                  });
                }
              }}
            />
          </View>
        </View>

        {/* Stats Cards */}
        <View className="px-6 py-4">
          <Text className="text-lg font-sans-bold text-gray-900 mb-4">Today's Overview</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
            className="py-1"
          >
            <View className="flex-row gap-6">
              <View className="bg-white rounded-2xl p-4 w-36 shadow-sm" style={{ elevation: 2 }}>
                <View className="w-10 h-10 bg-teal-50 rounded-lg items-center justify-center mb-2">
                  <Ionicons name="calendar" size={20} color="#67A9AF" />
                </View>
                <Text className="text-2xl font-sans-bold text-gray-900">
                  {stats?.todayAppointments || 0}
                </Text>
                <Text className="text-xs font-sans-medium text-gray-500">Today</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 w-36 shadow-sm" style={{ elevation: 2 }}>
                <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mb-2">
                  <Ionicons name="people" size={20} color="#3B82F6" />
                </View>
                <Text className="text-2xl font-sans-bold text-gray-900">
                  {stats?.totalPatients || 0}
                </Text>
                <Text className="text-xs font-sans-medium text-gray-500">Total Patients</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 w-36 shadow-sm" style={{ elevation: 2 }}>
                <View className="w-10 h-10 bg-green-50 rounded-lg items-center justify-center mb-2">
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
                <Text className="text-2xl font-sans-bold text-gray-900">
                  {getTotalPaidCount()}
                </Text>
                <Text className="text-xs font-sans-medium text-gray-500">Paid</Text>
              </View>

              <View className="bg-white rounded-2xl p-4 w-36 shadow-sm" style={{ elevation: 2 }}>
                <View className="w-10 h-10 bg-red-50 rounded-lg items-center justify-center mb-2">
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </View>
                <Text className="text-2xl font-sans-bold text-gray-900">
                  {getTotalCancelledCount()}
                </Text>
                <Text className="text-xs font-sans-medium text-gray-500">Cancelled</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View className="px-6 py-2">
          <Text className="text-lg font-sans-bold text-gray-900 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {[
              {
                title: 'Appointments',
                icon: 'calendar',
                color: '#67A9AF',
                onPress: () => router.push('/(doctor)/(tabs)/appointments'),
              },
              {
                title: 'Patients',
                icon: 'people',
                color: '#8B5CF6',
                onPress: () => router.push('/(doctor)/(tabs)/patients'),
              },
              {
                title: 'Availability',
                icon: 'time',
                color: '#F59E0B',
                onPress: () => router.push('/(doctor)/availability'),
              },
              {
                title: 'Earnings',
                icon: 'cash',
                color: '#10B981',
                onPress: () => router.push('/(doctor)/(tabs)/earnings'),
              },
              {
                title: 'Messages',
                icon: 'chatbubbles',
                color: '#3B82F6',
                onPress: () => router.push('/(doctor)/messages'),
              },
              {
                title: 'Profile',
                icon: 'person',
                color: '#EC4899',
                onPress: () => router.push('/(doctor)/(tabs)/profile'),
              },
            ].map((action, index) => (
              <TouchableOpacity
                key={index}
                onPress={action.onPress}
                className="w-[30%] items-center mb-4"
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                  style={{ backgroundColor: `${action.color}15` }}
                >
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text className="text-xs font-sans-medium text-center text-gray-700">
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Appointments */}
        {loading ? (
          <View className="px-6 py-4">
            <View className="bg-white rounded-2xl p-6 items-center justify-center">
              <ActivityIndicator size="small" color="#67A9AF" />
            </View>
          </View>
        ) : (
          <>
            {todayAppointments.length > 0 && (
              <View className="px-6 py-4">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-sans-bold text-gray-900">Today's Appointments</Text>
                  <TouchableOpacity onPress={() => router.push('/(doctor)/(tabs)/appointments')}>
                    <Text className="text-sm font-sans-medium text-[#67A9AF]">View All</Text>
                  </TouchableOpacity>
                </View>
                <View>
                  {todayAppointments.slice(0, 3).map(renderAppointmentCard)}
                </View>
              </View>
            )}

            {upcomingAppointments.length > 0 && (
              <View className="px-6 py-4">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-sans-bold text-gray-900">Upcoming Appointments</Text>
                  <TouchableOpacity onPress={() => router.push('/(doctor)/(tabs)/appointments')}>
                    <Text className="text-sm font-sans-medium text-[#67A9AF]">View All</Text>
                  </TouchableOpacity>
                </View>
                <View>
                  {upcomingAppointments.slice(0, 3).map(renderAppointmentCard)}
                </View>
              </View>
            )}

            {todayAppointments.length === 0 && upcomingAppointments.length === 0 && (
              <View className="px-6 py-4">
                <Text className="text-lg font-sans-bold text-gray-900 mb-4">Appointments</Text>
                <View className="bg-white rounded-2xl p-6 items-center justify-center">
                  <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                  <Text className="text-gray-500 font-sans mt-2 text-center">
                    No upcoming appointments
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        <HealthTipsSection />

        <View className='h-24' />
      </ScrollView>
    </SafeAreaView>
  );
}