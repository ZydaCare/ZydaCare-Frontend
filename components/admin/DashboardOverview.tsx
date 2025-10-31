import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { getDashboardOverview } from '@/api/admin/dashboard';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/authContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

interface DashboardStats {
  counts?: {
    doctors: number;
    patients: number;
    bookings: number;
    revenue: number;
    earnings: number;
  };
  doctors?: number;
  patients?: number;
  bookings?: number;
  revenue?: number;
  earnings?: number;
  registrations: {
    today: number;
    thisWeek: number;
  };
  monthlyActiveUsers: number;
  bookingStatus: Record<string, number>;
  trends?: {
    doctors?: number;
    patients?: number;
    bookings?: number;
    revenue?: number;
  };
}

const defaultDashboardStats: DashboardStats = {
  doctors: 0,
  patients: 0,
  bookings: 0,
  revenue: 0,
  earnings: 0,
  registrations: {
    today: 0,
    thisWeek: 0,
  },
  monthlyActiveUsers: 0,
  bookingStatus: {}
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return { bg: 'bg-emerald-500', text: 'text-emerald-700', lightBg: 'bg-emerald-50' };
    case 'pending':
      return { bg: 'bg-amber-500', text: 'text-amber-700', lightBg: 'bg-amber-50' };
    case 'accepted':
      return { bg: 'bg-blue-500', text: 'text-blue-700', lightBg: 'bg-blue-50' };
    case 'cancelled':
      return { bg: 'bg-rose-500', text: 'text-rose-700', lightBg: 'bg-rose-50' };
    case 'awaiting_payment':
      return { bg: 'bg-primary', text: 'text-primary', lightBg: 'bg-primary/20' };
    default:
      return { bg: 'bg-gray-400', text: 'text-gray-700', lightBg: 'bg-gray-50' };
  }
};

function StatCard({ label, value, icon, gradient, trend }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  gradient: string[];
  trend?: { value: string; isPositive: boolean } | null;
}) {
  return (
    <View className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ elevation: 4 }}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="bg-white/30 p-3 rounded-xl backdrop-blur">
            {icon}
          </View>
          {trend && (
            <View className={`flex-row items-center px-3 py-1.5 rounded-full bg-black/20`}>
              <Ionicons
                name={trend.isPositive ? 'trending-up' : 'trending-down'}
                size={14}
                color="white"
              />
              <Text className="text-white text-xs font-sans-semibold ml-1">{trend.value}</Text>
            </View>
          )}
        </View>
        <Text className="text-3xl font-sans-bold text-white mb-1">{value}</Text>
        <Text className="text-white/90 text-sm font-sans-medium">{label}</Text>
      </LinearGradient>
    </View>
  );
}

