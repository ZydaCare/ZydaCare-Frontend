import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { getPatientDetails, PatientDetails } from '@/api/doctor/appointments';
import { useToast } from '@/components/ui/Toast';

export default function PatientDetailScreen() {
  const { id } = useLocalSearchParams();
  const [patient, setPatient] = useState<PatientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'appointments'>('overview');
  const { showToast } = useToast();

  useEffect(() => {
    if (id) {
      fetchPatientDetails();
    }
  }, [id]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const response = await getPatientDetails(id as string);
      if (response.success) {
        setPatient(response.data);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
      showToast('Failed to load patient details', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#67A9AF" />
          <Text className="text-gray-500 font-sans mt-4">Loading patient data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-lg font-sans-bold text-gray-900 mt-4">
            Patient not found
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

  const fullName = `${patient.firstName} ${patient.lastName}`;

  const renderOverviewTab = () => (
    <View>
      {/* Contact Info */}
      <View className="bg-white mx-6 mb-4 rounded-2xl p-4 shadow-sm" style={{ elevation: 2 }}>
        <Text className="text-sm font-sans-bold text-gray-500 uppercase mb-3">
          Contact Information
        </Text>
        <View className="space-y-3">
          <View className="flex-row items-center py-2">
            <Ionicons name="call-outline" size={18} color="#67A9AF" />
            <Text className="text-sm font-sans text-gray-700 ml-3">{patient.phone}</Text>
          </View>
          <View className="flex-row items-center py-2">
            <Ionicons name="mail-outline" size={18} color="#67A9AF" />
            <Text className="text-sm font-sans text-gray-700 ml-3">{patient.email}</Text>
          </View>
          {patient.address && (
            <View className="flex-row items-start py-2">
              <Ionicons name="location-outline" size={18} color="#67A9AF" />
              <Text className="text-sm font-sans text-gray-700 ml-3 flex-1">
                {patient.address}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Health Profile */}
      {patient.shareProfile && patient.healthProfile ? (
        <View className="bg-white mx-6 mb-4 rounded-2xl p-4 shadow-sm" style={{ elevation: 2 }}>
          <Text className="text-sm font-sans-bold text-gray-500 uppercase mb-3">
            Health Profile
          </Text>
          <View className="flex-row flex-wrap">
            {patient.healthProfile.bloodPressure && (
              <View className="w-1/2 mb-4">
                <Text className="text-xs font-sans-medium text-gray-500">Blood Pressure</Text>
                <Text className="text-base font-sans-bold text-gray-900 mt-1">
                  {patient.healthProfile.bloodPressure.systolic}/
                  {patient.healthProfile.bloodPressure.diastolic} mmHg
                </Text>
              </View>
            )}
            {patient.healthProfile.bmi && (
              <View className="w-1/2 mb-4">
                <Text className="text-xs font-sans-medium text-gray-500">BMI</Text>
                <Text className="text-base font-sans-bold text-gray-900 mt-1">
                  {patient.healthProfile.bmi.value} ({patient.healthProfile.bmi.category})
                </Text>
              </View>
            )}
            {patient.healthProfile.height && (
              <View className="w-1/2 mb-4">
                <Text className="text-xs font-sans-medium text-gray-500">Height</Text>
                <Text className="text-base font-sans-bold text-gray-900 mt-1">
                  {patient.healthProfile.height.value} {patient.healthProfile.height.unit}
                </Text>
              </View>
            )}
            {patient.healthProfile.weight && (
              <View className="w-1/2 mb-4">
                <Text className="text-xs font-sans-medium text-gray-500">Weight</Text>
                <Text className="text-base font-sans-bold text-gray-900 mt-1">
                  {patient.healthProfile.weight.value} {patient.healthProfile.weight.unit}
                </Text>
              </View>
            )}
          </View>

          {patient.healthProfile.conditions && patient.healthProfile.conditions.length > 0 && (
            <View className="mt-2 pt-4 border-t border-gray-100">
              <Text className="text-xs font-sans-bold text-gray-500 uppercase mb-2">
                Current Conditions
              </Text>
              {patient.healthProfile.conditions.map((condition, index) => (
                <View
                  key={index}
                  className="bg-amber-50 p-3 rounded-xl mb-2 flex-row items-center justify-between"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-sans-bold text-gray-900">
                      {condition.name}
                    </Text>
                    {condition.notes && (
                      <Text className="text-xs font-sans text-gray-600 mt-1">
                        {condition.notes}
                      </Text>
                    )}
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${
                      condition.severity === 'severe'
                        ? 'bg-red-100'
                        : condition.severity === 'moderate'
                        ? 'bg-orange-100'
                        : 'bg-yellow-100'
                    }`}
                  >
                    <Text
                      className={`text-xs font-sans-medium ${
                        condition.severity === 'severe'
                          ? 'text-red-600'
                          : condition.severity === 'moderate'
                          ? 'text-orange-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {condition.severity}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        <View className="bg-white mx-6 mb-4 rounded-2xl p-6 shadow-sm items-center" style={{ elevation: 2 }}>
          <Ionicons name="lock-closed-outline" size={40} color="#D1D5DB" />
          <Text className="text-gray-500 font-sans mt-2 text-center">
            Patient has not shared their health profile
          </Text>
        </View>
      )}

      {/* Statistics */}
      <View className="bg-white mx-6 mb-6 rounded-2xl p-4 shadow-sm" style={{ elevation: 2 }}>
        <Text className="text-sm font-sans-bold text-gray-500 uppercase mb-3">
          Appointment Statistics
        </Text>
        <View className="flex-row flex-wrap">
          {Object.entries(patient.stats).map(([status, data]) => (
            <View key={status} className="w-1/2 mb-3">
              <Text className="text-xs font-sans-medium text-gray-500 capitalize">
                {status}
              </Text>
              <Text className="text-lg font-sans-bold text-gray-900 mt-1">
                {data.count} appointments
              </Text>
              <Text className="text-sm font-sans text-[#67A9AF]">
                ₦{data.totalFees.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderHistoryTab = () => (
    <View>
      {patient.shareProfile && patient.medicalHistory && patient.medicalHistory.length > 0 ? (
        <View className="px-6 pb-12">
          {patient.medicalHistory.map((record, index) => (
            <View
              key={index}
              className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
              style={{ elevation: 2 }}
            >
              <View className="flex-row items-start justify-between mb-2">
                <Text className="text-base font-sans-bold text-gray-900 flex-1">
                  {record.condition}
                </Text>
                <View
                  className={`px-2 py-1 rounded-full ${
                    record.severity === 'severe'
                      ? 'bg-red-100'
                      : record.severity === 'moderate'
                      ? 'bg-orange-100'
                      : 'bg-yellow-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-sans-medium ${
                      record.severity === 'severe'
                        ? 'text-red-600'
                        : record.severity === 'moderate'
                        ? 'text-orange-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {record.severity}
                  </Text>
                </View>
              </View>

              {record.diagnosis && (
                <View className="mb-2">
                  <Text className="text-xs font-sans-bold text-gray-500 uppercase">
                    Diagnosis
                  </Text>
                  <Text className="text-sm font-sans text-gray-700 mt-1">
                    {record.diagnosis}
                  </Text>
                </View>
              )}

              {record.treatment && (
                <View className="mb-2">
                  <Text className="text-xs font-sans-bold text-gray-500 uppercase">
                    Treatment
                  </Text>
                  <Text className="text-sm font-sans text-gray-700 mt-1">
                    {record.treatment}
                  </Text>
                </View>
              )}

              {record.notes && (
                <View className="mb-2">
                  <Text className="text-xs font-sans-bold text-gray-500 uppercase">Notes</Text>
                  <Text className="text-sm font-sans text-gray-700 mt-1">{record.notes}</Text>
                </View>
              )}

              <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
                <Ionicons name="calendar-outline" size={14} color="#67A9AF" />
                <Text className="text-xs font-sans-medium text-gray-600 ml-1">
                  {format(parseISO(record.date), 'MMM dd, yyyy')}
                </Text>
                <Text className="text-xs font-sans text-gray-400 ml-2">
                  • {record.category}
                </Text>
              </View>

              {record.images && record.images.length > 0 && (
                <View className="mt-3">
                  <Text className="text-xs font-sans-bold text-gray-500 uppercase mb-2">
                    Attachments ({record.images.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row">
                      {record.images.map((img: any, imgIndex: number) => (
                        <TouchableOpacity
                          key={imgIndex}
                          className="w-20 h-20 rounded-lg overflow-hidden mr-2"
                        >
                          <Image
                            source={{ uri: img.url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : (
        <View className="bg-white mx-6 rounded-2xl p-6 shadow-sm items-center" style={{ elevation: 2 }}>
          <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
          <Text className="text-gray-500 font-sans mt-2 text-center">
            {patient.shareProfile
              ? 'No medical history available'
              : 'Patient has not shared their medical history'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderAppointmentsTab = () => (
    <View className="px-6 pb-12">
      {patient.appointments.list.length > 0 ? (
        patient.appointments.list.map((appointment) => (
          <TouchableOpacity
            key={appointment._id}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
            style={{ elevation: 2 }}
            onPress={() =>
              router.push({
                pathname: '/(doctor)/(pages)/appointment/[id]',
                params: { id: appointment._id },
              })
            }
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-sans-bold text-gray-900">
                  {format(parseISO(appointment.appointmentDate), 'MMM dd, yyyy')}
                </Text>
                <Text className="text-sm font-sans text-gray-500 mt-1">
                  {format(parseISO(appointment.appointmentDate), 'h:mm a')}
                </Text>
              </View>
              <View
                className={`px-3 py-1 rounded-full ${
                  appointment.status === 'paid' || appointment.status === 'confirmed'
                    ? 'bg-green-100'
                    : appointment.status === 'completed'
                    ? 'bg-blue-100'
                    : appointment.status === 'pending'
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
                }`}
              >
                <Text
                  className={`text-xs font-sans-medium ${
                    appointment.status === 'paid' || appointment.status === 'confirmed'
                      ? 'text-green-600'
                      : appointment.status === 'completed'
                      ? 'text-blue-600'
                      : appointment.status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {appointment.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View className="bg-white rounded-2xl p-6 shadow-sm items-center" style={{ elevation: 2 }}>
          <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
          <Text className="text-gray-500 font-sans mt-2 text-center">
            No appointments found
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-100">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-gray-900 flex-1">Patient Details</Text>
        </View>

        {/* Patient Header Card */}
        <View className="flex-row items-center">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
            {patient.profileImage?.url ? (
              <Image
                source={{ uri: patient.profileImage.url }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={40} color="#9CA3AF" />
            )}
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-xl font-sans-bold text-gray-900">{fullName}</Text>
            <Text className="text-sm font-sans text-gray-500 mt-1">
              {patient.appointments.total} total appointments
            </Text>
            <View className="flex-row items-center mt-1">
              {patient.shareProfile ? (
                <View className="bg-green-50 px-2 py-1 rounded-full">
                  <Text className="text-xs font-sans-medium text-green-600">
                    Profile Shared
                  </Text>
                </View>
              ) : (
                <View className="bg-gray-100 px-2 py-1 rounded-full">
                  <Text className="text-xs font-sans-medium text-gray-600">
                    Profile Private
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white px-6 py-3 flex-row border-b border-gray-100">
        {[
          { key: 'overview', label: 'Overview', icon: 'person-outline' },
          { key: 'history', label: 'History', icon: 'document-text-outline' },
          { key: 'appointments', label: 'Appointments', icon: 'calendar-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key as any)}
            className={`flex-1 items-center py-2 border-b-2 ${
              activeTab === tab.key ? 'border-[#67A9AF]' : 'border-transparent'
            }`}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={activeTab === tab.key ? '#67A9AF' : '#9CA3AF'}
            />
            <Text
              className={`text-xs font-sans-medium mt-1 ${
                activeTab === tab.key ? 'text-[#67A9AF]' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1 pt-4" showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'appointments' && renderAppointmentsTab()}
      </ScrollView>
    </SafeAreaView>
  );
}