import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { format, subMonths, subWeeks, subDays } from 'date-fns';
import { getAllAnalytics } from '@/api/admin/analytics';
import { useToast } from '@/components/ui/Toast';
import { router } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

type TimeRange = 'day' | 'week' | 'month' | 'year';
type AnalyticsTab = 'overview' | 'users' | 'revenue' | 'appointments';

export default function AnalyticsScreen() {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>('month');
    const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
    const [analytics, setAnalytics] = useState<any>(null);
    const { showToast } = useToast();

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const data = await getAllAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            showToast('Failed to load analytics', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const renderOverviewTab = () => (
        <View className="space-y-6">
            {/* Stats Overview */}
            <View className="flex-row flex-wrap -mx-2">
                {[
                    {
                        label: 'Total Users',
                        value: analytics?.overview?.counts?.totalUsers || 0,
                        icon: 'people',
                        color: '#8B5CF6',
                        bgColor: '#F5F3FF',
                    },
                    {
                        label: 'Total Doctors',
                        value: analytics?.overview?.counts?.totalDoctors || 0,
                        icon: 'medical',
                        color: '#3B82F6',
                        bgColor: '#EFF6FF',
                    },
                    {
                        label: 'Total Bookings',
                        value: analytics?.overview?.counts?.totalBookings || 0,
                        icon: 'calendar',
                        color: '#10B981',
                        bgColor: '#ECFDF5',
                    },
                    {
                        label: 'Total Revenue',
                        value: `₦${(analytics?.overview?.counts?.totalRevenue || 0).toLocaleString()}`,
                        icon: 'cash',
                        color: '#F59E0B',
                        bgColor: '#FFFBEB',
                    },
                ].map((stat, index) => (
                    <View key={index} className="w-1/2 px-2 mb-4">
                        <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-gray-500 font-sans-medium text-sm">{stat.label}</Text>
                                    <Text className="text-2xl font-sans-bold text-gray-900 mt-1">
                                        {stat.value}
                                    </Text>
                                </View>
                                <View
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: stat.bgColor }}
                                >
                                    <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            {/* Recent Users */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-sans-bold text-gray-900">Recent Users</Text>
                    {/* <TouchableOpacity>
            <Text className="text-teal-600 font-sans-medium text-sm">View All</Text>
          </TouchableOpacity> */}
                </View>
                {analytics?.overview?.recentUsers?.map((user: any, index: number) => (
                    <TouchableOpacity
                        onPress={() => router.push(`/(admin)/(pages)/patient/${user._id}`)}
                        key={user._id || index}
                        className={`py-3 ${index < analytics.overview.recentUsers.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-full bg-teal-50 items-center justify-center">
                                    <Ionicons name="person" size={20} color="#0D9488" />
                                </View>
                                <View className="ml-3">
                                    <Text className="font-sans-medium text-gray-900">
                                        {user.firstName} {user.lastName}
                                    </Text>
                                    <Text className="text-xs text-gray-500 font-sans">
                                        {user.email}
                                    </Text>
                                </View>
                            </View>
                            <Text className="text-xs text-gray-500 font-sans">
                                {format(new Date(user.createdAt), 'MMM d')}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Recent Transactions */}
            <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mt-5">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-lg font-sans-bold text-gray-900">Recent Transactions</Text>
                    {/* <TouchableOpacity>
            <Text className="text-teal-600 font-sans-medium text-sm">View All</Text>
          </TouchableOpacity> */}
                </View>
                {analytics?.overview?.recentTransactions?.map((txn: any, index: number) => (
                    <TouchableOpacity
                        onPress={() => router.push(`/(admin)/(pages)/transactions/${txn._id}`)}
                        key={txn._id || index}
                        className={`py-3 ${index < analytics.overview.recentTransactions.length - 1 ? 'border-b border-gray-100' : ''}`}
                    >
                        <View className="flex-row justify-between items-center">
                            <View className="flex-row items-center">
                                <View
                                    className={`w-10 h-10 rounded-lg items-center justify-center ${txn.paymentStatus === 'success' ? 'bg-green-50' : 'bg-amber-50'
                                        }`}
                                >
                                    <Ionicons
                                        name={txn.paymentStatus === 'success' ? 'checkmark-circle' : 'time'}
                                        size={20}
                                        color={txn.paymentStatus === 'success' ? '#10B981' : '#F59E0B'}
                                    />
                                </View>
                                <View className="ml-3">
                                    <Text className="font-sans-medium text-gray-900">
                                        {txn.patient?.firstName} {txn.patient?.lastName}
                                    </Text>
                                    <Text className="text-xs text-gray-500 font-sans">
                                        {txn.reference} • {format(new Date(txn.createdAt), 'MMM d, h:mm a')}
                                    </Text>
                                </View>
                            </View>
                            <Text className="font-sans-bold text-gray-900">
                                ₦{txn.amount?.toLocaleString()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderUsersTab = () => {
        const userData = analytics?.users;

        // Calculate total users from distribution
        const totalUsers = userData?.userDistribution?.reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0;

        // Get current month and year
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Calculate new users this month
        const newThisMonth = userData?.userGrowth?.filter((item: any) =>
            item._id.month === currentMonth && item._id.year === currentYear
        ).reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 0;

        // Get user distribution
        const userDistribution = userData?.userDistribution || [];

        // Calculate role totals
        const doctorCount = userDistribution.find((d: any) => d._id === 'doctor')?.count || 0;
        const patientCount = userDistribution.find((d: any) => d._id === 'patient')?.count || 0;
        const adminCount = userDistribution.find((d: any) => d._id === 'super_admin')?.count || 0;

        return (
            <View className="space-y-6">
                {/* Summary Cards */}
                <View className="flex-row flex-wrap -mx-2">
                    <View className="w-1/2 px-2 mb-4">
                        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-gray-500 font-sans-medium text-sm">Total Users</Text>
                                    <Text className="text-2xl font-sans-bold text-gray-900 mt-1">
                                        {totalUsers.toLocaleString()}
                                    </Text>
                                </View>
                                <View className="p-2 rounded-lg bg-indigo-50">
                                    <Ionicons name="people" size={20} color="#4F46E5" />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="w-1/2 px-2 mb-4">
                        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-gray-500 font-sans-medium text-sm">New This Month</Text>
                                    <Text className="text-2xl font-sans-bold text-gray-900 mt-1">
                                        +{newThisMonth.toLocaleString()}
                                    </Text>
                                </View>
                                <View className="p-2 rounded-lg bg-blue-50">
                                    <Ionicons name="person-add" size={20} color="#3B82F6" />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="w-1/2 px-2 mb-4">
                        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-gray-500 font-sans-medium text-sm">Doctors</Text>
                                    <Text className="text-2xl font-sans-bold text-gray-900 mt-1">
                                        {doctorCount.toLocaleString()}
                                    </Text>
                                </View>
                                <View className="p-2 rounded-lg bg-blue-50">
                                    <Ionicons name="medical" size={20} color="#3B82F6" />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View className="w-1/2 px-2 mb-4">
                        <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Text className="text-gray-500 font-sans-medium text-sm">Patients</Text>
                                    <Text className="text-2xl font-sans-bold text-gray-900 mt-1">
                                        {patientCount.toLocaleString()}
                                    </Text>
                                </View>
                                <View className="p-2 rounded-lg bg-green-50">
                                    <Ionicons name="people" size={20} color="#10B981" />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* User Distribution */}
                <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <Text className="text-lg font-sans-bold text-gray-900 mb-4">User Distribution</Text>
                    <View className="space-y-3">
                        {userDistribution.map((item: any, index: number) => {
                            const roleName = item._id === 'super_admin' ? 'Admin' :
                                item._id === 'doctor' ? 'Doctors' : 'Patients';
                            const percentage = totalUsers > 0 ? Math.round((item.count / totalUsers) * 100) : 0;

                            return (
                                <View key={index} className=" mt-2">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-sm font-sans-medium text-gray-700">{roleName}</Text>
                                        <Text className="text-sm font-sans-medium text-gray-900">
                                            {item.count} ({percentage}%)
                                        </Text>
                                    </View>
                                    <View className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                        <View
                                            className="h-2 rounded-full"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor:
                                                    item._id === 'doctor' ? '#3B82F6' :
                                                        item._id === 'patient' ? '#10B981' : '#8B5CF6'
                                            }}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* User Growth Trend */}
                <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-5">
                    <Text className="text-lg font-sans-bold text-gray-900 mb-4">Recent Growth</Text>
                    <View className="space-y-2">
                        {userData?.userGrowth?.slice(-6).reverse().map((item: any, index: number) => {
                            const monthName = new Date(0, item._id.month - 1).toLocaleString('default', { month: 'short' });
                            return (
                                <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-50">
                                    <Text className="text-sm font-sans-medium text-gray-700">
                                        {monthName} {item._id.year}
                                    </Text>
                                    <View className="flex-row items-center">
                                        <Text className="text-xs text-gray-500 font-sans mr-2 capitalize">
                                            {item._id.role}
                                        </Text>
                                        <Text className="text-sm font-sans-bold text-gray-900">
                                            +{item.count}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        );
    };

    const renderRevenueTab = () => {
        const revenueData = analytics?.revenue;

        // Calculate total revenue
        const totalRevenue = revenueData?.revenueByStatus?.find((r: any) => r._id === 'success')?.total || 0;

        // Get this month's revenue
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const thisMonthRevenue = revenueData?.monthlyRevenue?.find(
            (r: any) => r.month === new Date(0, currentMonth - 1).toLocaleString('default', { month: 'short' }) && r.year === currentYear
        )?.total || 0;

        // Calculate average order value
        const successfulTransactions = revenueData?.revenueByStatus?.find((r: any) => r._id === 'success');
        const avgOrder = successfulTransactions ? Math.round(successfulTransactions.total / successfulTransactions.count) : 0;

        return (
            <View className="space-y-6">
                {/* Revenue Stats */}
                <View className="flex-row flex-wrap -mx-2">
                    {[
                        { label: 'Total Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: 'cash', color: '#10B981', bgColor: '#ECFDF5' },
                        { label: 'This Month', value: `₦${thisMonthRevenue.toLocaleString()}`, icon: 'calendar', color: '#3B82F6', bgColor: '#EFF6FF' },
                        { label: 'Avg. Order', value: `₦${avgOrder.toLocaleString()}`, icon: 'receipt', color: '#8B5CF6', bgColor: '#F5F3FF' },
                        { label: 'Transactions', value: successfulTransactions?.count || 0, icon: 'card', color: '#F59E0B', bgColor: '#FFFBEB' },
                    ].map((stat, index) => (
                        <View key={index} className="w-1/2 px-2 mb-4">
                            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-gray-500 font-sans-medium text-sm">{stat.label}</Text>
                                        <Text className="text-xl font-sans-bold text-gray-900 mt-1">
                                            {stat.value}
                                        </Text>
                                    </View>
                                    <View className="p-2 rounded-lg" style={{ backgroundColor: stat.bgColor }}>
                                        <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Monthly Revenue Trend */}
                <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <Text className="text-lg font-sans-bold text-gray-900 mb-4">Monthly Revenue</Text>
                    <View className="space-y-2">
                        {revenueData?.monthlyRevenue?.slice(-6).reverse().map((item: any, index: number) => (
                            <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-50">
                                <Text className="text-sm font-sans-medium text-gray-700">
                                    {item.month} {item.year}
                                </Text>
                                <View className="items-end">
                                    <Text className="text-sm font-sans-bold text-gray-900">
                                        ₦{item.total.toLocaleString()}
                                    </Text>
                                    <Text className="text-xs text-gray-500 font-sans">
                                        {item.count} transactions
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Top Performing Doctors */}
                <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-5">
                    <Text className="text-lg font-sans-bold text-gray-900 mb-4">Top Performing Doctors</Text>
                    <View className="space-y-3">
                        {revenueData?.topDoctors?.map((doctor: any, index: number) => (
                            <View key={doctor._id || index} className="flex-row justify-between items-center py-2">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-8 h-8 rounded-full bg-teal-50 items-center justify-center mr-3">
                                        <Text className="text-teal-700 font-sans-bold text-sm">{index + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-sans-medium text-gray-900">{doctor.name}</Text>
                                        <Text className="text-xs text-gray-500 font-sans">
                                            {doctor.appointmentCount} appointments • Avg: ₦{Math.round(doctor.avgRevenue).toLocaleString()}
                                        </Text>
                                    </View>
                                </View>
                                <Text className="font-sans-bold text-gray-900">
                                    ₦{doctor.totalRevenue.toLocaleString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    const renderAppointmentsTab = () => {
        const appointmentData = analytics?.appointments;

        // Get status counts
        const statusDist = appointmentData?.statusDistribution || [];
        const completedCount = statusDist.find((s: any) => s._id === 'paid')?.count || 0;
        const pendingCount = statusDist.find((s: any) => s._id === 'awaiting_payment')?.count || 0;
        const cancelledCount = statusDist.find((s: any) => s._id === 'cancelled')?.count || 0;
        const confirmedCount = statusDist.find((s: any) => s._id === 'confirmed')?.count || 0;
        const totalAppointments = statusDist.reduce((sum: number, s: any) => sum + s.count, 0);

        return (
            <View className="space-y-6">
                {/* Appointment Stats */}
                <View className="flex-row flex-wrap -mx-2">
                    {[
                        { label: 'Total', value: totalAppointments, icon: 'calendar', color: '#3B82F6', bgColor: '#EFF6FF' },
                        { label: 'Completed', value: completedCount, icon: 'checkmark-done', color: '#10B981', bgColor: '#ECFDF5' },
                        { label: 'Awaiting Payment', value: pendingCount, icon: 'time', color: '#F59E0B', bgColor: '#FFFBEB' },
                        { label: 'Cancelled', value: cancelledCount, icon: 'close-circle', color: '#EF4444', bgColor: '#FEF2F2' },
                    ].map((stat, index) => (
                        <View key={index} className="w-1/2 px-2 mb-4">
                            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="text-gray-500 font-sans-medium text-sm">{stat.label}</Text>
                                        <Text className="text-xl font-sans-bold text-gray-900 mt-1">
                                            {stat.value}
                                        </Text>
                                    </View>
                                    <View className="p-2 rounded-lg" style={{ backgroundColor: stat.bgColor }}>
                                        <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Monthly Appointments */}
                <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <Text className="text-lg font-sans-bold text-gray-900 mb-4">Monthly Appointments</Text>
                    <View className="space-y-2">
                        {appointmentData?.monthlyAppointments?.slice(-6).reverse().map((item: any, index: number) => (
                            <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-50">
                                <Text className="text-sm font-sans-medium text-gray-700">
                                    {item.month} {item.year}
                                </Text>
                                <Text className="text-sm font-sans-bold text-gray-900">
                                    {item.count} appointments
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Popular Services */}
                <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-5">
                    <Text className="text-lg font-sans-bold text-gray-900 mb-4">Popular Services</Text>
                    <View className="space-y-3">
                        {appointmentData?.popularServices?.map((service: any, index: number) => {
                            const percentage = totalAppointments > 0 ? Math.round((service.count / totalAppointments) * 100) : 0;
                            return (
                                <View key={index} className="space-y-1 mt-2">
                                    <View className="flex-row justify-between items-center">
                                        <Text className="text-sm font-sans-medium text-gray-700 capitalize">
                                            {service._id || 'Other'}
                                        </Text>
                                        <Text className="text-sm font-sans-medium text-gray-900">
                                            {service.count} ({percentage}%)
                                        </Text>
                                    </View>
                                    <View className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                        <View
                                            className="h-2 rounded-full bg-teal-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Doctor Workload */}
                <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mt-5">
                    <Text className="text-lg font-sans-bold text-gray-900 mb-4">Doctor Workload</Text>
                    <View className="space-y-3">
                        {appointmentData?.doctorWorkload?.slice(0, 5).map((doctor: any, index: number) => (
                            <View key={doctor._id || index} className="py-2">
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="font-sans-medium text-gray-900">{doctor.name}</Text>
                                    <Text className="text-sm font-sans-medium text-gray-700">
                                        {doctor.totalAppointments} total
                                    </Text>
                                </View>
                                <View className="flex-row items-center space-x-2">
                                    <View className="flex-1">
                                        <Text className="text-xs text-gray-500 font-sans mb-1">
                                            Completed: {doctor.paid}
                                        </Text>
                                        <View className="w-full bg-gray-100 rounded-full h-1.5">
                                            <View
                                                className="h-1.5 rounded-full bg-green-500"
                                                style={{
                                                    width: `${doctor.totalAppointments > 0 ? (doctor.paid / doctor.totalAppointments) * 100 : 0}%`
                                                }}
                                            />
                                        </View>
                                    </View>
                                    <View className="flex-1 ml-2">
                                        <Text className="text-xs text-gray-500 font-sans mb-1">
                                            Cancelled: {doctor.cancelled}
                                        </Text>
                                        <View className="w-full bg-gray-100 rounded-full h-1.5">
                                            <View
                                                className="h-1.5 rounded-full bg-red-500"
                                                style={{
                                                    width: `${doctor.totalAppointments > 0 ? (doctor.cancelled / doctor.totalAppointments) * 100 : 0}%`
                                                }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#67A9AF" />
                <Text className="mt-4 text-gray-600 font-sans-medium">Loading analytics...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <View className="px-6 pt-2 pb-4">
                    <View className="mb-6 flex-row items-center gap-2">
                        {/* <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="black" />
                        </TouchableOpacity> */}
                        <View>
                            <Text className="text-2xl font-sans-bold text-gray-900">Analytics Dashboard</Text>
                            <Text className="text-gray-500 font-sans">Overview of your platform's performance</Text>
                        </View>
                    </View>

                    {/* Time Range Selector */}
                    {/* <View className="flex-row bg-white rounded-xl p-1 border border-gray-200 mb-6">
            {['day', 'week', 'month', 'year'].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setTimeRange(item as TimeRange)}
                className={`flex-1 py-2 rounded-lg ${timeRange === item ? 'bg-teal-50' : ''}`}
              >
                <Text
                  className={`text-sm font-sans-medium text-center ${
                    timeRange === item ? 'text-teal-700' : 'text-gray-500'
                  }`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View> */}

                    {/* Tabs */}
                    <View className="flex-row bg-white rounded-xl p-1 border border-gray-200 mb-6">
                        {[
                            { id: 'overview', icon: 'grid' },
                            { id: 'users', icon: 'people' },
                            { id: 'revenue', icon: 'cash' },
                            { id: 'appointments', icon: 'calendar' },
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.id}
                                onPress={() => setActiveTab(tab.id as AnalyticsTab)}
                                className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab.id ? 'bg-teal-50' : ''
                                    }`}
                            >
                                <Ionicons
                                    name={tab.icon as any}
                                    size={20}
                                    color={activeTab === tab.id ? '#0D9488' : '#6B7280'}
                                />
                                <Text
                                    className={`text-xs font-sans-medium mt-1 ${activeTab === tab.id ? 'text-teal-800' : 'text-gray-500'
                                        }`}
                                >
                                    {tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Tab Content */}
                    <View className="mb-6">
                        {activeTab === 'overview' && renderOverviewTab()}
                        {activeTab === 'users' && renderUsersTab()}
                        {activeTab === 'revenue' && renderRevenueTab()}
                        {activeTab === 'appointments' && renderAppointmentsTab()}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}