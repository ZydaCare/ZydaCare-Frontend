import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { getTransaction } from '@/api/admin/payments';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';

type TransactionStatus = 'success' | 'pending' | 'failed';

interface TransactionDetailsProps {
    _id: string;
    amount: number;
    paymentStatus: string;
    reference: string;
    zydaCareCut: number;
    doctorEarning: number;
    splitType: string;
    createdAt: string;
    updatedAt: string;
    booking: {
        _id: string;
        appointmentDate: string;
        status: string;
        doctor: {
            _id: string;
            fullName: string;
            profile: {
                title: string;
                profileImage?: {
                    url: string;
                };
                specialties?: string[];
            };
        };
        patient: {
            _id: string;
            firstName: string;
            lastName: string;
            email: string;
            phone: string;
            profileImage?: {
                url: string;
                public_url: string;
            };
        };
    };
}

export default function TransactionDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [transaction, setTransaction] = useState<TransactionDetailsProps | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const router = useRouter();

    const fetchTransaction = async () => {
        try {
            setLoading(true);
            const data = await getTransaction(id as string);
            if (data) {
                setTransaction(data);
            } else {
                showToast('Transaction not found', 'error');
                router.back();
            }
        } catch (error) {
            console.error('Error fetching transaction:', error);
            showToast('Failed to load transaction details', 'error');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchTransaction();
        }
    }, [id]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success':
                return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
            case 'pending':
                return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
            case 'failed':
                return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
            default:
                return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };
        }
    };

    if (loading || !transaction) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#67A9AF" />
            </SafeAreaView>
        );
    }

    const statusStyle = getStatusColor(transaction.paymentStatus);
    const appointmentDate = new Date(transaction.booking.appointmentDate);
    const formattedDate = format(appointmentDate, 'MMMM d, yyyy');
    const formattedTime = format(appointmentDate, 'h:mm a');
    const transactionDate = format(new Date(transaction.createdAt), 'MMMM d, yyyy h:mm a');

    return (
        <View className="flex-1 bg-white">
            <ScrollView className="flex-1">
                {/* Header with Gradient */}
                <View className="bg-primary py-4 px-6 pt-10">
                    <View className="flex-row items-center justify-between mb-2">
                        <TouchableOpacity onPress={() => router.back()} className="p-1">
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-xl font-sans-bold text-white">Transaction Details</Text>
                        <View className="w-8" />
                    </View>

                    <View className="items-center py-4">
                        <Text className="text-3xl font-sans-bold text-white">
                            ₦{transaction.amount?.toLocaleString()}
                        </Text>
                        <View className={`px-4 py-1 rounded-full ${statusStyle.bg} mt-2`}>
                            <Text className={`${statusStyle.text} font-sans-medium capitalize`}>
                                {transaction.paymentStatus}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="px-6 pt-4">

                    {/* Transaction Info Card */}
                    <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
                        <Text className="text-lg font-sans-bold text-gray-900 mb-4">Transaction Information</Text>

                        <View className="space-y-4">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3">
                                    <MaterialIcons name="receipt" size={20} color="#67A9AF" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 font-sans-medium text-sm">Reference</Text>
                                    <Text className="text-gray-900 font-sans-medium">{transaction.reference}</Text>
                                </View>
                            </View>

                            <View className="h-px bg-gray-100 mt-2" />

                            <View className="flex-row items-center mt-4">
                                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3">
                                    <MaterialIcons name="calendar-today" size={18} color="#67A9AF" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 font-sans-medium text-sm">Transaction Date</Text>
                                    <Text className="text-gray-900 font-sans-medium">{transactionDate}</Text>
                                </View>
                            </View>

                            <View className="h-px bg-gray-100 mt-2" />

                            <View className="flex-row items-center mt-4">
                                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3">
                                    <MaterialIcons name="account-balance-wallet" size={18} color="#67A9AF" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 font-sans-medium text-sm">Split Type</Text>
                                    <Text className="text-gray-900 font-sans-medium capitalize">
                                        {transaction.splitType}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Appointment Details */}
                    <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
                        <Text className="text-lg font-sans-bold text-gray-900 mb-4">Appointment Details</Text>

                        <View className="space-y-4">
                            <View className="flex-row items-center">
                                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3">
                                    <MaterialIcons name="event-available" size={20} color="#67A9AF" />
                                </View>
                                <View>
                                    <Text className="text-gray-500 font-sans-medium text-sm">Date & Time</Text>
                                    <Text className="text-gray-900 font-sans-medium">
                                        {formattedDate} at {formattedTime}
                                    </Text>
                                </View>
                            </View>

                            <View className="h-px bg-gray-100 mt-2" />

                            <View className="flex-row items-start mt-4">
                                {!transaction.booking.patient?.profileImage?.url ? (
                                    <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3 mt-1">
                                        <Ionicons name="person" size={18} color="#67A9AF" />
                                    </View>
                                ) : (
                                    <Image
                                        source={{ uri: transaction.booking.patient?.profileImage?.url }}
                                        className="w-10 h-10 rounded-lg mr-3 mt-1"
                                    />
                                )}
                                <View className="flex-1">
                                    <Text className="text-gray-500 font-sans-medium text-sm">Patient</Text>
                                    <Text className="text-gray-900 font-sans-medium">
                                        {transaction.booking.patient.firstName} {transaction.booking.patient.lastName}
                                    </Text>
                                    <View className="flex-row items-center mt-1">
                                        <Ionicons name="mail-outline" size={14} color="#6B7280" />
                                        <Text className="text-gray-600 text-sm font-sans ml-2">
                                            {transaction.booking.patient.email}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(`tel:${transaction.booking.patient.phone}`)}
                                        className="flex-row items-center mt-1"
                                    >
                                        <Ionicons name="call-outline" size={14} color="#6B7280" />
                                        <Text className="text-gray-600 text-sm font-sans ml-2">
                                            {transaction.booking.patient.phone}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View className="h-px bg-gray-100 mt-2" />

                            <View className="flex-row items-start mt-4">
                                {!transaction.booking.doctor?.profile?.profileImage?.url ? (
                                    <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3 mt-1">
                                        <Ionicons name="medical" size={18} color="#67A9AF" />
                                    </View>
                                ) : (
                                    <Image
                                        source={{ uri: transaction.booking.doctor?.profile?.profileImage?.url }}
                                        className="w-10 h-10 rounded-lg mr-3 mt-1"
                                    />
                                )}
                                <View className="flex-1">
                                    <Text className="text-gray-500 font-sans-medium text-sm">Doctor</Text>
                                    <Text className="text-gray-900 font-sans-medium">
                                        {transaction.booking.doctor.profile.title} {transaction.booking.doctor.fullName}
                                    </Text>
                                    {transaction.booking.doctor.profile.specialties && (
                                        <View className="flex-row flex-wrap mt-1">
                                            {transaction.booking.doctor.profile.specialties.map((specialty: string, index: number) => (
                                                <View key={index} className="bg-primary/5 px-2 py-1 rounded-full mr-2 mb-1">
                                                    <Text className="text-primary text-xs font-sans">{specialty}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Payment Breakdown */}
                    <View className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
                        <Text className="text-lg font-sans-bold text-gray-900 mb-4">Payment Breakdown</Text>

                        <View className="space-y-4">
                            <View className="flex-row justify-between items-center">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
                                        <MaterialIcons name="receipt" size={16} color="#67A9AF" />
                                    </View>
                                    <Text className="text-gray-600 font-sans">Appointment Fee</Text>
                                </View>
                                <Text className="text-gray-900 font-sans-medium">
                                    ₦{transaction.amount?.toLocaleString()}
                                </Text>
                            </View>

                            <View className="h-px bg-gray-100 mt-2" />

                            <View className="flex-row justify-between items-center mt-4">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
                                        <MaterialIcons name="account-balance" size={16} color="#67A9AF" />
                                    </View>
                                    <View>
                                        <Text className="text-gray-600 font-sans">ZydaCare Fee</Text>
                                        <Text className="text-gray-400 text-xs font-sans">15% service charge</Text>
                                    </View>
                                </View>
                                <Text className="text-gray-900 font-sans-medium">
                                    ₦{transaction.zydaCareCut?.toLocaleString()}
                                </Text>
                            </View>

                            <View className="h-px bg-gray-100 mt-2" />

                            <View className="flex-row justify-between items-center mt-4">
                                <View className="flex-row items-center">
                                    <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
                                        <MaterialIcons name="account-balance-wallet" size={16} color="#67A9AF" />
                                    </View>
                                    <Text className="text-gray-600 font-sans">Doctor's Earning</Text>
                                </View>
                                <Text className="text-primary font-sans-bold text-lg">
                                    ₦{transaction.doctorEarning?.toLocaleString()}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Actions */}
                    <View className="flex-row gap-4 mb-8">
                        <TouchableOpacity
                            className="flex-1 bg-white border border-primary/20 rounded-xl py-3 items-center flex-row justify-center"
                            onPress={() => {
                                // Handle download receipt
                                showToast('Downloading receipt...', 'success');
                            }}
                        >
                            <Ionicons name="download-outline" size={20} color="#67A9AF" />
                            <Text className="text-primary font-sans-medium ml-2">Download</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 bg-primary rounded-xl py-3 items-center flex-row justify-center"
                            onPress={() => {
                                // Handle share
                                showToast('Sharing transaction...', 'success');
                            }}
                        >
                            <Ionicons name="share-social-outline" size={20} color="white" />
                            <Text className="text-white font-sans-medium ml-2">Share</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom padding for better scrolling */}
            <View className="h-6" />
        </View>
    );
}
