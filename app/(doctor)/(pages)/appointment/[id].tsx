import { Appointment, completeAppointment, getAppointment } from '@/api/doctor/appointments';
import { useToast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      fetchAppointmentDetails();
    }
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await getAppointment(id as string);
      if (response.success) {
        setAppointment(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      showToast('Failed to load appointment details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAppointment = async () => {
    setShowCompleteModal(true);
  };

  const confirmCompleteAppointment = async () => {
    try {
      setCompleting(true);
      await completeAppointment(id as string);
      showToast('Appointment marked as completed', 'success');
      fetchAppointmentDetails();
    } catch (error) {
      showToast('Failed to complete appointment', 'error');
    } finally {
      setCompleting(false);
      setShowCompleteModal(false);
    }
  };

  const cancelCompleteAppointment = () => {
    setShowCompleteModal(false);
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-[#10B981]';
      case 'pending':
        return 'bg-[#F59E0B]';
      case 'awaiting_payment':
        return 'bg-[#3B82F6]';
      case 'cancelled':
        return 'bg-[#EF4444]';
      default:
        return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#67A9AF" />
          <Text className="text-gray-500 font-sans mt-4">Loading details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-lg font-sans-bold text-gray-900 mt-4">
            Appointment not found
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-[#67A9AF] px-6 py-3 rounded-xl mt-4"
          >
            <Text className="text-white font-sans-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const appointmentDate = parseISO(appointment.appointmentDate);
  const dateString = format(appointmentDate, 'EEEE, MMMM dd, yyyy');
  const timeString = format(appointmentDate, 'h:mm a');
  const dobString = format(appointment.patientInfo.dateOfBirth, 'MMMM dd, yyyy');

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-6">
      <View className="bg-white px-6 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-gray-900 flex-1">
          Appointment Details
        </Text>
        <View className={`px-3 py-1 rounded-full ${getStatusBgColor(appointment.status)}`}>
          <Text className="text-xs font-sans-medium text-white capitalize">
            {appointment.status}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Patient Info Card */}
        <View className="bg-white m-6 rounded-2xl p-4 shadow-sm" style={{ elevation: 2 }}>
          <Text className="text-sm font-sans-bold text-gray-500 uppercase mb-3">
            Patient Information
          </Text>

          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() =>
              router.push({
                pathname: '/(doctor)/(pages)/patient/[id]',
                params: { id: appointment.patient._id },
              })
            }
          >
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
              {appointment.patient.profileImage?.url ? (
                <Image
                  source={{ uri: appointment.patient.profileImage.url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="person" size={32} color="#9CA3AF" />
              )}
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-sans-bold text-gray-900">
                {appointment.patientInfo.fullName}
              </Text>
              <Text className="text-sm font-sans text-gray-500 mt-1">
                Age: {appointment.patientInfo.age} years
                {appointment.patientInfo?.gender && ` • ${appointment.patientInfo.gender}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="space-y-2">
            <View className="flex-row items-center py-2">
              <Ionicons name="call-outline" size={18} color="#67A9AF" />
              <Text className="text-sm font-sans text-gray-700 ml-3">
                {appointment.patientInfo.contact.phone}
              </Text>
            </View>
            <View className="flex-row items-center py-2">
              <Ionicons name="mail-outline" size={18} color="#67A9AF" />
              <Text className="text-sm font-sans text-gray-700 ml-3">
                {appointment.patientInfo.contact.email}
              </Text>
            </View>
            <View className="flex-row items-center py-2">
              <Ionicons name="calendar-outline" size={18} color="#67A9AF" />
              <Text className="text-sm font-sans text-gray-700 ml-3">
                {dobString}
              </Text>
            </View>
          </View>
        </View>

        {/* Appointment Details Card */}
        <View className="bg-white mx-6 mb-6 rounded-2xl p-4 shadow-sm" style={{ elevation: 2 }}>
          <Text className="text-sm font-sans-bold text-gray-500 uppercase mb-3">
            Appointment Details
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-start py-2">
              <Ionicons name="calendar-outline" size={18} color="#67A9AF" />
              <View className="flex-1 ml-3">
                <Text className="text-xs font-sans-medium text-gray-500">Date & Time</Text>
                <Text className="text-sm font-sans-medium text-gray-900 mt-1">
                  {dateString}
                </Text>
                <Text className="text-sm font-sans text-gray-700">{timeString}</Text>
              </View>
            </View>

            <View className="flex-row items-start py-2">
              <Ionicons
                name={
                  appointment.appointmentType === 'virtual'
                    ? 'videocam-outline'
                    : appointment.appointmentType === 'home-visit'
                      ? 'home-outline'
                      : 'medkit-outline'
                }
                size={18}
                color="#67A9AF"
              />
              <View className="flex-1 ml-3">
                <Text className="text-xs font-sans-medium text-gray-500">Type</Text>
                <Text className="text-sm font-sans-medium text-gray-900 mt-1 capitalize">
                  {appointment.appointmentType.replace('-', ' ')}
                </Text>
              </View>
            </View>

            <View className="flex-row items-start py-2">
              <Ionicons name="cash-outline" size={18} color="#67A9AF" />
              <View className="flex-1 ml-3">
                <Text className="text-xs font-sans-medium text-gray-500">Fee</Text>
                <Text className="text-sm font-sans-bold text-gray-900 mt-1">
                  ₦{appointment.amount.toLocaleString()}
                </Text>
                <Text className="text-xs font-sans text-gray-500 mt-1">
                  Payment: {appointment.paymentStatus}
                  {appointment.reference && ` • Ref: ${appointment.reference}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Medical Context Card */}
        <View className="bg-white mx-6 mb-6 rounded-2xl p-4 shadow-sm" style={{ elevation: 2 }}>
          <Text className="text-sm font-sans-bold text-gray-500 uppercase mb-3">
            Medical Information
          </Text>

          <View className="space-y-4">
            {appointment.medicalContext.reasonForAppointment && (
              <View>
                <Text className="text-xs font-sans-bold text-gray-500 uppercase mb-1">
                  Reason for Visit
                </Text>
                <Text className="text-sm font-sans text-gray-900">
                  {appointment.medicalContext.reasonForAppointment}
                </Text>
              </View>
            )}

            {appointment.medicalContext.currentSymptoms && (
              <View>
                <Text className="text-xs font-sans-bold text-gray-500 uppercase mb-1">
                  Current Symptoms
                </Text>
                <Text className="text-sm font-sans text-gray-900">
                  {appointment.medicalContext.currentSymptoms}
                </Text>
              </View>
            )}

            {appointment.medicalContext.medicalHistory && (
              <View>
                <Text className="text-xs font-sans-bold text-gray-500 uppercase mb-1">
                  Medical History
                </Text>
                <Text className="text-sm font-sans text-gray-900">
                  {appointment.medicalContext.medicalHistory}
                </Text>
              </View>
            )}

            {appointment.medicalContext.currentMedications && (
              <View>
                <Text className="text-xs font-sans-bold text-gray-500 uppercase mb-1">
                  Current Medications
                </Text>
                <Text className="text-sm font-sans text-gray-900">
                  {appointment.medicalContext.currentMedications}
                </Text>
              </View>
            )}

            {appointment.medicalContext.allergies && (
              <View>
                <Text className="text-xs font-sans-bold text-gray-500 uppercase mb-1">
                  Allergies
                </Text>
                <Text className="text-sm font-sans text-gray-900">
                  {appointment.medicalContext.allergies}
                </Text>
              </View>
            )}

            {appointment.medicalContext.emergencyRedFlags && (
              <View className="bg-red-50 p-3 rounded-xl">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={18} color="#EF4444" />
                  <Text className="text-sm font-sans-bold text-red-600 ml-2">
                    Emergency Red Flags Present
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mx-6 mb-8">
          {appointment.status === 'pending' && (
            <TouchableOpacity
              className="bg-[#67A9AF] py-4 rounded-xl items-center flex-row justify-center"
              onPress={handleCompleteAppointment}
              disabled={completing}
            >
              {completing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white font-sans-bold text-base ml-2">
                    Complete Appointment
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {appointment.status === 'awaiting_payment' || appointment.status === 'pending' && (
            appointment.appointmentType === 'virtual' && (
              <TouchableOpacity className="bg-secondary py-4 rounded-xl items-center flex-row justify-center mt-4">
                <Ionicons name="videocam" size={20} color="white" />
                <Text className="text-white font-sans-bold text-base ml-2">
                  Start Video Call
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>

      {/* Complete Appointment Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCompleteModal}
        onRequestClose={cancelCompleteAppointment}
      >
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View className="bg-white rounded-xl p-6 mx-4">
            <Text className="text-xl font-sans-bold text-gray-900 mb-2">
              Complete Appointment
            </Text>
            <Text className="text-base font-sans text-gray-600 mb-6">
              Are you sure you want to mark this appointment as completed?
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={cancelCompleteAppointment}
                className="px-4 py-2 rounded-lg"
                disabled={completing}
              >
                <Text className="text-base font-sans-medium text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmCompleteAppointment}
                className="bg-[#67A9AF] px-4 py-2 rounded-lg"
                disabled={completing}
              >
                {completing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-sans-bold text-white">
                    Complete
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}