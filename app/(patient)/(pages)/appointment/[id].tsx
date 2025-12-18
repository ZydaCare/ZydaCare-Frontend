import { Ionicons } from '@expo/vector-icons';
import { addMinutes, format as formatDate, isAfter, isBefore } from 'date-fns';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, Modal, RefreshControl, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAppointmentDetails, initiateAppointmentPayment } from '@/api/patient/appointments';
import { getReviewForBooking, submitReview } from '@/api/patient/reviews';
import { useToast } from '@/components/ui/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#67A9AF';

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' };
      case 'awaiting_payment':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' };
      case 'accepted':
        return { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' };
      case 'paid':
        return { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
    }
  };

  const colors = getStatusColor();
  return (
    <View style={{ backgroundColor: colors.bg, borderColor: colors.border }} className="px-3 py-1.5 rounded-full border">
      <Text style={{ color: colors.text }} className="text-xs font-sans-semibold capitalize">
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  );
};

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View className="flex-row items-start py-3 border-b border-gray-100">
    <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-primary/15">
      <Ionicons name={icon as any} size={20} color='#67A9AF' />
    </View>
    <View className="flex-1">
      <Text className="text-xs font-sans text-gray-500 mb-0.5">{label}</Text>
      <Text className="text-sm font-sans-medium text-gray-900">{value}</Text>
    </View>
  </View>
);

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  // const { token } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appt, setAppt] = useState<any | null>(null);
  const [payPromptOpen, setPayPromptOpen] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [joiningCall, setJoiningCall] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };

    loadToken();
  }, []);


  useEffect(() => {
    const run = async () => {
      if (!token || !id) return;
      try {
        if (!refreshing) setLoading(true);
        setError(null);
        const res = await getAppointmentDetails(token, id);
        const data = res.data || res;
        setAppt(data);
        if (data?.status === 'awaiting_payment') {
          setPayPromptOpen(true);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load appointment');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };
    run();
  }, [id, token, refreshing]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const formatted = useMemo(() => {
    if (!appt) return null;
    // const title = appt.doctor?.profile?.title || '';
    // const first = appt.doctor?.user?.firstName || '';
    // const last = appt.doctor?.user?.lastName || '';
    // const constructedName = `${title ? title + ' ' : ''}${first} ${last}`.trim();
    // const specialties = appt.doctor?.profile?.specialties;
    // const specialtyFromProfile = Array.isArray(specialties) && specialties.length > 0 ? specialties[0] : '';
    // const specialtyFromMedical = appt.medicalContext?.preferredDoctorOrSpecialty || '';

    return {
      id: appt._id || appt.id,
      doctorTitle: appt.doctor?.profile?.title || '',
      doctorName: appt.doctor?.fullName || 'Doctor',
      doctorImage: appt.doctor?.profile?.profileImage?.url || null,
      speciality:
        appt.doctor?.speciality ||
        // appt.doctor?.practiceInfo?.speciality ||
        // appt.doctor?.practiceInfo?.specialty ||
        // specialtyFromProfile ||
        // specialtyFromMedical ||
        'General Practice',
      date: appt.appointmentDate ? formatDate(new Date(appt.appointmentDate), 'd MMMM yyyy') : '',
      time: appt.appointmentDate ? formatDate(new Date(appt.appointmentDate), 'h:mm a') : '',
      status: appt.status,
      type: appt.appointmentType,
      amount: appt.amount,
      patientFullName: appt.patientInfo?.fullName || '',
      patientAge: appt.patientInfo?.age || '',
      patientGender: appt.patientInfo?.gender || '',
      patientPhone: appt.patientInfo?.contact?.phone || '',
      patientEmail: appt.patientInfo?.contact?.email || '',
      reason: appt.medicalContext?.reasonForAppointment || '',
      symptoms: appt.medicalContext?.currentSymptoms || '',
      medicalHistory: appt.medicalContext?.medicalHistory || '',
      medications: appt.medicalContext?.currentMedications || '',
      allergies: appt.medicalContext?.allergies || '',
      doctorExperience: appt.doctor?.profile?.yearsOfExperience || '',
      doctorSummary: appt.doctor?.profile?.professionalSummary || '',
      location: appt.doctor?.profile?.location,
      paymentStatus: appt.paymentStatus,
      reference: appt.reference,
      createdAt: appt.createdAt ? formatDate(new Date(appt.createdAt), 'd MMM yyyy, h:mm a') : '',
    };
  }, [appt]);

  const canJoinVideoCall = useMemo(() => {
    if (!appt?.appointmentDate || !appt?.virtualMeeting?.doctorJoinedAt) return false;

    const appointmentDate = new Date(appt.appointmentDate);
    const fiveMinutesBefore = addMinutes(appointmentDate, -5);
    const now = new Date();

    // Can join if current time is within 5 minutes before or after the appointment time
    // and the doctor has already joined
    return isAfter(now, fiveMinutesBefore) && isBefore(now, addMinutes(appointmentDate, 5));
  }, [appt]);

  const handleJoinVideoCall = async () => {
    if (!appt?.virtualMeeting?.link) {
      showToast('No meeting link available', 'error');
      return;
    }

    try {
      setJoiningCall(true);
      await Linking.openURL(appt.virtualMeeting.link);
    } catch (error) {
      console.error('Error joining video call:', error);
      showToast('Failed to join video call', 'error');
    } finally {
      setJoiningCall(false);
    }
  };

  const handleRateDoctor = () => {
    setRatingModalVisible(true);
  };

  // Check if user has already reviewed this appointment
  const checkForExistingReview = useCallback(async () => {
    if (!token || !id) return;

    try {
      const response = await getReviewForBooking(token, id);
      if (response.data) {
        setHasReviewed(true);
        setExistingReview(response.data);
        setRating(response.data.rating);
        setReview(response.data.comment || '');
        setSelectedCategories(response.data.categories || []);
      }
    } catch (error) {
      console.error('Error checking for existing review:', error);
    }
  }, [token, id]);

  useEffect(() => {
    if ((formatted?.status === 'awaiting_payment' || formatted?.status === 'paid') && !hasReviewed) {
      checkForExistingReview();
    }
  }, [formatted?.status, hasReviewed, checkForExistingReview]);

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      showToast('Please select a rating', 'error');
      return;
    }

    if (!token || !id) {
      showToast('Please log in to submit a review', 'error');
      return;
    }

    try {
      setIsSubmitting(true);

      await submitReview(token, {
        bookingId: id,
        rating,
        comment: review,
        categories: selectedCategories,
        isAnonymous: false
      });

      showToast('Thank you for your feedback!', 'success');
      setHasReviewed(true);
      setRatingModalVisible(false);
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit rating';
      showToast(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const ratingCategories = [
    'Professionalism', 'Knowledge', 'Communication', 'Expertise',
    'Bedside Manner', 'Wait Time', 'Facility'
  ];

  const startPayment = async () => {
    if (!token || !id) return;
    try {
      setInitiating(true);
      const res = await initiateAppointmentPayment(token, id);
      const data = res.data || res;
      const { authorization_url, reference } = data;
      if (authorization_url && reference) {
        setPayPromptOpen(false);
        router.push({ pathname: '/appointment/pay', params: { url: authorization_url, reference } });
      } else {
        showToast('Unable to start payment. Please try again later.', 'error');
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to start payment', 'error');
    } finally {
      setInitiating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50">
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-base font-sans-semibold text-gray-900">Appointment Details</Text>
        <View className="w-10" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color='#67A9AF' />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#FEE2E2' }}>
            <Ionicons name="alert-circle" size={32} color="#DC2626" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 mb-2">Something went wrong</Text>
          <Text className="text-gray-600 text-center">{error}</Text>
        </View>
      ) : !formatted ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#F3F4F6' }}>
            <Ionicons name="document-text-outline" size={32} color="#6B7280" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 mb-2">No appointment found</Text>
          <Text className="text-gray-600 text-center font-sans">We couldn't find this appointment</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#67A9AF']}
              tintColor="#67A9AF"
            />
          }>
          {/* Doctor Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <View className="flex-row items-start mb-4">
              {/* Doctor Image */}
              <View className="mr-3">
                {formatted.doctorImage ? (
                  <Image
                    source={{ uri: formatted.doctorImage }}
                    className="w-16 h-16 rounded-full"
                    style={{ backgroundColor: '#F3F4F6' }}
                  />
                ) : (
                  <View
                    className="w-16 h-16 rounded-full items-center justify-center bg-primary/20"
                  >
                    <Ionicons name="person" size={28} color='#67A9AF' />
                  </View>
                )}
              </View>

              {/* Doctor Info */}
              <View className="flex-1">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="text-xl font-sans-semibold text-gray-900">{formatted.doctorTitle} {formatted.doctorName}</Text>
                    <Text className="text-gray-600 mb-1 font-sans-medium">{formatted.speciality}</Text>
                    {formatted.doctorExperience ? (
                      <Text className="text-xs font-sans text-gray-500">{formatted.doctorExperience} years experience</Text>
                    ) : null}
                  </View>
                  <StatusBadge status={formatted.status} />
                </View>
              </View>
            </View>

            {formatted.doctorSummary ? (
              <View className="bg-gray-50 rounded-xl p-3 mb-4">
                <Text className="text-xs font-sans text-gray-600">{formatted.doctorSummary}</Text>
              </View>
            ) : null}

            {/* Appointment Details Grid */}
            <View className="flex-row flex-wrap -mx-1">
              <View className="w-1/2 px-1 mb-3">
                <View className="bg-gray-50 rounded-xl p-3">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="calendar-outline" size={16} color='#67A9AF' />
                    <Text className="text-xs font-sans text-gray-500 ml-1">Date</Text>
                  </View>
                  <Text className="text-sm font-sans-semibold text-gray-900">{formatted.date}</Text>
                </View>
              </View>
              <View className="w-1/2 px-1 mb-3">
                <View className="bg-gray-50 rounded-xl p-3">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="time-outline" size={16} color='#67A9AF' />
                    <Text className="text-xs font-sans text-gray-500 ml-1">Time</Text>
                  </View>
                  <Text className="text-sm font-sans-semibold text-gray-900">{formatted.time}</Text>
                </View>
              </View>
              <View className="w-1/2 px-1 mb-3">
                <View className="bg-gray-50 rounded-xl p-3">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="videocam-outline" size={16} color='#67A9AF' />
                    <Text className="text-xs font-sans text-gray-500 ml-1">Type</Text>
                  </View>
                  <Text className="text-sm font-sans-semibold text-gray-900 capitalize">{formatted.type}</Text>
                </View>
              </View>
              <View className="w-1/2 px-1 mb-3">
                <View className="bg-gray-50 rounded-xl p-3">
                  <View className="flex-row items-center mb-1">
                    <Ionicons name="cash-outline" size={16} color='#67A9AF' />
                    <Text className="text-xs font-sans text-gray-500 ml-1">Amount</Text>
                  </View>
                  <Text className="text-sm font-sans-semibold text-gray-900">
                    ₦{Number(formatted.amount).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {formatted.location ? (
              <View className="mt-2 pt-4 border-t border-gray-100">
                <View className="flex-row items-start">
                  <Ionicons name="location-outline" size={18} color='#67A9AF' />
                  <View className="flex-1 ml-2">
                    <Text className="text-xs font-sans text-gray-500 mb-0.5">Location</Text>
                    <Text className="text-sm font-sans-medium text-gray-800">
                      {formatted.location.address}, {formatted.location.city}, {formatted.location.state}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          {/* Patient Information */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="text-base font-sans-semibold text-gray-900 mb-3">Patient Information</Text>
            <InfoRow icon="person-outline" label="Full Name" value={formatted.patientFullName} />
            <InfoRow
              icon="body-outline"
              label="Age & Gender"
              value={`${formatted.patientAge} years, ${formatted.patientGender}`}
            />
            {formatted.patientPhone ? (
              <InfoRow icon="call-outline" label="Phone" value={formatted.patientPhone} />
            ) : null}
            {formatted.patientEmail ? (
              <InfoRow icon="mail-outline" label="Email" value={formatted.patientEmail} />
            ) : null}
          </View>

          {/* Medical Context */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="text-base font-sans-semibold text-gray-900 mb-3">Medical Context</Text>

            {formatted.reason ? (
              <View className="mb-4">
                <Text className="text-xs font-sans text-gray-500 mb-1">Reason for Appointment</Text>
                <Text className="text-sm font-sans-medium text-gray-900">{formatted.reason}</Text>
              </View>
            ) : null}

            {formatted.symptoms ? (
              <View className="mb-4">
                <Text className="text-xs font-sans text-gray-500 mb-1">Current Symptoms</Text>
                <Text className="text-sm font-sans-medium text-gray-900">{formatted.symptoms}</Text>
              </View>
            ) : null}

            <View className="flex-row flex-wrap -mx-1">
              <View className="w-1/3 px-1 mb-2">
                <View className="bg-gray-50 rounded-lg p-3">
                  <Text className="text-xs font-sans text-gray-500 mb-1">History</Text>
                  <Text className="text-xs font-sans-semibold text-gray-900">{formatted.medicalHistory || 'None'}</Text>
                </View>
              </View>
              <View className="w-1/3 px-1 mb-2">
                <View className="bg-gray-50 rounded-lg p-3">
                  <Text className="text-xs font-sans text-gray-500 mb-1">Medications</Text>
                  <Text className="text-xs font-sans-semibold text-gray-900">{formatted.medications || 'None'}</Text>
                </View>
              </View>
              <View className="w-1/3 px-1 mb-2">
                <View className="bg-gray-50 rounded-lg p-3">
                  <Text className="text-xs text-gray-500 font-sans mb-1">Allergies</Text>
                  <Text className="text-xs font-sans-semibold text-gray-900">{formatted.allergies || 'None'}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Information */}
          {formatted.reference ? (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <Text className="text-base font-sans-semibold text-gray-900 mb-3">Payment Information</Text>
              <View className="bg-gray-50 rounded-xl p-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs font-sans text-gray-500">Payment Status</Text>
                  <Text className="text-sm font-sans-semibold text-gray-900 capitalize">{formatted.paymentStatus}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs font-sans text-gray-500">Reference</Text>
                  <Text className="text-sm font-sans-semibold text-gray-900">{formatted.reference}</Text>
                </View>
              </View>
            </View>
          ) : null}



          {/* Show review if exists, otherwise show rate button */}
          {(formatted.status === 'awaiting_payment' || formatted.status === 'paid') && (
            <View className="mt-4">
              {hasReviewed ? (
                <View className="bg-white rounded-2xl p-5 shadow-sm">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-sans-semibold text-gray-900">Your Review</Text>
                    <View className="flex-row">
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < (existingReview?.rating || 0) ? 'star' : 'star-outline'}
                          size={20}
                          color={i < (existingReview?.rating || 0) ? '#F59E0B' : '#D1D5DB'}
                        />
                      ))}
                    </View>
                  </View>

                  {existingReview?.comment && (
                    <View className="mb-3">
                      <Text className="text-gray-700 font-sans">{existingReview.comment}</Text>
                    </View>
                  )}

                  {existingReview?.categories?.length > 0 && (
                    <View className="flex-row flex-wrap mt-2">
                      {existingReview.categories.map((category: string, index: number) => (
                        <View key={index} className="bg-gray-100 rounded-full px-3 py-1 mr-2 mb-2">
                          <Text className="text-sm font-sans text-gray-700">{category}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text className="text-xs text-gray-500 mt-2">
                    Reviewed on {new Date(existingReview?.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleRateDoctor}
                  className="py-4 rounded-xl items-center justify-center flex-row bg-[#67A9AF]"
                >
                  <Ionicons name="star" size={20} color="white" />
                  <Text className="text-white font-sans-bold text-base ml-2">
                    Rate Your Experience
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Booking Details */}
          <View className="bg-gray-100 rounded-xl p-4 mt-5">
            <Text className="text-xs font-sans text-gray-500">Booking created on {formatted.createdAt}</Text>
          </View>

          {/* Join Video Call Button - Only show for virtual appointments that are accepted/paid */}
          {formatted.type === 'virtual' && ['accepted'].includes(formatted.status) && (
            <View className="mt-4">
              <TouchableOpacity
                className={`py-4 rounded-xl items-center justify-center flex-row ${canJoinVideoCall ? 'bg-[#67A9AF]' : 'bg-gray-300'}`}
                onPress={handleJoinVideoCall}
                disabled={!canJoinVideoCall || joiningCall}
              >
                {joiningCall ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="videocam" size={20} color="white" />
                    <Text className="text-white font-sans-bold text-base ml-2">
                      {appt?.virtualMeeting?.doctorJoinedAt ? 'Join Video Call' : 'Waiting for Doctor'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              {!canJoinVideoCall && (
                <Text className="text-xs text-gray-500 font-sans mt-2 text-center">
                  {!appt?.virtualMeeting?.doctorJoinedAt
                    ? 'The doctor has not joined the call yet.'
                    : 'You can join the call 5 minutes before the scheduled time.'}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Payment Prompt Modal */}
      <Modal visible={payPromptOpen} transparent animationType="fade" onRequestClose={() => setPayPromptOpen(false)}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white w-full rounded-3xl p-6">
            <View className="w-16 h-16 rounded-full items-center justify-center mb-4 self-center bg-primary/20">
              <Ionicons name="card-outline" size={32} color='#67A9AF' />
            </View>
            <Text className="text-xl font-sans-semibold text-gray-900 mb-2 text-center">Payment Required</Text>
            <Text className="text-gray-600 font-sans mb-6 text-center">
              This appointment has been completed. Please pay the doctor for their services to proceed.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setPayPromptOpen(false)}
                className="flex-1 py-4 rounded-xl items-center justify-center border-2 border-gray-200"
              >
                <Text className="text-gray-700 font-sans-semibold">Later</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={initiating}
                onPress={startPayment}
                className="flex-1 py-4 rounded-xl items-center justify-center"
                style={{ backgroundColor: initiating ? '#9CA3AF' : '#67A9AF' }}
              >
                {initiating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-sans-semibold">Pay Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rating Modal - Only show if not already reviewed */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isSubmitting && setRatingModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View className="flex-1 bg-black/50 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-sans-bold text-gray-900">Rate Your Experience</Text>
                  <TouchableOpacity
                    onPress={() => !isSubmitting && setRatingModalVisible(false)}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="mb-6">
                    <Text className="text-base font-sans-medium text-gray-900 mb-3">
                      {hasReviewed ? 'Your Review of' : 'How was your experience with'} {formatted?.doctorTitle} {formatted?.doctorName}?
                    </Text>
                    <View className="flex-row justify-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setRating(star)}
                          disabled={isSubmitting}
                        >
                          <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={36}
                            color={star <= rating ? '#F59E0B' : '#D1D5DB'}
                            style={{ marginHorizontal: 4 }}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text className="text-center text-sm text-gray-500">
                      {hasReviewed ? 'Your rating: ' : ''}
                      {rating === 0 ? 'Not rated' :
                        rating === 1 ? '⭐ Poor' :
                          rating === 2 ? '⭐⭐ Fair' :
                            rating === 3 ? '⭐⭐⭐ Good' :
                              rating === 4 ? '⭐⭐⭐⭐ Very Good' : '⭐⭐⭐⭐⭐ Excellent'}
                    </Text>
                  </View>

                  <View className="mb-6">
                    <Text className="text-base font-sans-medium text-gray-900 mb-3">What made your experience {rating >= 4 ? 'great' : 'less than expected'}?</Text>
                    <View className="flex-row flex-wrap -mx-1 mb-3">
                      {ratingCategories.map((category) => (
                        <TouchableOpacity
                          key={category}
                          onPress={() => toggleCategory(category)}
                          disabled={isSubmitting}
                          className={`px-3 py-2 rounded-full m-1 ${selectedCategories.includes(category)
                            ? 'bg-[#67A9AF]'
                            : 'bg-gray-100'}`}
                        >
                          <Text className={`text-sm font-sans ${selectedCategories.includes(category)
                            ? 'text-white'
                            : 'text-gray-700'}`}>
                            {category}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View className="mb-6">
                    <Text className="text-base font-sans-medium text-gray-900 mb-3">Add a review (optional)</Text>
                    <TextInput
                      value={review}
                      onChangeText={setReview}
                      placeholder="Share details about your experience..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={4}
                      editable={!isSubmitting}
                      className="bg-gray-50 rounded-xl p-4 text-gray-900 font-sans text-base"
                      style={{ textAlignVertical: 'top' }}
                    />
                  </View>

                  {!hasReviewed && (
                    <TouchableOpacity
                      onPress={handleRatingSubmit}
                      disabled={isSubmitting || rating === 0}
                      className={`py-4 rounded-xl items-center justify-center mb-4 ${isSubmitting || rating === 0 ? 'bg-gray-300' : 'bg-[#67A9AF]'}`}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-white font-sans-bold text-base">
                          Submit Review
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}