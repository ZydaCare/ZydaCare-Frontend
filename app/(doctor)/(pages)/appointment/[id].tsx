import { acceptAppointment, Appointment, cancelAppointment, completeAppointment, getAppointment, markDoctorJoined, getDoctorReview } from '@/api/doctor/appointments';
import { useToast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const { showToast } = useToast();
  const [accepting, setAccepting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [joiningCall, setJoiningCall] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

  // Update the checkForExistingReview function
  const checkForExistingReview = useCallback(async () => {
    if (!appointment?.doctor?._id) return;

    try {
      const review = await getDoctorReview(appointment.doctor._id);
      if (review) {
        setHasReviewed(true);
        setExistingReview(review);
        setRating(review.rating);
        setReview(review.comment || '');
        setSelectedCategories(review.categories || []);
      }
    } catch (error) {
      console.error('Error checking for existing review:', error);
    }
  }, [appointment?.doctor?._id]);

  // Update the useEffect that calls checkForExistingReview
  useEffect(() => {
    if (appointment?.status && ['awaiting_payment', 'paid'].includes(appointment.status)) {
      checkForExistingReview();
    }
  }, [appointment?.status, checkForExistingReview]);


  const handleStartVideoCall = async () => {
    console.log('Appointment data:', JSON.stringify(appointment, null, 2));
    console.log('Virtual meeting data:', JSON.stringify(appointment?.virtualMeeting, null, 2));

    if (!appointment?.virtualMeeting) {
      console.log('No virtual meeting data available');
      showToast('Virtual meeting not properly set up', 'error');
      return;
    }

    if (!appointment.virtualMeeting.roomName) {
      console.log('No roomName found in virtualMeeting');
      showToast('Meeting room not properly set up. Please contact support.', 'error');
      return;
    }

    try {
      setJoiningCall(true);
      console.log('Marking doctor as joined...');

      try {
        const response = await markDoctorJoined(appointment._id);
        console.log('Doctor marked as joined:', response);
      } catch (markError) {
        console.warn('Failed to mark doctor as joined, but continuing with call:', markError);
        // Continue with the call even if marking as joined fails
      }

      const meetingUrl = `https://meet.jit.si/${appointment.virtualMeeting.roomName}`;
      console.log('Opening meeting URL:', meetingUrl);

      await Linking.openURL(meetingUrl);

      console.log('Updating local state...');
      setAppointment(prev => ({
        ...prev!,
        virtualMeeting: {
          ...prev!.virtualMeeting!,
          doctorJoinedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Error joining video call:', error);
      showToast('Failed to join video call', 'error');
    } finally {
      setJoiningCall(false);
    }
  };
  // const handleStartVideoCall = async () => {
  //   if (!appointment?.virtualMeeting?.link) {
  //     showToast('No meeting link available', 'error');
  //     return;
  //   }

  //   try {
  //     setJoiningCall(true);

  //     // Mark doctor as joined in the backend
  //     await markDoctorJoined(appointment._id);

  //     // Open the meeting link in the browser
  //     await Linking.openURL(appointment.virtualMeeting.link);

  //     // Update local state to reflect doctor has joined
  //     setAppointment(prev => ({
  //       ...prev!,
  //       virtualMeeting: {
  //         ...prev!.virtualMeeting!,
  //         doctorJoinedAt: new Date().toISOString()
  //       }
  //     }));
  //   } catch (error) {
  //     console.error('Error joining video call:', error);
  //     showToast('Failed to join video call', 'error');
  //   } finally {
  //     setJoiningCall(false);
  //   }
  // };

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

  const acceptPatientAppointment = async () => {
    try {
      setAccepting(true);
      await acceptAppointment(id as string);
      showToast('Appointment accepted', 'success');
      fetchAppointmentDetails();
    } catch (error) {
      showToast('Failed to accept appointment', 'error');
    } finally {
      setAccepting(false);
    }
  };

  const cancelCompleteAppointment = () => {
    setShowCompleteModal(false);
  };

  const handleCancelAppointment = async () => {
    setShowCancelModal(true);
  };

  const confirmCancelAppointment = async () => {
    try {
      setCancelling(true);
      await cancelAppointment(id as string);
      showToast('Appointment cancelled', 'success');
      fetchAppointmentDetails();
    } catch (error) {
      showToast('Failed to cancel appointment', 'error');
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const cancelCancelAppointment = () => {
    setShowCancelModal(false);
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#F59E0B]';
      case 'accepted':
        return 'bg-[#F59E0B]';
      case 'awaiting_payment':
        return 'bg-[#3B82F6]';
      case 'paid':
        return 'bg-[#10B981]';
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
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-sans-bold text-gray-500 uppercase">
              Patient Information
            </Text>
            {appointment?.chatRoom && (appointment.status === 'accepted' || appointment.status === 'awaiting_payment') && (
              <TouchableOpacity
                onPress={() => {
                  if (appointment.chatRoom?._id) {
                    router.push({
                      pathname: `/(doctor)/(pages)/chat/${appointment.chatRoom._id}`,
                      params: {
                        patientId: appointment.patient._id,
                        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
                        patientAvatar: appointment.patient.profileImage?.url
                      }
                    });
                  } else {
                    showToast('Chat room not available yet', 'error');
                  }
                }}
                className="flex-row items-center mr-3 bg-primary px-3 py-1.5 rounded-lg"
              >
                <Ionicons name="chatbubble-ellipses" size={16} color="#fff" />
                <Text className="text-white font-sans-medium text-sm ml-1">Chat</Text>
              </TouchableOpacity>
            )}

          </View>


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

        {/* Show review if exists, otherwise show rate button */}
        <View className='mx-6'>
          {hasReviewed && existingReview ? (
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-sans-semibold text-gray-900">Patient's Review</Text>
              <View className="flex-row">
                {[...Array(5)].map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < existingReview.rating ? 'star' : 'star-outline'}
                    size={20}
                    color={i < existingReview.rating ? '#F59E0B' : '#D1D5DB'}
                  />
                ))}
              </View>
            </View>

            {existingReview.comment ? (
              <View className="mb-3">
                <Text className="text-gray-700 font-sans">{existingReview.comment}</Text>
              </View>
            ) : null}

            {existingReview.categories?.length > 0 && (
              <View className="flex-row flex-wrap mt-2">
                {existingReview.categories.map((category: string, index: number) => (
                  <View key={index} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                    <Text className="text-sm font-sans text-gray-700">{category}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text className="text-xs text-gray-500 mt-2">
              Reviewed on {new Date(existingReview.createdAt).toLocaleDateString()}
            </Text>
          </View>
        ) : (
          <View className="bg-white rounded-2xl p-5 shadow-sm mt-4">
            <Text className="text-gray-700 font-sans">No review submitted by patient yet</Text>
          </View>
        )}
        </View>

        {/* Action Buttons */}
        <View className="mx-6 mb-8">
          {/* Pending status: Show Accept Appointment button only */}
          {appointment.status === 'pending' && (
            <View>
              <TouchableOpacity
                className="bg-primary py-4 rounded-xl items-center flex-row justify-center"
                onPress={acceptPatientAppointment}
                disabled={accepting}
              >
                {accepting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text className="text-white font-sans-bold text-base ml-2">
                      Accept Appointment
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-secondary py-4 rounded-xl items-center flex-row justify-center mt-4"
                onPress={handleCancelAppointment}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="white" />
                    <Text className="text-white font-sans-bold text-base ml-2">
                      Cancel Appointment
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}


          {/* Show video call and complete options for accepted appointments that are not awaiting payment or paid */}
          {appointment.status === 'accepted' && appointment.status !== 'awaiting_payment' && appointment.status !== 'paid' && (
            <>
              {/* Show Video Call button for virtual appointments */}
              {appointment.appointmentType === 'virtual' && (
                <TouchableOpacity
                  className="bg-[#67A9AF] py-4 rounded-xl items-center flex-row justify-center"
                  onPress={handleStartVideoCall}
                  disabled={joiningCall}
                >
                  {joiningCall ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="videocam" size={20} color="white" />
                      <Text className="text-white font-sans-bold text-base ml-2">
                        {appointment.virtualMeeting?.doctorJoinedAt ? 'Rejoin Video Call' : 'Start Video Call'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Show Chat button for home-visit or in-person appointments */}
              {(appointment.appointmentType === 'home-visit' ||
                appointment.appointmentType === 'in-person') && (
                  <TouchableOpacity
                    className="bg-[#67A9AF] py-4 rounded-xl items-center flex-row justify-center"
                    onPress={() => router.push({
                      pathname: '/(doctor)/(pages)/chat/[id]',
                      params: { id: appointment.patient._id }
                    })}
                  >
                    <Ionicons name="chatbubble-outline" size={20} color="white" />
                    <Text className="text-white font-sans-bold text-base ml-2">
                      Chat with Patient
                    </Text>
                  </TouchableOpacity>
                )}

              {/* Complete Appointment button */}
              <TouchableOpacity
                className="bg-primary py-4 rounded-xl items-center flex-row justify-center mt-4"
                onPress={handleCompleteAppointment}
                disabled={completing}
              >
                {completing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="white" />
                    <Text className="text-white font-sans-bold text-base ml-2">
                      Complete Appointment
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Cancel Appointment button */}
              <TouchableOpacity
                className="bg-secondary py-4 rounded-xl items-center flex-row justify-center mt-4"
                onPress={handleCancelAppointment}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={20} color="white" />
                    <Text className="text-white font-sans-bold text-base ml-2">
                      Cancel Appointment
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Awaiting Payment status: Don't show video call button */}
          {false && appointment.status === 'awaiting_payment' && (
            <>
              {appointment.appointmentType === 'virtual' && (
                <TouchableOpacity
                  className="bg-[#67A9AF] py-4 rounded-xl items-center flex-row justify-center"
                  onPress={handleStartVideoCall}
                  disabled={joiningCall}
                >
                  {joiningCall ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons name="videocam" size={20} color="white" />
                      <Text className="text-white font-sans-bold text-base ml-2">
                        {appointment.virtualMeeting?.doctorJoinedAt ? 'Rejoin Video Call' : 'Start Video Call'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {(appointment.appointmentType === 'home-visit' ||
                appointment.appointmentType === 'in-person') && (
                  <TouchableOpacity className="bg-[#67A9AF] py-4 rounded-xl items-center flex-row justify-center">
                    <Ionicons name="chatbubble-outline" size={20} color="white" />
                    <Text className="text-white font-sans-bold text-base ml-2">
                      Chat with Patient
                    </Text>
                  </TouchableOpacity>
                )}
            </>
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

      {/* Cancel Appointment Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showCancelModal}
        onRequestClose={cancelCancelAppointment}
      >
        <View className="flex-1 bg-black/50 justify-center px-4">
          <View className="bg-white rounded-xl p-6 mx-4">
            <Text className="text-xl font-sans-bold text-gray-900 mb-2">
              Cancel Appointment
            </Text>
            <Text className="text-base font-sans text-gray-600 mb-6">
              Are you sure you want to cancel this appointment?
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={cancelCancelAppointment}
                className="px-4 py-2 rounded-lg"
                disabled={cancelling}
              >
                <Text className="text-base font-sans-medium text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmCancelAppointment}
                className="bg-[#67A9AF] px-4 py-2 rounded-lg"
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-base font-sans-bold text-white">
                    Cancel
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