export function DashboardOverview() {
  const [data, setData] = useState<DashboardStats>(defaultDashboardStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await getDashboardOverview();

        if (result && typeof result === 'object') {
          if ('data' in result) {
            setData(result.data as DashboardStats);
          } else {
            setData(result as DashboardStats);
          }
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    try {
      getDashboardOverview();
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [getDashboardOverview]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <ActivityIndicator size="large" color="#67A9AF" />
        {/* <Text className="text-gray-600 mt-4 font-sans-medium">Loading dashboard...</Text> */}
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 p-4">
        <View className="bg-red-50 p-6 rounded-2xl border border-red-200">
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text className="text-red-600 text-center mt-4 font-sans-semibold">{error}</Text>
        </View>
      </View>
    );
  }

  const stats = {
    ...defaultDashboardStats,
    ...(data?.counts || {
      doctors: data?.doctors,
      patients: data?.patients,
      bookings: data?.bookings,
      revenue: data?.revenue,
      earnings: data?.earnings
    }),
    registrations: {
      ...defaultDashboardStats.registrations,
      ...(data?.registrations || {})
    },
    monthlyActiveUsers: data?.monthlyActiveUsers || 0,
    bookingStatus: data?.bookingStatus || {},
    trends: data?.trends || {}
  };

  const finalStats = {
    doctors: stats.doctors || 0,
    patients: stats.patients || 0,
    bookings: stats.bookings || 0,
    revenue: stats.revenue || 0,
    earnings: stats.earnings || 0,
    registrations: stats.registrations,
    monthlyActiveUsers: stats.monthlyActiveUsers,
    bookingStatus: stats.bookingStatus
  };

  // Calculate trends based on available data

  // Doctors trend: ratio of doctors to patients (healthcare capacity)
  const calculateDoctorsTrend = () => {
    if (finalStats.patients === 0) return null;
    // Calculate doctor-to-patient ratio as percentage
    // Ideal ratio is around 1:10 to 1:20, so we normalize to show capacity
    const ratio = (finalStats.doctors / finalStats.patients) * 100;
    return ratio;
  };

  // Patients trend: active users percentage
  const calculatePatientsTrend = () => {
    if (finalStats.patients === 0) return null;
    const activityRate = (finalStats.monthlyActiveUsers / finalStats.patients) * 100;
    return activityRate;
  };

  // Bookings trend: completion rate
  const calculateBookingsTrend = () => {
    const completedBookings = finalStats.bookingStatus['completed'] || 0;
    if (finalStats.bookings === 0) return null;
    const completionRate = (completedBookings / finalStats.bookings) * 100;
    return completionRate;
  };

  // Revenue trend: revenue per booking efficiency
  const calculateRevenueTrend = () => {
    if (finalStats.bookings === 0) return null;
    const revenuePerBooking = finalStats.revenue / finalStats.bookings;
    // Normalize: if avg booking is $100+, show as efficiency percentage
    const efficiency = Math.min((revenuePerBooking / 10), 100); // Cap at 100%
    return efficiency;
  };

  // Helper function to format trend
  const formatTrend = (trendValue: number | null) => {
    if (trendValue === null || trendValue === undefined || isNaN(trendValue)) return null;
    const isPositive = trendValue >= 50; // Above 50% is positive
    const formattedValue = `${trendValue.toFixed(1)}%`;
    return { value: formattedValue, isPositive };
  };

  // Calculate all trends
  const doctorsTrend = formatTrend(calculateDoctorsTrend());
  const patientsTrend = formatTrend(calculatePatientsTrend());
  const bookingsTrend = formatTrend(calculateBookingsTrend());
  const revenueTrend = formatTrend(calculateRevenueTrend());

  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  let greeting = 'Good Morning';
  let greetingIcon = '🌅';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Good Afternoon';
    greetingIcon = '☀️';
  } else if (currentHour >= 18) {
    greeting = 'Good Evening';
    greetingIcon = '🌙';
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={['#67A9AF']}
          tintColor="#67A9AF"
        />
      }
    >
      {/* Header Section with Gradient */}
      <LinearGradient
        colors={['#67A9AF', '#5A9BA0', '#4D8D92']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pt-6 pb-8 rounded-b-[32px]"
      >
        <View className="flex-row items-center justify-between mb-6 pt-8">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Text className="text-white/80 text-lg font-sans-medium mr-2">{greetingIcon}</Text>
              <Text className="text-white text-2xl font-sans-bold">{greeting}</Text>
            </View>
            <Text className="text-white text-3xl font-sans-bold mb-2">{user?.firstName} {user?.lastName}</Text>
            <Text className="text-white/90 font-sans-medium">Here's your ZydaCare overview</Text>
          </View>
          <TouchableOpacity className="bg-white/20 p-3 rounded-full backdrop-blur flex-row items-center gap-2" onPress={handleLogout}>
            <Ionicons name="log-out" size={20} color="white" />
            <Text className="text-white font-sans-medium">Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Bar */}
        <View className="bg-white/20 backdrop-blur rounded-2xl p-4 flex-row justify-between">
          <View className="items-center">
            <Text className="text-white text-2xl font-sans-bold">{finalStats.registrations.today}</Text>
            <Text className="text-white/80 text-xs font-sans-medium mt-1">Today</Text>
          </View>
          <View className="w-px bg-white/30" />
          <View className="items-center">
            <Text className="text-white text-2xl font-sans-bold">{finalStats.registrations.thisWeek}</Text>
            <Text className="text-white/80 text-xs font-sans-medium mt-1">This Week</Text>
          </View>
          <View className="w-px bg-white/30" />
          <View className="items-center">
            <Text className="text-white text-2xl font-sans-bold">{finalStats.monthlyActiveUsers}</Text>
            <Text className="text-white/80 text-xs font-sans-medium mt-1">Active Users</Text>
          </View>
        </View>
      </LinearGradient>

      <View className="px-6 pt-6">
        {/* Main Stats Grid */}
        <View className="mb-6">
          <Text className="text-xl font-sans-bold text-gray-800 mb-4">Overview</Text>
          <View className="gap-4">
            <StatCard
              icon={<MaterialIcons name="medical-services" size={28} color="white" />}
              value={finalStats.doctors.toString()}
              label="Total Doctors"
              gradient={['#67A9AF', '#555']}
              trend={doctorsTrend}
            />
            <StatCard
              icon={<MaterialIcons name="people" size={28} color="white" />}
              value={finalStats.patients.toString()}
              label="Total Patients"
              gradient={['#F97316', '#555']}
              trend={patientsTrend}
            />
            <StatCard
              icon={<FontAwesome5 name="calendar-check" size={24} color="white" />}
              value={finalStats.bookings.toString()}
              label="Total Bookings"
              gradient={['#6366F1', '#555']}
              trend={bookingsTrend}
            />
            <StatCard
              icon={<Ionicons name="cash-outline" size={28} color="white" />}
              value={`${finalStats.revenue.toLocaleString()}`}
              label="Total Revenue"
              gradient={['#10B981', '#555']}
              trend={revenueTrend}
            />
          </View>
        </View>

        {/* Booking Status Section */}
        <View className="mb-6 mt-5">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-xl font-sans-bold text-gray-800">Booking Analytics</Text>
              <Text className="text-gray-500 text-sm font-sans mt-1">Status breakdown</Text>
            </View>
            <TouchableOpacity className="bg-primary/10 px-4 py-2 rounded-xl" onPress={() => router.push('/(admin)/(pages)/analytics')}>
              <Text className="text-primary text-sm font-sans-bold">View All</Text>
            </TouchableOpacity>
          </View>

          {Object.keys(finalStats.bookingStatus).length > 0 ? (
            <View className="gap-3">
              {Object.entries(finalStats.bookingStatus).map(([status, count]) => {
                const colors = getStatusColor(status);
                const percentage = finalStats.bookings > 0
                  ? ((count / finalStats.bookings) * 100).toFixed(1)
                  : '0';

                return (
                  <View
                    key={status}
                    className="bg-white rounded-2xl shadow-md overflow-hidden"
                    style={{ elevation: 2 }}
                  >
                    <View className="p-4">
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-row items-center flex-1">
                          <View className={`${colors.bg} p-2.5 rounded-xl mr-3`}>
                            <Ionicons
                              name={
                                status.toLowerCase() === 'completed' ? 'checkmark-circle' :
                                  status.toLowerCase() === 'pending' ? 'time' :
                                    status.toLowerCase() === 'cancelled' ? 'close-circle' :
                                      'ellipse'
                              }
                              size={20}
                              color="white"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-800 font-sans-bold text-base capitalize">
                              {status.replace(/([A-Z])/g, ' $1').trim()}
                            </Text>
                            <Text className="text-gray-500 text-xs font-sans mt-0.5">
                              {percentage}% of total bookings
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-gray-800 font-sans-bold text-2xl">{count}</Text>
                          <Text className="text-gray-400 text-xs font-sans">bookings</Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View className="bg-gray-100 h-2 rounded-full overflow-hidden">
                        <View
                          className={`h-full ${colors.bg} rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-white rounded-2xl shadow-md p-8 items-center" style={{ elevation: 2 }}>
              <View className="bg-gray-100 p-4 rounded-full mb-4">
                <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-800 font-sans-bold text-lg mb-1">No Bookings Yet</Text>
              <Text className="text-gray-400 text-center font-sans text-sm">
                Booking data will appear here once patients start scheduling appointments
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mb-6 mt-5">
          <Text className="text-xl font-sans-bold text-gray-800 mb-4">Quick Actions</Text>
          <View className="flex-row flex-wrap gap-3">
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <TouchableOpacity className="px-10 bg-white rounded-2xl p-4 shadow-2xl items-center" style={{ elevation: 2 }} onPress={() => router.push('/(admin)/(pages)/payments')}>
                <View className="bg-primary/10 p-3 rounded-xl mb-2">
                  <MaterialIcons name="payment" size={24} color="#67A9AF" />
                </View>
                <Text className="text-gray-700 font-sans-semibold text-xs text-center">Payment</Text>
              </TouchableOpacity>
            )}
            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <TouchableOpacity className="px-10 bg-white rounded-2xl p-4 shadow-2xl items-center" style={{ elevation: 2 }} onPress={() => router.push('/(admin)/(pages)/analytics')}>
                <View className="bg-orange-500/10 p-3 rounded-xl mb-2">
                  <Ionicons name="document-text" size={24} color="#F97316" />
                </View>
                <Text className="text-gray-700 font-sans-semibold text-xs text-center">Analytics</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity className="px-10 bg-white rounded-2xl p-4 shadow-2xl items-center" style={{ elevation: 2 }} onPress={() => router.push('/(admin)/(pages)/settings')}>
              <View className="bg-indigo-500/10 p-3 rounded-xl mb-2">
                <Ionicons name="settings" size={24} color="#6366F1" />
              </View>
              <Text className="text-gray-700 font-sans-semibold text-xs text-center">Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-10 bg-white rounded-2xl p-4 shadow-2xl items-center" style={{ elevation: 2 }} onPress={() => router.push('/(admin)/(pages)/faqs')}>
              <View className="bg-gray-500/10 p-3 rounded-xl mb-2">
                <Ionicons name="help-circle" size={24} color="#333" />
              </View>
              <Text className="text-gray-700 font-sans-semibold text-xs text-center">FAQs</Text>
            </TouchableOpacity>
            <TouchableOpacity className="px-8 bg-white rounded-2xl p-4 shadow-2xl items-center" style={{ elevation: 2 }} onPress={() => router.push('/(admin)/(pages)/notifications')}>
              <View className="bg-emerald-500/10 p-3 rounded-xl mb-2">
                <Ionicons name="notifications" size={24} color="#10B981" />
              </View>
              <Text className="text-gray-700 font-sans-semibold text-xs text-center">Notifications</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View className='h-20' />
    </ScrollView>
  );
}