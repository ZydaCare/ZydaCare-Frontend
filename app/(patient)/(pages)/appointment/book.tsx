import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format as formatDate } from 'date-fns';

import { useAuth } from '@/context/authContext';
import { AppointmentType, createBooking } from '@/api/patient/appointments';
import { getDoctorDetails } from '@/api/patient/user';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shareProfile } from '@/api/patient/user';
import { useToast } from '@/components/ui/Toast';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { doctorId: doctorIdParam } = useLocalSearchParams<{ doctorId?: string }>();
  const { user } = useAuth();

  const [doctorId] = useState<string | undefined>(typeof doctorIdParam === 'string' ? doctorIdParam : Array.isArray(doctorIdParam) ? doctorIdParam[0] : undefined);

  const [fullName, setFullName] = useState(user?.firstName || user?.lastName ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : '');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(user?.dob ? new Date(user.dob) : undefined);
  const [age, setAge] = useState<string>(user?.dob ? (new Date().getFullYear() - new Date(user.dob).getFullYear()).toString() : '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | undefined>(user?.gender as 'Male' | 'Female' | 'Other' | undefined);
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');

  const [appointmentType, setAppointmentType] = useState<AppointmentType>('virtual');
  const [appointmentDate, setAppointmentDate] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));

  const [reasonForAppointment, setReasonForAppointment] = useState('');
  const [currentSymptoms, setCurrentSymptoms] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [previousConsultations, setPreviousConsultations] = useState('');
  const [preferredDoctorOrSpecialty, setPreferredDoctorOrSpecialty] = useState('');

  const [emergencyRedFlags, setEmergencyRedFlags] = useState<boolean>(false);
  const [isAccurate, setIsAccurate] = useState<boolean>(true);
  const [consentToShare, setConsentToShare] = useState<boolean>(true);
  const [shareProfileWithDoctor, setShareProfileWithDoctor] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [sharingProfile, setSharingProfile] = useState(false);
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'insurance' | 'outOfPocket'>('outOfPocket');
  const { showToast } = useToast();

  // Update these lines in book.tsx
  const hasInsurance = user?.insurance?.hasInsurance || false;
  const insuranceProvider = user?.insurance?.provider || 'Insurance';

  const [fees, setFees] = useState<{ inPerson?: number; video?: number; homeVisit?: number } | null>(null);
  const [loadingFees, setLoadingFees] = useState<boolean>(false);

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
      if (!doctorId || !token) return;
      try {
        setLoadingFees(true);
        const res = await getDoctorDetails(doctorId, token);
        const data = res.data || res;
        const profile = data.profile || {};
        const consultationFees = profile.consultationFees || data.consultationFees || null;
        setFees(consultationFees);
      } catch (e) {
        setFees(null);
      } finally {
        setLoadingFees(false);
      }
    };
    run();
  }, [doctorId, token]);

  const amount = useMemo(() => {
    if (!fees) return 0;
    switch (appointmentType) {
      case 'virtual':
        return Number(fees.video || 0);
      case 'in-person':
        return Number(fees.inPerson || 0);
      case 'home':
        return Number(fees.homeVisit || 0);
      default:
        return 0;
    }
  }, [fees, appointmentType]);

  const canSubmit = useMemo(() => {
    return !!token && !!doctorId && !!fullName && !!appointmentType && !!appointmentDate && isAccurate && consentToShare && amount > 0 && !loadingFees;
  }, [token, doctorId, fullName, appointmentType, appointmentDate, isAccurate, consentToShare, amount, loadingFees]);

  const handleShareProfile = async () => {
    if (!token) {
      showToast('Authentication required', 'error');
      return;
    }

    try {
      setSharingProfile(true);
      const res = await shareProfile(token);

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to share profile');
      }

      showToast('Profile shared successfully with doctor', 'success');
      setShareProfileWithDoctor(true);
    } catch (err: any) {
      console.error('Profile share error:', err);
      showToast(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to share profile',
        'error'
      );
      setShareProfileWithDoctor(false);
    } finally {
      setSharingProfile(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !doctorId || !token) return;

    try {
      setSubmitting(true);

      // // If user opted to share profile, do it before booking
      // if (shareProfileWithDoctor && !sharingProfile) {
      //   try {
      //     await shareProfile(token);
      //   } catch (err) {
      //     console.log('Profile share during booking failed:', err);
      //     // Don't block booking if profile share fails
      //   }
      // }

      const payload = {
        doctorId,
        appointmentDate: appointmentDate.toISOString(),
        appointmentType,
        fullName,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
        age: age ? Number(age) : undefined,
        gender,
        contactPhone,
        contactEmail,
        reasonForAppointment,
        currentSymptoms,
        medicalHistory,
        currentMedications,
        allergies,
        previousConsultations,
        preferredDoctorOrSpecialty,
        emergencyRedFlags,
        isAccurate,
        consentToShare,
        amount,
      };

      const bookingRes = await createBooking(token, payload);
      if (!bookingRes?.success) {
        throw new Error(bookingRes?.message || 'Failed to create booking');
      }

      showToast('Appointment booked successfully', 'success');
      router.replace('/(patient)/(tabs)/appointment');
    } catch (err: any) {
      showToast(err?.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50">
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text className="text-base font-sans-semibold text-gray-900">Book Appointment</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Section: Appointment */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-sans-semibold text-gray-900 mb-3">Appointment Details</Text>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1 font-sans">Appointment Type</Text>
            <View className="flex-row gap-2">
              {(['virtual', 'in-person', 'home'] as AppointmentType[]).map((t) => (
                <TouchableOpacity key={t} onPress={() => setAppointmentType(t)} className={`px-3 py-2 rounded-xl ${appointmentType === t ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                  <Text className={`text-xs font-sans ${appointmentType === t ? 'text-emerald-700' : 'text-gray-700'}`}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1 font-sans">Date & Time</Text>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'android') {
                  DateTimePickerAndroid.open({
                    value: appointmentDate,
                    mode: 'date',
                    onChange: (_e, dateVal) => {
                      if (!dateVal) return;
                      const temp = new Date(appointmentDate);
                      temp.setFullYear(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate());
                      DateTimePickerAndroid.open({
                        value: temp,
                        mode: 'time',
                        onChange: (_e2, timeVal) => {
                          if (!timeVal) return;
                          const combined = new Date(temp);
                          combined.setHours(timeVal.getHours(), timeVal.getMinutes(), 0, 0);
                          setAppointmentDate(combined);
                        },
                      });
                    },
                  });
                } else {
                  setShowDatePicker(true);
                }
              }}
              className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 font-sans"
            >
              <Text className="text-sm text-gray-800 font-sans">{formatDate(appointmentDate, 'd MMMM yyyy h:mma')}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showDatePicker && (
              <DateTimePicker
                value={appointmentDate}
                mode="datetime"
                display={Platform.select({ ios: 'inline', android: 'default' })}
                onChange={(_, d) => {
                  setShowDatePicker(false);
                  if (d) setAppointmentDate(d);
                }}
              />
            )}
          </View>
        </View>

        {/* Section: Patient Info */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-sans-semibold text-gray-900 mb-3">Patient Information</Text>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1 font-sans">Full Name</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Your full name" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 font-sans" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1 font-sans">Date of Birth</Text>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'android') {
                  DateTimePickerAndroid.open({
                    value: dateOfBirth || new Date(),
                    mode: 'date',
                    onChange: (_event, d) => {
                      if (d) setDateOfBirth(d);
                    },
                  });
                } else {
                  setShowDOBPicker(true);
                }
              }}
              className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 font-sans"
            >
              <Text className="text-sm text-gray-800 font-sans">{dateOfBirth ? dateOfBirth.toDateString() : 'Select date of birth'}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showDOBPicker && (
              <DateTimePicker
                value={dateOfBirth || new Date()}
                mode="date"
                display={Platform.select({ ios: 'inline', android: 'default' })}
                onChange={(_, d) => {
                  setShowDOBPicker(false);
                  if (d) setDateOfBirth(d);
                }}
              />
            )}
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Age</Text>
            <TextInput keyboardType="number-pad" value={age} onChangeText={setAge} placeholder="Age (optional)" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 font-sans" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1 font-sans">Gender</Text>
            <View className="flex-row gap-2">
              {(['Male', 'Female', 'Other'] as const).map(g => (
                <TouchableOpacity key={g} onPress={() => setGender(g)} className={`px-3 py-2 rounded-xl ${gender === g ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                  <Text className={`text-xs font-sans ${gender === g ? 'text-emerald-700' : 'text-gray-700'}`}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Phone</Text>
            <TextInput keyboardType="phone-pad" value={contactPhone} onChangeText={setContactPhone} placeholder="Phone number" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 font-sans" />
          </View>

          <View className="mb-2">
            <Text className="text-xs text-gray-600 font-sans mb-1">Email</Text>
            <TextInput keyboardType="email-address" value={contactEmail} onChangeText={setContactEmail} placeholder="Email address" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 font-sans" />
          </View>
        </View>

        {/* Section: Medical Context */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-sans-semibold text-gray-900 mb-3">Medical Context</Text>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Reason for Appointment</Text>
            <TextInput value={reasonForAppointment} onChangeText={setReasonForAppointment} placeholder="Chief complaint" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Current Symptoms</Text>
            <TextInput multiline value={currentSymptoms} onChangeText={setCurrentSymptoms} placeholder="Short description" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Relevant Medical History</Text>
            <TextInput multiline value={medicalHistory} onChangeText={setMedicalHistory} placeholder="E.g., diabetes, hypertension, surgeries" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Current Medications</Text>
            <TextInput multiline value={currentMedications} onChangeText={setCurrentMedications} placeholder="If any" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Allergies</Text>
            <TextInput multiline value={allergies} onChangeText={setAllergies} placeholder="Drug, food, environmental" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Previous Consultations (if relevant)</Text>
            <TextInput multiline value={previousConsultations} onChangeText={setPreviousConsultations} placeholder="Optional" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View>
            <Text className="text-xs text-gray-600 font-sans mb-1">Preferred Doctor / Specialty (optional)</Text>
            <TextInput value={preferredDoctorOrSpecialty} onChangeText={setPreferredDoctorOrSpecialty} placeholder="Optional" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50" />
          </View>
        </View>

        {/* Section: Share Profile */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-sans-semibold text-gray-900 mb-3">Share Your Profile</Text>

          <View className="bg-blue-50 p-4 rounded-xl mb-4">
            <View className="flex-row items-start gap-2">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-[11.5px] font-sans text-blue-700 flex-1">
                Click on the share profile button. By sharing your complete profile helps the doctor provide better care by giving them access to your full medical history and records.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleShareProfile}
            disabled={sharingProfile || shareProfileWithDoctor}
            className={`flex-row items-center justify-center gap-2 py-3.5 rounded-xl ${shareProfileWithDoctor
              ? 'bg-green-50 border border-green-200'
              : sharingProfile
                ? 'bg-gray-100'
                : 'bg-[#67A9AF]'
              }`}
          >
            {sharingProfile ? (
              <>
                <ActivityIndicator color="#6B7280" size="small" />
                <Text className="text-gray-600 font-sans-medium">Sharing Profile...</Text>
              </>
            ) : shareProfileWithDoctor ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text className="text-green-700 font-sans-medium">Profile Shared</Text>
              </>
            ) : (
              <>
                <Ionicons name="share-outline" size={20} color="white" />
                <Text className="text-white font-sans-medium">Share My Profile with Doctor</Text>
              </>
            )}
          </TouchableOpacity>

          {shareProfileWithDoctor && (
            <View className="mt-3 flex-row items-start gap-2">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-xs font-sans text-gray-600 flex-1">
                Your profile will be shared with the doctor when you book this appointment
              </Text>
            </View>
          )}
        </View>

        {/* Section: Declarations */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-sans-semibold text-gray-900 mb-3">Declarations</Text>
          <TouchableOpacity onPress={() => setIsAccurate((v) => !v)} className="flex-row items-start gap-3 mb-3">
            <View className={`w-5 h-5 rounded border ${isAccurate ? 'bg-emerald-500 border-emerald-600' : 'border-gray-300'}`} >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text className="text-sm font-sans text-gray-700 flex-1">I confirm that the information provided is accurate to the best of my knowledge.</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setConsentToShare((v) => !v)} className="flex-row items-start gap-3">
            <View className={`w-5 h-5 rounded border ${consentToShare ? 'bg-emerald-500 border-emerald-600' : 'border-gray-300'}`}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
            <Text className="text-sm font-sans text-gray-700 flex-1">I consent to ZydaCare sharing this information securely with the attending doctor.</Text>
          </TouchableOpacity>
        </View>

        <View className="h-48" />
      </ScrollView>

      {/* Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        {/* Payment Method Selector */}
        {hasInsurance && (
          <View className="px-4 pt-3">
            <Text className="text-sm font-sans-medium text-gray-700 mb-2">Payment Method</Text>
            <View className="flex-row border border-gray-200 rounded-lg overflow-hidden mb-3">
              <TouchableOpacity
                onPress={() => setPaymentMethod('insurance')}
                className={`flex-1 py-2 px-5 justify-center items-center ${paymentMethod === 'insurance' ? 'bg-primary/10' : 'bg-white'}`}
              >
                <View className="flex-row items-center">
                  <View className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center ${paymentMethod === 'insurance' ? 'border-primary' : 'border-gray-300'}`}>
                    {paymentMethod === 'insurance' && <View className="w-3 h-3 rounded-full bg-primary" />}
                  </View>
                  <Text className={`font-sans-medium text-[14px] ${paymentMethod === 'insurance' ? 'text-primary' : 'text-gray-600'}`}>
                    Use Insurance ({insuranceProvider})
                  </Text>
                </View>
                {/* {paymentMethod === 'insurance' && (
                  <Text className="text-xs text-green-600 mt-1">Coverage verified</Text>
                )} */}
              </TouchableOpacity>

              <View className="w-px bg-gray-200" />

              <TouchableOpacity
                onPress={() => setPaymentMethod('outOfPocket')}
                className={`flex-1 py-2 px-5 justify-center items-center ${paymentMethod === 'outOfPocket' ? 'bg-primary/10' : 'bg-white'}`}
              >
                <View className="flex-row items-center">
                  <View className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center ${paymentMethod === 'outOfPocket' ? 'border-primary' : 'border-gray-300'}`}>
                    {paymentMethod === 'outOfPocket' && <View className="w-3 h-3 rounded-full bg-primary" />}
                  </View>
                  <Text className={`font-sans-medium text-[14px] ${paymentMethod === 'outOfPocket' ? 'text-primary' : 'text-gray-600'}`}>
                    Pay Out of Pocket
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Book Button */}
        <View className="px-4 pb-4">
          <TouchableOpacity
            disabled={!canSubmit || submitting}
            onPress={handleSubmit}
            className="py-3.5 rounded-xl items-center justify-center"
            style={{ backgroundColor: canSubmit ? '#67A9AF' : '#9CA3AF' }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="items-center">
                <Text className="text-white font-sans-semibold text-lg">
                  {paymentMethod === 'insurance' ? 'Book with Insurance' : 'Book ₦' + amount.toLocaleString()}
                </Text>
                {paymentMethod === 'insurance' && (
                  <Text className="text-white/80 text-xs font-sans">No upfront payment required</Text>
                )}
              </View>
            )}
          </TouchableOpacity>

          {paymentMethod === 'insurance' && (
            <Text className="text-xs text-gray-500 mt-2 font-sans text-center">
              Your insurance will be billed directly. You may be responsible for copays or non-covered services.
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}