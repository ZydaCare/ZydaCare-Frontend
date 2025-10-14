import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
// Removed external browser usage; we navigate to an in-app WebView screen
import { format as formatDate } from 'date-fns';

import { useAuth } from '@/context/authContext';
import { AppointmentType, createBooking } from '@/api/patient/appointments';
import { getDoctorDetails } from '@/api/patient/user';
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

  const [submitting, setSubmitting] = useState(false);
  const [showDOBPicker, setShowDOBPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fees fetched from doctor details
  const [fees, setFees] = useState<{ inPerson?: number; video?: number; homeVisit?: number } | null>(null);
  const [loadingFees, setLoadingFees] = useState<boolean>(false);

  // Android helper: open date then time to compose a single Date
  const openAndroidDateTime = () => {
    // Step 1: pick date
    DateTimePickerAndroid.open({
      value: appointmentDate,
      mode: 'date',
      onChange: (_e, dateVal) => {
        if (!dateVal) return;
        const temp = new Date(appointmentDate);
        temp.setFullYear(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate());
        // Step 2: pick time
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
  };

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


  // Fetch doctor's consultation fees
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

  // Compute payable amount based on appointment type
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

  const handleSubmit = async () => {
    if (!canSubmit || !doctorId || !token) return;

    try {
      setSubmitting(true);
      // 1) Create booking
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
      const booking = bookingRes.data || bookingRes;

      // 2) Navigate to Appointments tab
      router.replace('/(patient)/(tabs)/appointment');
    } catch (err: any) {
      alert(err?.message || 'Booking failed');
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
            <Text className="text-xs text-gray-600 mb-1">Appointment Type</Text>
            <View className="flex-row gap-2">
              {(['virtual', 'in-person', 'home'] as AppointmentType[]).map((t) => (
                <TouchableOpacity key={t} onPress={() => setAppointmentType(t)} className={`px-3 py-2 rounded-xl ${appointmentType === t ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                  <Text className={`text-xs ${appointmentType === t ? 'text-emerald-700' : 'text-gray-700'}`}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* <View className="mt-2">
              {loadingFees ? (
                <Text className="text-xs text-gray-500">Loading consultation fee...</Text>
              ) : amount > 0 ? (
                <Text className="text-xs font-sans-semibold" style={{ color: PRIMARY }}>
                  Fee: ₦{amount.toLocaleString()}
                </Text>
              ) : (
                <Text className="text-xs text-amber-600">Fee not available for this type. Please pick another type.</Text>
              )}
            </View> */}
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Date & Time</Text>
            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'android') {
                  // Step 1: pick date, then time; combine into a single Date
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
              className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50"
            >
              <Text className="text-sm text-gray-800">{formatDate(appointmentDate, 'd MMMM yyyy h:mma')}</Text>
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
            <Text className="text-xs text-gray-600 mb-1">Full Name</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Your full name" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Date of Birth</Text>
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
              className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50"
            >
              <Text className="text-sm text-gray-800">{dateOfBirth ? dateOfBirth.toDateString() : 'Select date of birth'}</Text>
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
            <Text className="text-xs text-gray-600 mb-1">Age</Text>
            <TextInput keyboardType="number-pad" value={age} onChangeText={setAge} placeholder="Age (optional)" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Gender</Text>
            <View className="flex-row gap-2">
              {(['Male', 'Female', 'Other'] as const).map(g => (
                <TouchableOpacity key={g} onPress={() => setGender(g)} className={`px-3 py-2 rounded-xl ${gender === g ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                  <Text className={`text-xs ${gender === g ? 'text-emerald-700' : 'text-gray-700'}`}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Phone</Text>
            <TextInput keyboardType="phone-pad" value={contactPhone} onChangeText={setContactPhone} placeholder="Phone number" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50" />
          </View>

          <View className="mb-2">
            <Text className="text-xs text-gray-600 mb-1">Email</Text>
            <TextInput keyboardType="email-address" value={contactEmail} onChangeText={setContactEmail} placeholder="Email address" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50" />
          </View>
        </View>

        {/* Section: Medical Context */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-sans-semibold text-gray-900 mb-3">Medical Context</Text>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Reason for Appointment</Text>
            <TextInput value={reasonForAppointment} onChangeText={setReasonForAppointment} placeholder="Chief complaint" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Current Symptoms</Text>
            <TextInput multiline value={currentSymptoms} onChangeText={setCurrentSymptoms} placeholder="Short description" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Relevant Medical History</Text>
            <TextInput multiline value={medicalHistory} onChangeText={setMedicalHistory} placeholder="E.g., diabetes, hypertension, surgeries" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Current Medications</Text>
            <TextInput multiline value={currentMedications} onChangeText={setCurrentMedications} placeholder="If any" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Allergies</Text>
            <TextInput multiline value={allergies} onChangeText={setAllergies} placeholder="Drug, food, environmental" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View className="mb-3">
            <Text className="text-xs text-gray-600 mb-1">Previous Consultations (if relevant)</Text>
            <TextInput multiline value={previousConsultations} onChangeText={setPreviousConsultations} placeholder="Optional" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50 min-h-12" />
          </View>

          <View>
            <Text className="text-xs text-gray-600 mb-1">Preferred Doctor / Specialty (optional)</Text>
            <TextInput value={preferredDoctorOrSpecialty} onChangeText={setPreferredDoctorOrSpecialty} placeholder="Optional" className="border border-gray-200 rounded-xl px-3 py-3 bg-gray-50" />
          </View>
        </View>

        {/* Section: Declarations */}
        <View className="bg-white mx-4 mt-4 rounded-2xl p-5 shadow-sm">
          <Text className="text-base font-sans-semibold text-gray-900 mb-3">Declarations</Text>
          <TouchableOpacity onPress={() => setIsAccurate((v) => !v)} className="flex-row items-start gap-3 mb-3">
            <View className={`w-5 h-5 rounded border ${isAccurate ? 'bg-emerald-500 border-emerald-600' : 'border-gray-300'}`} />
            <Text className="text-sm text-gray-700 flex-1">I confirm that the information provided is accurate to the best of my knowledge.</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setConsentToShare((v) => !v)} className="flex-row items-start gap-3">
            <View className={`w-5 h-5 rounded border ${consentToShare ? 'bg-emerald-500 border-emerald-600' : 'border-gray-300'}`} />
            <Text className="text-sm text-gray-700 flex-1">I consent to ZydaCare sharing this information securely with the attending doctor.</Text>
          </TouchableOpacity>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-4 py-4 border-t border-gray-100">
        <TouchableOpacity disabled={!canSubmit || submitting} onPress={handleSubmit} className="py-3.5 rounded-xl items-center justify-center" style={{ backgroundColor: canSubmit ? '#67A9AF' : '#9CA3AF' }}>
          <Text className="text-white font-sans-semibold">{submitting ? 'Processing...' : `₦${amount.toLocaleString()} Book Appointment`}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
