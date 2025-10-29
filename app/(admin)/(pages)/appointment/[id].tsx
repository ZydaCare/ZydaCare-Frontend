import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { getAppointment, cancelAppointment, completeAppointment } from '@/api/admin/appointments';
import { useToast } from '@/components/ui/Toast';
import { LinearGradient } from 'expo-linear-gradient';

type StatusType = 'pending' | 'cancelled' | 'accepted' | 'paid' | 'awaiting_payment';

export default function AppointmentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [appointment, setAppointment] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();

    const fetchAppointment = async () => {
        try {
            setIsLoading(true);
            const response = await getAppointment(id!);
            if (response.success && response.data) {
                setAppointment(response.data);
            } else {
                showToast('Failed to load appointment details', 'error');
                router.back();
            }
        } catch (error) {
            console.error('Error fetching appointment:', error);
            showToast('Error loading appointment', 'error');
            router.back();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchAppointment();
        }
    }, [id]);

    const handleCancelAppointment = async () => {
        try {
            setIsProcessing(true);
            await cancelAppointment(id!);
            showToast('Appointment cancelled successfully', 'success');
            fetchAppointment();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            showToast('Failed to cancel appointment', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCompleteAppointment = async () => {
        try {
            setIsProcessing(true);
            await completeAppointment(id!);
            showToast('Appointment marked as completed', 'success');
            fetchAppointment();
        } catch (error) {
            console.error('Error completing appointment:', error);
            showToast('Failed to complete appointment', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusConfig = (status: StatusType) => {
        switch (status) {
            case 'pending':
                return {
                    gradient: ['#F59E0B', '#D97706'],
                    icon: 'time',
                    bg: 'bg-amber-500'
                };
            case 'accepted':
                return {
                    gradient: ['#3B82F6', '#2563EB'],
                    icon: 'checkmark-done-circle',
                    bg: 'bg-blue-500'
                };
            case 'awaiting_payment':
                return {
                    gradient: ['#67A9AF', '#67A9AF'],
                    icon: 'checkmark-done-circle',
                    bg: 'bg-blue-500'
                };
            case 'paid':
                return {
                    gradient: ['#10B981', '#059669'],
                    icon: 'checkmark-circle',
                    bg: 'bg-emerald-500'
                };
            case 'cancelled':
                return {
                    gradient: ['#EF4444', '#DC2626'],
                    icon: 'close-circle',
                    bg: 'bg-rose-500'
                };
            default:
                return {
                    gradient: ['#6B7280', '#4B5563'],
                    icon: 'ellipse',
                    bg: 'bg-gray-500'
                };
        }
    };

    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'EEEE, MMMM d, yyyy');
        } catch (error) {
            return dateString;
        }
    };

    const formatCurrency = (amount: number) => {
        return `₦${amount.toLocaleString()}`;
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
                <ActivityIndicator size="large" color="#67A9AF" />
                <Text className="text-gray-600 font-sans-medium mt-4">Loading appointment details...</Text>
            </SafeAreaView>
        );
    }

    if (!appointment) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
                <View className="bg-red-50 p-8 rounded-3xl">
                    <Ionicons name="alert-circle" size={64} color="#EF4444" />
                    <Text className="text-gray-800 font-sans-bold text-lg mt-4">Appointment not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    const statusConfig = getStatusConfig(appointment.status);

    return (
        <View className="flex-1 bg-slate-50" edges={['top']}>
            {/* Clean Professional Header */}
            <LinearGradient
                colors={['#67A9AF', '#5A9BA0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="pt-4 pb-8"
            >
                <View className="px-6 pt-6 pb-4">
                    {/* Navigation */}
                    <View className="flex-row items-center justify-start mb-4">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="p-2 -ml-2"
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>

                        <Text className="text-white text-xl font-sans-bold ml-5">Appointment Details</Text>
                    </View>

                    {/* Key Info Row */}
                    <View className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-5 py-4">
                        <View className="flex-row items-center flex-1">
                            <View className="bg-primary/10 p-3 rounded-xl mr-3">
                                <Ionicons
                                    name={appointment.appointmentType === 'virtual' ? 'videocam' : 'home'}
                                    size={24}
                                    color="#67A9AF"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-gray-900 font-sans-bold text-base">
                                    {appointment.appointmentType === 'virtual' ? 'Virtual Consultation' : 'Home Visit'}
                                </Text>
                                <Text className="text-gray-500 font-sans text-sm mt-0.5">
                                    {format(parseISO(appointment.appointmentDate), 'MMM d, yyyy • h:mm a')}
                                </Text>
                            </View>
                        </View>

                        <View className="items-end ml-3">
                            <LinearGradient
                                colors={statusConfig.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                className="px-4 py-2"
                                style={{ borderRadius: 100 }}
                            >
                                <Text className="text-white text-xs font-sans-bold uppercase">
                                    {appointment.status.replace('_', ' ')}
                                </Text>
                            </LinearGradient>
                            <Text className="text-gray-400 text-xs font-sans mt-1.5">
                                #{appointment.reference || appointment._id?.substring(0, 8).toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                className="flex-1 pt-8"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Patient & Doctor Cards */}
                <View className="px-6 mb-6">
                    {/* Patient Card */}
                    <View className="bg-white rounded-3xl shadow-lg mb-4 overflow-hidden" style={{ elevation: 4 }}>
                        <LinearGradient
                            colors={['#F97316', '#EA580C']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="px-5 py-4"
                        >
                            <Text className="text-white font-sans-bold text-sm ">PATIENT INFORMATION</Text>
                        </LinearGradient>
                        <View className="p-5">
                            <View className="flex-row items-center mb-4">
                                {appointment.patient?.profileImage?.url ? (
                                    <Image
                                        source={{ uri: appointment.patient.profileImage.url }}
                                        className="w-16 h-16 rounded-2xl"
                                    />
                                ) : (
                                    <View className="w-16 h-16 rounded-2xl bg-orange-100 items-center justify-center">
                                        <Ionicons name="person" size={32} color="#F97316" />
                                    </View>
                                )}
                                <View className="ml-4 flex-1">
                                    <Text className="font-sans-bold text-gray-900 text-lg">
                                        {appointment.patientInfo?.fullName || `${appointment.patient?.firstName} ${appointment.patient?.lastName}`}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                        <View className="bg-orange-100 px-3 py-1 rounded-full">
                                            <Text className="text-orange-700 text-xs font-sans-bold">
                                                {appointment.patientInfo?.age} yrs • {appointment.patientInfo?.gender}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View className="space-y-3 border-t border-gray-100 pt-4">
                                <View className="flex-row items-center">
                                    <View className="bg-orange-50 p-2 rounded-lg mr-3">
                                        <Ionicons name="mail" size={16} color="#F97316" />
                                    </View>
                                    <Text className="text-gray-700 font-sans flex-1">
                                        {appointment.patientInfo?.contact?.email || appointment.patient?.email}
                                    </Text>
                                </View>
                                <View className="flex-row items-center mt-3">
                                    <View className="bg-orange-50 p-2 rounded-lg mr-3">
                                        <Ionicons name="call" size={16} color="#F97316" />
                                    </View>
                                    <Text className="text-gray-700 font-sans flex-1">
                                        {appointment.patientInfo?.contact?.phone || appointment.patient?.phone}
                                    </Text>
                                </View>
                                <View className="flex-row items-center mt-3">
                                    <View className="bg-orange-50 p-2 rounded-lg mr-3">
                                        <Ionicons name="calendar" size={16} color="#F97316" />
                                    </View>
                                    <Text className="text-gray-700 font-sans flex-1">
                                        Born: {format(parseISO(appointment.patientInfo?.dateOfBirth), 'MMM d, yyyy')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Doctor Card */}
                    <View className="bg-white rounded-3xl shadow-lg overflow-hidden" style={{ elevation: 4 }}>
                        <LinearGradient
                            colors={['#67A9AF', '#5A9BA0']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="px-5 py-4"
                        >
                            <Text className="text-white font-sans-bold text-sm">DOCTOR INFORMATION</Text>
                        </LinearGradient>
                        <View className="p-5">
                            <View className="flex-row items-center mb-4">
                                {appointment.doctor?.profile?.profileImage?.url ? (
                                    <Image
                                        source={{ uri: appointment.doctor.profile.profileImage.url }}
                                        className="w-16 h-16 rounded-2xl"
                                    />
                                ) : (
                                    <View className="w-16 h-16 rounded-2xl bg-teal-100 items-center justify-center">
                                        <Ionicons name="medical" size={32} color="#67A9AF" />
                                    </View>
                                )}
                                <View className="ml-4 flex-1">
                                    <Text className="font-sans-bold text-gray-900 text-lg">
                                        {appointment.doctor?.profile?.title} {appointment.doctor?.fullName}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                        <View className="bg-teal-100 px-3 py-1 rounded-full">
                                            <Text className="text-teal-700 text-xs font-sans-bold">
                                                {appointment.doctor?.speciality || appointment.doctor?.profile?.specialties?.[0]}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View className="space-y-3 border-t border-gray-100 pt-4">
                                <View className="flex-row items-center">
                                    <View className="bg-teal-50 p-2 rounded-lg mr-3">
                                        <Ionicons name="mail" size={16} color="#67A9AF" />
                                    </View>
                                    <Text className="text-gray-700 font-sans flex-1">{appointment.doctor?.email}</Text>
                                </View>
                                {appointment.doctor?.profile?.professionalSummary && (
                                    <View className="flex-row items-start mt-3">
                                        <View className="bg-teal-50 p-2 rounded-lg mr-3 mt-1">
                                            <Ionicons name="information-circle" size={16} color="#67A9AF" />
                                        </View>
                                        <Text className="text-gray-600 font-sans text-sm flex-1">
                                            {appointment.doctor.profile.professionalSummary}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Appointment Timeline */}
                <View className="px-6 mb-6">
                    <Text className="text-xl font-sans-bold text-gray-800 mb-4">Appointment Schedule</Text>
                    <View className="bg-white rounded-3xl shadow-lg p-6" style={{ elevation: 4 }}>
                        <View className="flex-row items-center justify-between">
                            <View className="items-center flex-1">
                                <View className="bg-indigo-100 p-4 rounded-2xl mb-3">
                                    <Ionicons name="calendar-outline" size={28} color="#6366F1" />
                                </View>
                                <Text className="text-gray-500 text-xs font-sans-medium mb-1">Date</Text>
                                <Text className="text-gray-900 font-sans-bold text-center">
                                    {format(parseISO(appointment.appointmentDate), 'MMM d, yyyy')}
                                </Text>
                            </View>

                            <View className="h-12 w-px bg-gray-200" />

                            <View className="items-center flex-1">
                                <View className="bg-purple-100 p-4 rounded-2xl mb-3">
                                    <Ionicons name="time-outline" size={28} color="#8B5CF6" />
                                </View>
                                <Text className="text-gray-500 text-xs font-sans-medium mb-1">Time</Text>
                                <Text className="text-gray-900 font-sans-bold">
                                    {format(parseISO(appointment.appointmentDate), 'h:mm a')}
                                </Text>
                            </View>

                            <View className="h-12 w-px bg-gray-200" />

                            <View className="items-center flex-1">
                                <View className="bg-emerald-100 p-4 rounded-2xl mb-3">
                                    <Ionicons
                                        name={appointment.appointmentType === 'virtual' ? 'videocam' : 'home'}
                                        size={28}
                                        color="#10B981"
                                    />
                                </View>
                                <Text className="text-gray-500 text-xs font-sans-medium mb-1">Type</Text>
                                <Text className="text-gray-900 font-sans-bold capitalize text-center">
                                    {appointment.appointmentType}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Medical Context */}
                <View className="px-6 mb-6">
                    <Text className="text-xl font-sans-bold text-gray-800 mb-4">Medical Information</Text>
                    <View className="bg-white rounded-3xl shadow-lg overflow-hidden" style={{ elevation: 4 }}>
                        {[
                            { label: 'Reason for Visit', value: appointment.medicalContext?.reasonForAppointment, icon: 'document-text' },
                            { label: 'Current Symptoms', value: appointment.medicalContext?.currentSymptoms, icon: 'fitness' },
                            { label: 'Medical History', value: appointment.medicalContext?.medicalHistory, icon: 'medical' },
                            { label: 'Current Medications', value: appointment.medicalContext?.currentMedications, icon: 'medkit' },
                            { label: 'Allergies', value: appointment.medicalContext?.allergies, icon: 'warning' },
                        ].map((item, index) => (
                            <View
                                key={index}
                                className={`p-5 ${index !== 4 ? 'border-b border-gray-100' : ''}`}
                            >
                                <View className="flex-row items-start">
                                    <View className="bg-gray-100 p-2.5 rounded-xl mr-3">
                                        <Ionicons name={item.icon as any} size={20} color="#6B7280" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-500 font-sans-medium text-sm mb-2">{item.label}</Text>
                                        <Text className="text-gray-900 font-sans-medium">
                                            {item.value || 'Not specified'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Payment Breakdown */}
                <View className="px-6 mb-6">
                    <Text className="text-xl font-sans-bold text-gray-800 mb-4">Payment Summary</Text>
                    <View className="bg-white rounded-3xl shadow-lg overflow-hidden" style={{ elevation: 4 }}>
                        <LinearGradient
                            colors={['#10B981', '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            className="p-5"
                        >
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-white/80 text-sm font-sans-medium mb-1">Total Amount</Text>
                                    <Text className="text-white text-3xl font-sans-bold">{formatCurrency(appointment.amount)}</Text>
                                </View>
                                <View className={`px-4 py-2 rounded-xl ${appointment.paymentStatus === 'success' ? 'bg-white/20' :
                                    appointment.paymentStatus === 'pending' ? 'bg-yellow-500/30' : 'bg-red-500/30'
                                    }`}>
                                    <Text className="text-white text-xs font-sans-bold uppercase">
                                        {appointment.paymentStatus}
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>

                        <View className="p-5">
                            <View className="space-y-4">
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <View className="bg-emerald-50 p-2 rounded-lg mr-3">
                                            <Ionicons name="cash" size={16} color="#10B981" />
                                        </View>
                                        <Text className="text-gray-700 font-sans-medium">Consultation Fee</Text>
                                    </View>
                                    <Text className="text-gray-900 font-sans-bold text-lg">{formatCurrency(appointment.amount)}</Text>
                                </View>

                                <View className="h-px bg-gray-200 mt-3" />

                                <View className="flex-row justify-between items-center mt-3">
                                    <View className="flex-row items-center">
                                        <View className="bg-blue-50 p-2 rounded-lg mr-3">
                                            <Ionicons name="business" size={16} color="#3B82F6" />
                                        </View>
                                        <Text className="text-gray-700 font-sans-medium">Platform Fee</Text>
                                    </View>
                                    <Text className="text-gray-900 font-sans-bold text-lg">{formatCurrency(appointment.zydaCareCut || 0)}</Text>
                                </View>

                                <View className="flex-row justify-between items-center mt-3">
                                    <View className="flex-row items-center">
                                        <View className="bg-teal-50 p-2 rounded-lg mr-3">
                                            <Ionicons name="medical" size={16} color="#67A9AF" />
                                        </View>
                                        <Text className="text-gray-700 font-sans-medium">Doctor's Earning</Text>
                                    </View>
                                    <Text className="text-gray-900 font-sans-bold text-lg">{formatCurrency(appointment.doctorEarning || 0)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Action Buttons */}
            {appointment.status !== 'cancelled' || appointment.status === 'paid'  && (
                <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
                    <View className="flex-row gap-3">
                        <TouchableOpacity
                            className="flex-1 bg-primary rounded-2xl py-4 items-center justify-center shadow-lg"
                            onPress={handleCancelAppointment}
                            disabled={isProcessing}
                            // style={{ elevation: 4 }}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <View className="flex-row items-center">
                                    <Ionicons name="close-circle" size={20} color="white" />
                                    <Text className="text-white font-sans-bold ml-2">Cancel</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {appointment.status === 'accepted' && (
                            <TouchableOpacity
                                className="flex-1 bg-primary rounded-2xl py-4 items-center justify-center shadow-lg"
                                onPress={handleCompleteAppointment}
                                disabled={isProcessing}
                                // style={{ elevation: 4 }}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <View className="flex-row items-center">
                                        <Ionicons name="checkmark-circle" size={20} color="white" />
                                        <Text className="text-white font-sans-bold ml-2">Complete</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}