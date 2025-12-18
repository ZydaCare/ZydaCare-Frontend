import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { format as formatDate } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppointmentType, createBooking } from '@/api/patient/appointments';
import { getDoctorDetails, shareProfile } from '@/api/patient/user';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const [appointmentDate, setAppointmentDate] = useState<Date>(() => new Date());

  const [appointmentType, setAppointmentType] = useState<AppointmentType>('virtual');

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
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'insurance' | 'outOfPocket'>('outOfPocket');
  const { showToast } = useToast();

  const hasInsurance = user?.insurance?.hasInsurance || false;
  const insuranceProvider = user?.insurance?.provider || 'Insurance';

  const [fees, setFees] = useState<{ inPerson?: number; video?: number; homeVisit?: number } | null>(null);
  const [loadingFees, setLoadingFees] = useState<boolean>(false);
  const [doctorAvailability, setDoctorAvailability] = useState<any>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

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
        
        // Store doctor's availability
        if (profile.availability) {
          setDoctorAvailability(profile.availability);
          
          // Only adjust time if there's a notice period set
          if (profile.availability.noticePeriod) {
            const newAppointmentDate = new Date();
            newAppointmentDate.setMinutes(newAppointmentDate.getMinutes() + profile.availability.noticePeriod);
            // Round up to nearest 15 minutes
            const minutes = newAppointmentDate.getMinutes();
            newAppointmentDate.setMinutes(minutes + (15 - (minutes % 15)));
            newAppointmentDate.setSeconds(0, 0);
            setAppointmentDate(newAppointmentDate);
          }
          // If no notice period, keep the current time as is
        }
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
    return !!token && !!doctorId && !!fullName && !!gender && !!contactPhone && !!reasonForAppointment && !!currentSymptoms && !!appointmentType && !!appointmentDate && isAccurate && consentToShare && amount > 0 && !loadingFees;
  }, [token, doctorId, fullName, gender, contactPhone, reasonForAppointment, currentSymptoms, appointmentType, appointmentDate, isAccurate, consentToShare, amount, loadingFees]);

  // Check if the selected time slot is valid and available
  const validateTimeSlot = (selectedDate: Date) => {
    const now = new Date();
    
    // Check if the selected date is in the past
    if (selectedDate < now) {
      return { isValid: false, message: 'Cannot select a past date or time. Please choose a future time.' };
    }
    
    // If doctor has a notice period set, enforce it
    if (doctorAvailability?.noticePeriod) {
      const noticePeriodMinutes = doctorAvailability.noticePeriod;
      const minAllowedTime = new Date(now.getTime() + noticePeriodMinutes * 60000);
      
      // Check if the selected time is within the notice period
      if (selectedDate < minAllowedTime) {
        const formattedMinTime = minAllowedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return { 
          isValid: false, 
          message: `Appointments require a ${noticePeriodMinutes}-minute notice. Earliest available time is ${formattedMinTime}.`
        };
      }
    }
    
    // If no notice period is set, any future time is allowed
    
    // Check if the selected time is within working hours
    if (!doctorAvailability?.workingDays) {
      return { isValid: false, message: 'Doctor availability not found. Please try again later.' };
    }
    
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const selectedTime = selectedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const workingDay = doctorAvailability.workingDays.find((day: any) => day.day === dayOfWeek);
    if (!workingDay?.slots?.length) {
      return { isValid: false, message: 'Doctor is not available on this day. Please choose a different day.' };
    }
    
    const isAvailable = workingDay.slots.some((slot: any) => {
      if (!slot.isAvailable) return false;
      
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      
      const [selectedHour, selectedMinute] = selectedTime.split(':').map(Number);
      const selectedTimeInMinutes = selectedHour * 60 + selectedMinute;
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;
      
      return selectedTimeInMinutes >= startTimeInMinutes && selectedTimeInMinutes < endTimeInMinutes;
    });
    
    if (!isAvailable) {
      return { isValid: false, message: 'The doctor is not available at the selected time. Please choose a different time.' };
    }
    
    return { isValid: true };
  };
  
  // Helper function to check if time slot is available (for UI indicators)
  const isTimeSlotAvailable = (selectedDate: Date) => {
    const result = validateTimeSlot(selectedDate);
    return result.isValid;
  };

  const handleSubmit = async () => {
    if (!canSubmit || !doctorId || !token) return;

    // Validate the selected time slot
    const validation = validateTimeSlot(appointmentDate);
    if (!validation.isValid) {
      setAvailabilityError(validation.message || 'The selected time is not available. Please choose a different time.');
      return;
    }

    try {
      setSubmitting(true);
      setAvailabilityError(null);

      // If user opted to share profile, do it before booking
      if (shareProfileWithDoctor) {
        try {
          const res = await shareProfile(token);
          if (!res?.success) {
            showToast('Profile sharing failed, but continuing with booking', 'warning');
          }
        } catch (err) {
          console.log('Profile share during booking failed:', err);
          showToast('Profile sharing failed, but continuing with booking', 'warning');
        }
      }

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
            <Text className="text-xs text-gray-600 mb-1 font-sans">Appointment Type <Text className="text-red-500">*</Text></Text>
            <View className="flex-row gap-2">
              {(['virtual', 'in-person', 'home'] as AppointmentType[]).map((t) => (
                <TouchableOpacity key={t} onPress={() => setAppointmentType(t)} className={`px-3 py-2 rounded-xl ${appointmentType === t ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                  <Text className={`text-xs font-sans ${appointmentType === t ? 'text-emerald-700' : 'text-gray-700'}`}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1 font-sans">Date & Time <Text className="text-red-500">*</Text></Text>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'android') {
                  DateTimePickerAndroid.open({
                    value: appointmentDate,
                    mode: 'date',
                    minimumDate: new Date(),
                    onChange: (_e, d) => {
                      if (d) {
                        const currentDate = new Date(appointmentDate);
                        const now = new Date();
                        if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
                          currentDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
                          DateTimePickerAndroid.open({
                            value: currentDate,
                            mode: 'time',
                            minimumDate: new Date(),
                            onChange: (_e2, timeVal) => {
                              if (timeVal) {
                                const now = new Date();
                                const selectedDateTime = new Date(currentDate);
                                selectedDateTime.setHours(timeVal.getHours(), timeVal.getMinutes(), 0, 0);
                                
                                if (selectedDateTime <= now) {
                                  setAvailabilityError('Cannot select a time that has already passed. Please choose a future time.');
                                } else {
                                  setAppointmentDate(selectedDateTime);
                                  setAvailabilityError(null);
                                }
                              }
                            },
                          });
                        }
                      }
                    },
                  });
                } else {
                  setShowDatePicker(true);
                }
              }}
              className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 font-sans"
            >
              <View className="flex-row justify-between items-center">
              <Text className="text-sm text-gray-800 font-sans">{formatDate(appointmentDate, 'd MMMM yyyy h:mma')}</Text>
              {doctorAvailability && (
                <View className="flex-row items-center">
                  <View className={`w-2 h-2 rounded-full mr-1 ${isTimeSlotAvailable(appointmentDate) ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <Text className="text-xs text-gray-500">
                    {isTimeSlotAvailable(appointmentDate) ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              )}
            </View>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showDatePicker && (
              <DateTimePicker
                value={appointmentDate}
                mode="datetime"
                minimumDate={new Date()}
                display={Platform.select({ ios: 'inline', android: 'default' })}
                onChange={(_, d) => {
                  setShowDatePicker(false);
                  if (d) {
                    const now = new Date();
                    if (d <= now) {
                      setAvailabilityError('Cannot select a time that has already passed. Please choose a future time.');
                    } else {
                      setAppointmentDate(d);
                      setAvailabilityError(null);
                    }
                  }
                }}
              />
            )}
            {availabilityError && (
              <Text className="text-red-500 text-xs mt-1 font-sans">{availabilityError}</Text>
            )}
          </View>
        </View>

        {/* Section: Patient Info */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-sans-semibold text-gray-900 mb-3">Patient Information</Text>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1 font-sans">Full Name <Text className="text-red-500">*</Text></Text>
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
            <Text className="text-xs text-gray-600 mb-1 font-sans">Gender <Text className="text-red-500">*</Text></Text>
            <View className="flex-row gap-2">
              {(['Male', 'Female', 'Other'] as const).map(g => (
                <TouchableOpacity key={g} onPress={() => setGender(g)} className={`px-3 py-2 rounded-xl ${gender === g ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                  <Text className={`text-xs font-sans ${gender === g ? 'text-emerald-700' : 'text-gray-700'}`}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Phone <Text className="text-red-500">*</Text></Text>
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
            <Text className="text-xs text-gray-600 font-sans mb-1">Reason for Appointment <Text className="text-red-500">*</Text></Text>
            <TextInput value={reasonForAppointment} onChangeText={setReasonForAppointment} placeholder="Chief complaint" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 font-sans mb-1">Current Symptoms <Text className="text-red-500">*</Text></Text>
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

        {/* Section: Declarations */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-sans-semibold text-gray-900 mb-3">Declarations</Text>
          
          <TouchableOpacity onPress={() => setIsAccurate((v) => !v)} className="flex-row items-start gap-3 mb-3">
            <View className={`w-5 h-5 rounded border ${isAccurate ? 'bg-emerald-500 border-emerald-600' : 'border-gray-300'}`} >
              {isAccurate && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text className="text-sm font-sans text-gray-700 flex-1">I confirm that the information provided is accurate to the best of my knowledge. <Text className="text-red-500">*</Text></Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setConsentToShare((v) => !v)} className="flex-row items-start gap-3 mb-3">
            <View className={`w-5 h-5 rounded border ${consentToShare ? 'bg-emerald-500 border-emerald-600' : 'border-gray-300'}`}>
              {consentToShare && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text className="text-sm font-sans text-gray-700 flex-1">I consent to ZydaCare sharing this information securely with the attending doctor. <Text className="text-red-500">*</Text></Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShareProfileWithDoctor((v) => !v)} className="flex-row items-start gap-3">
            <View className={`w-5 h-5 rounded border ${shareProfileWithDoctor ? 'bg-emerald-500 border-emerald-600' : 'border-gray-300'}`}>
              {shareProfileWithDoctor && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans text-gray-700">
                <Text className="font-sans-medium">(Optional)</Text> Share my complete health profile with doctors I book appointments with. This gives them access to my full medical history and records for better care. I can turn this off anytime from my Health Profile screen.
              </Text>
            </View>
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