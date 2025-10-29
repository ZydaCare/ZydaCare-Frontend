import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { getPatient, activatePatient, deactivatePatient } from '@/api/admin/patients';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const PatientDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Modal states
  const [activateModalVisible, setActivateModalVisible] = useState(false);
  const [deactivateModalVisible, setDeactivateModalVisible] = useState(false);

  // Form states
  const [deactivateReason, setDeactivateReason] = useState('');

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
    const fetchPatientDetails = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const data = await getPatient(id as string);
        setPatient(data);
      } catch (error) {
        console.error('Error fetching patient details:', error);
        showToast('Failed to load patient details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchPatientDetails();
    }
  }, [id, token]);

  const handleActivate = () => {
    setActivateModalVisible(true);
  };

  const confirmActivate = async () => {
    try {
      await activatePatient(patient?._id);
      showToast('Patient account has been activated', 'success');
      const data = await getPatient(id as string);
      setPatient(data);
      setActivateModalVisible(false);
    } catch (error) {
      showToast('Failed to activate patient account', 'error');
    }
  };

  const handleDeactivate = () => {
    setDeactivateModalVisible(true);
  };

  const confirmDeactivate = async () => {
    if (!deactivateReason.trim()) {
      showToast('Please provide a reason for deactivation', 'warning');
      return;
    }

    try {
      await deactivatePatient(patient?._id, deactivateReason);
      showToast('Patient account has been deactivated', 'success');
      const data = await getPatient(id as string);
      setPatient(data);
      setDeactivateModalVisible(false);
      setDeactivateReason('');
    } catch (error) {
      showToast('Failed to deactivate patient account', 'error');
    }
  };

  const renderStatusBadge = (isActive: boolean) => {
    const statusConfig = isActive
      ? { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' }
      : { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };

    return (
      <View className={`px-4 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border}`}>
        <Text className={`text-xs font-sans-semibold uppercase tracking-wide ${statusConfig.text}`}>
          {isActive ? 'Active' : 'Inactive'}
        </Text>
      </View>
    );
  };

  const renderKycStatus = (status: string) => {
    const statusConfig = {
      approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Verified' },
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', label: 'Pending' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Rejected' },
      not_submitted: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', label: 'Not Submitted' }
    }[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300', label: 'Unknown' };

    return (
      <View className={`px-4 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border}`}>
        <Text className={`text-xs font-sans-semibold uppercase tracking-wide ${statusConfig.text}`}>
          {statusConfig.label}
        </Text>
      </View>
    );
  };

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <View className="flex-row items-center mb-4 pb-3 border-b border-gray-200">
      <View className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center mr-3">
        <Ionicons name={icon as any} size={18} color="#67A9AF" />
      </View>
      <Text className="text-lg font-sans-bold text-gray-900">{title}</Text>
    </View>
  );

  const InfoRow = ({ label, value, icon }: { label: string; value?: string; icon?: string }) => {
    if (!value) return null;
    return (
      <View className="flex-row py-3 border-b border-gray-100">
        {icon && (
          <View className="w-10 items-center">
            <Ionicons name={icon as any} size={16} color="#9CA3AF" />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-xs font-sans-medium text-gray-500 mb-1">{label}</Text>
          <Text className="text-sm font-sans-medium text-gray-900">{value}</Text>
        </View>
      </View>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateBMI = () => {
    if (!patient?.healthProfile?.weight?.value || !patient?.healthProfile?.height?.value) return null;
    const weight = patient.healthProfile.weight.value;
    const height = patient.healthProfile.height.value / 100;
    return (weight / (height * height)).toFixed(1);
  };

  if (loading || !patient) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#67A9AF" />
        <Text className="text-gray-600 font-sans-medium mt-4">Loading patient details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 p-2 -ml-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-xl font-sans-bold text-gray-900">Patient Profile</Text>
              <Text className="text-xs font-sans text-gray-500 mt-0.5">ID: {patient._id}</Text>
            </View>
          </View>
          {/* <TouchableOpacity
            onPress={() => router.push(`/(admin)/(patient)/edit/${patient._id}`)}
            className="bg-primary rounded-lg px-4 py-2"
          >
            <Text className="text-white font-sans-semibold text-sm">Edit</Text>
          </TouchableOpacity> */}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <View className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 pt-6 pb-4">
            <View className="flex-row">
              <View className="w-24 h-24 rounded-2xl bg-white shadow-md items-center justify-center overflow-hidden border-2 border-white">
                {patient.profileImage?.url ? (
                  <Image
                    source={{ uri: patient.profileImage.url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-gray-100 items-center justify-center">
                    <Ionicons name="person" size={40} color="#67A9AF" />
                  </View>
                )}
              </View>

              <View className="flex-1 ml-4 justify-center">
                <View className="flex-row items-center mb-2">
                  <Text className="text-xl font-sans-bold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </Text>
                  {patient.isEmailVerified && (
                    <View className="ml-2 bg-blue-100 rounded-full p-1">
                      <MaterialIcons name="verified" size={16} color="#3B82F6" />
                    </View>
                  )}
                </View>
                <Text className="text-sm font-sans-medium text-gray-600 mb-2">
                  Patient ID: {patient._id?.substring(0, 8)}...
                </Text>
                {renderStatusBadge(patient.isActive)}
              </View>
            </View>
          </View>

          <View className="px-6 py-4 bg-gray-50 flex-row items-center justify-around border-t border-gray-100">
            <View className="items-center">
              <Text className="text-xl font-sans-bold text-gray-900">
                {patient.medications?.length || '0'}
              </Text>
              <Text className="text-xs font-sans text-gray-500 mt-1">Medications</Text>
            </View>
            <View className="w-px h-8 bg-gray-300" />
            <View className="items-center">
              <Text className="text-xl font-sans-bold text-gray-900">
                {patient.medicalHistory?.length || '0'}
              </Text>
              <Text className="text-xs font-sans text-gray-500 mt-1">Records</Text>
            </View>
            <View className="w-px h-8 bg-gray-300" />
            <View className="items-center">
              <Text className="text-xl font-sans-bold text-gray-900">
                {patient.healthProfile?.conditions?.length || '0'}
              </Text>
              <Text className="text-xs font-sans text-gray-500 mt-1">Conditions</Text>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon="person-outline" title="Personal Information" />
          <InfoRow label="Full Name" value={`${patient.firstName} ${patient.lastName}`} icon="person" />
          <InfoRow label="Email Address" value={patient.email} icon="mail" />
          <InfoRow label="Phone Number" value={patient.phone} icon="call" />
          <InfoRow label="Date of Birth" value={formatDate(patient.dob)} icon="calendar" />
          <View className="flex-row py-3 border-b border-gray-100">
            <View className="w-10 items-center">
              <Ionicons name="shield-checkmark" size={16} color="#9CA3AF" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-sans-medium text-gray-500 mb-1">Email Verification</Text>
              <View className="flex-row items-center">
                {patient.isEmailVerified ? (
                  <View className="px-3 py-1 rounded-full bg-green-50 border border-green-200">
                    <Text className="text-xs font-sans-semibold text-green-700">VERIFIED</Text>
                  </View>
                ) : (
                  <View className="px-3 py-1 rounded-full bg-gray-50 border border-gray-300">
                    <Text className="text-xs font-sans-semibold text-gray-700">NOT VERIFIED</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View className="flex-row py-3">
            <View className="w-10 items-center">
              <Ionicons name="document-text" size={16} color="#9CA3AF" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-sans-medium text-gray-500 mb-1">KYC Status</Text>
              <View className="flex-row items-center">
                {renderKycStatus(patient.kycStatus || 'not_submitted')}
              </View>
            </View>
          </View>
        </View>

        {/* Address Information */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon="location-outline" title="Address Information" />
          <InfoRow label="Street Address" value={patient.address} />
          <InfoRow label="City" value={patient.city} />
          <InfoRow label="State/Province" value={patient.state} />
          <InfoRow label="Country" value={patient.country} />
          <InfoRow label="Postal Code" value={patient.zipCode} />
        </View>

        {/* Health Metrics */}
        {patient.healthProfile && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="fitness-outline" title="Health Metrics" />

            <View className="flex-row flex-wrap -mx-2">
              {patient.healthProfile.bloodPressure && (
                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-red-50 rounded-lg p-4">
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center">
                        <Ionicons name="pulse" size={16} color="#EF4444" />
                      </View>
                      <Text className="text-xs font-sans-medium text-gray-600 ml-2">Blood Pressure</Text>
                    </View>
                    <Text className="text-xl font-sans-bold text-gray-900">
                      {patient.healthProfile.bloodPressure.systolic || '--'}/
                      {patient.healthProfile.bloodPressure.diastolic || '--'}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500">mmHg</Text>
                  </View>
                </View>
              )}

              {patient.healthProfile.pulseRate && (
                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-pink-50 rounded-lg p-4">
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 rounded-full bg-pink-100 items-center justify-center">
                        <Ionicons name="heart" size={16} color="#EC4899" />
                      </View>
                      <Text className="text-xs font-sans-medium text-gray-600 ml-2">Heart Rate</Text>
                    </View>
                    <Text className="text-xl font-sans-bold text-gray-900">
                      {patient.healthProfile.pulseRate.value || '--'}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500">bpm</Text>
                  </View>
                </View>
              )}

              {patient.healthProfile.weight && (
                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-blue-50 rounded-lg p-4">
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                        <Ionicons name="speedometer" size={16} color="#3B82F6" />
                      </View>
                      <Text className="text-xs font-sans-medium text-gray-600 ml-2">Weight</Text>
                    </View>
                    <Text className="text-xl font-sans-bold text-gray-900">
                      {patient.healthProfile.weight.value || '--'}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500">
                      {patient.healthProfile.weight.unit || 'kg'}
                    </Text>
                  </View>
                </View>
              )}

              {patient.healthProfile.height && (
                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-green-50 rounded-lg p-4">
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
                        <Ionicons name="resize" size={16} color="#10B981" />
                      </View>
                      <Text className="text-xs font-sans-medium text-gray-600 ml-2">Height</Text>
                    </View>
                    <Text className="text-xl font-sans-bold text-gray-900">
                      {patient.healthProfile.height.value || '--'}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500">
                      {patient.healthProfile.height.unit || 'cm'}
                    </Text>
                  </View>
                </View>
              )}

              {patient.healthProfile.temperature && (
                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-orange-50 rounded-lg p-4">
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center">
                        <Ionicons name="thermometer" size={16} color="#F97316" />
                      </View>
                      <Text className="text-xs font-sans-medium text-gray-600 ml-2">Temperature</Text>
                    </View>
                    <Text className="text-xl font-sans-bold text-gray-900">
                      {patient.healthProfile.temperature.value || '--'}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500">
                      °{patient.healthProfile.temperature.unit || 'C'}
                    </Text>
                  </View>
                </View>
              )}

              {patient.healthProfile.bloodOxygen && (
                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-purple-50 rounded-lg p-4">
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center">
                        <Ionicons name="water" size={16} color="#9333EA" />
                      </View>
                      <Text className="text-xs font-sans-medium text-gray-600 ml-2">Blood Oxygen</Text>
                    </View>
                    <Text className="text-xl font-sans-bold text-gray-900">
                      {patient.healthProfile.bloodOxygen.value || '--'}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500">%</Text>
                  </View>
                </View>
              )}

              {calculateBMI() && (
                <View className="w-1/2 px-2 mb-4">
                  <View className="bg-indigo-50 rounded-lg p-4">
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center">
                        <Ionicons name="analytics" size={16} color="#6366F1" />
                      </View>
                      <Text className="text-xs font-sans-medium text-gray-600 ml-2">BMI</Text>
                    </View>
                    <Text className="text-xl font-sans-bold text-gray-900">
                      {calculateBMI()}
                    </Text>
                    <Text className="text-xs font-sans text-gray-500 capitalize">
                      {patient.healthProfile.bmi?.category || 'N/A'}
                    </Text>
                  </View>
                </View>
              )}

              {patient.healthProfile.visualAcuity && (
                <View className="w-full px-2">
                  <View className="bg-teal-50 rounded-lg p-4">
                    <View className="flex-row items-center mb-3">
                      <View className="w-8 h-8 rounded-full bg-teal-100 items-center justify-center">
                        <Ionicons name="eye" size={16} color="#14B8A6" />
                      </View>
                      <Text className="text-xs font-sans-medium text-gray-600 ml-2">Visual Acuity</Text>
                    </View>
                    <View className="flex-row justify-between">
                      <View>
                        <Text className="text-sm font-sans text-gray-600 mb-1">Left Eye</Text>
                        <Text className="text-lg font-sans-bold text-gray-900">
                          {patient.healthProfile.visualAcuity.leftEye || '--'}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-sm font-sans text-gray-600 mb-1">Right Eye</Text>
                        <Text className="text-lg font-sans-bold text-gray-900">
                          {patient.healthProfile.visualAcuity.rightEye || '--'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Medical Conditions */}
        {patient.healthProfile?.conditions && patient.healthProfile.conditions.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="medical-outline" title="Medical Conditions" />
            {patient.healthProfile.conditions.map((condition: any, index: number) => (
              <View key={index} className={`pb-4 mb-4 ${index < patient.healthProfile.conditions.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-sm font-sans-bold text-gray-900 flex-1">{condition.name}</Text>
                  <View className={`px-3 py-1 rounded-full ml-2 ${condition.severity === 'severe' ? 'bg-red-100' :
                    condition.severity === 'moderate' ? 'bg-yellow-100' :
                      'bg-green-100'
                    }`}>
                    <Text className={`text-xs font-sans-semibold ${condition.severity === 'severe' ? 'text-red-700' :
                      condition.severity === 'moderate' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                      {condition.severity ? condition.severity.charAt(0).toUpperCase() + condition.severity.slice(1) : 'N/A'}
                    </Text>
                  </View>
                </View>
                {condition.diagnosisDate && (
                  <Text className="text-xs font-sans text-gray-500 mb-1">
                    Diagnosed: {formatDate(condition.diagnosisDate)}
                  </Text>
                )}
                {condition.notes && (
                  <Text className="text-sm font-sans text-gray-700 mt-2">{condition.notes}</Text>
                )}
                <View className="flex-row items-center mt-2">
                  <View className={`w-2 h-2 rounded-full mr-2 ${condition.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <Text className="text-xs font-sans text-gray-600">
                    {condition.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Medications */}
        {patient.medications && patient.medications.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="medical-outline" title="Current Medications" />
            {patient.medications.map((med: any, index: number) => (
              <View key={index} className={`pb-4 mb-4 ${index < patient.medications.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-sm font-sans-bold text-gray-900 flex-1">{med.drugName}</Text>
                  <View className={`px-3 py-1 rounded-full ml-2 ${med.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Text className={`text-xs font-sans-semibold ${med.enabled ? 'text-green-700' : 'text-gray-600'}`}>
                      {med.enabled ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-lg p-3 mt-2">
                  <View className="flex-row mb-2">
                    <Text className="text-xs font-sans-medium text-gray-500 w-24">Dosage:</Text>
                    <Text className="text-xs font-sans text-gray-900 flex-1">{med.dosage}</Text>
                  </View>
                  <View className="flex-row mb-2">
                    <Text className="text-xs font-sans-medium text-gray-500 w-24">Frequency:</Text>
                    <Text className="text-xs font-sans text-gray-900 flex-1 capitalize">{med.frequency}</Text>
                  </View>
                  {med.time && (
                    <View className="flex-row mb-2">
                      <Text className="text-xs font-sans-medium text-gray-500 w-24">Time:</Text>
                      <Text className="text-xs font-sans text-gray-900 flex-1">{med.time}</Text>
                    </View>
                  )}
                  {med.timesPerDay && med.timesPerDay.length > 0 && (
                    <View className="flex-row mb-2">
                      <Text className="text-xs font-sans-medium text-gray-500 w-24">When:</Text>
                      <View className="flex-1 flex-row flex-wrap">
                        {med.timesPerDay.map((time: string, idx: number) => (
                          <View key={idx} className="bg-primary/10 rounded px-2 py-0.5 mr-1 mb-1">
                            <Text className="text-xs font-sans text-primary capitalize">{time}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  {med.specificDays && med.specificDays.length > 0 && (
                    <View className="flex-row">
                      <Text className="text-xs font-sans-medium text-gray-500 w-24">Days:</Text>
                      <View className="flex-1 flex-row flex-wrap">
                        {med.specificDays.map((day: string, idx: number) => (
                          <View key={idx} className="bg-blue-50 rounded px-2 py-0.5 mr-1 mb-1">
                            <Text className="text-xs font-sans text-blue-700 capitalize">{day}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {med.notes && (
                  <View className="mt-2 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <Text className="text-xs font-sans-semibold text-yellow-800 mb-1">NOTES</Text>
                    <Text className="text-xs font-sans text-yellow-900">{med.notes}</Text>
                  </View>
                )}

                {med.lastTaken && (
                  <Text className="text-xs font-sans text-gray-500 mt-2">
                    Last taken: {formatDate(med.lastTaken)}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Medical History */}
        {patient.medicalHistory && patient.medicalHistory.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="document-text-outline" title="Medical History" />
            {patient.medicalHistory.map((record: any, index: number) => (
              <View key={index} className={`pb-4 mb-4 ${index < patient.medicalHistory.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-sm font-sans-bold text-gray-900 flex-1">{record.condition}</Text>
                  <View className={`px-3 py-1 rounded-full ml-2 ${record.category === 'chronic' ? 'bg-orange-100' : 'bg-blue-100'
                    }`}>
                    <Text className={`text-xs font-sans-semibold ${record.category === 'chronic' ? 'text-orange-700' : 'text-blue-700'
                      }`}>
                      {record.category ? record.category.charAt(0).toUpperCase() + record.category.slice(1) : 'N/A'}
                    </Text>
                  </View>
                </View>

                <Text className="text-xs font-sans text-gray-500 mb-2">
                  Date: {formatDate(record.date)}
                </Text>

                <View className="bg-gray-50 rounded-lg p-3">
                  {record.diagnosis && (
                    <View className="mb-2">
                      <Text className="text-xs font-sans-semibold text-gray-600 mb-1">Diagnosis:</Text>
                      <Text className="text-xs font-sans text-gray-900">{record.diagnosis}</Text>
                    </View>
                  )}
                  {record.treatment && (
                    <View className="mb-2">
                      <Text className="text-xs font-sans-semibold text-gray-600 mb-1">Treatment:</Text>
                      <Text className="text-xs font-sans text-gray-900">{record.treatment}</Text>
                    </View>
                  )}
                  {record.notes && (
                    <View>
                      <Text className="text-xs font-sans-semibold text-gray-600 mb-1">Notes:</Text>
                      <Text className="text-xs font-sans text-gray-900">{record.notes}</Text>
                    </View>
                  )}
                </View>

                {record.severity && (
                  <View className="flex-row items-center mt-2">
                    <Text className="text-xs font-sans text-gray-500 mr-2">Severity:</Text>
                    <View className={`px-2 py-0.5 rounded ${record.severity === 'severe' ? 'bg-red-100' :
                      record.severity === 'moderate' ? 'bg-yellow-100' :
                        'bg-green-100'
                      }`}>
                      <Text className={`text-xs font-sans-semibold ${record.severity === 'severe' ? 'text-red-700' :
                        record.severity === 'moderate' ? 'text-yellow-700' :
                          'text-green-700'
                        }`}>
                        {record.severity.charAt(0).toUpperCase() + record.severity.slice(1)}
                      </Text>
                    </View>
                  </View>
                )}

                {record.images && record.images.length > 0 && (
                  <View className="mt-3">
                    <Text className="text-xs font-sans-semibold text-gray-600 mb-2">Attachments:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {record.images.map((img: any, imgIndex: number) => (
                        <TouchableOpacity
                          key={imgIndex}
                          className="w-20 h-20 bg-gray-100 rounded-lg mr-2 overflow-hidden"
                        >
                          <Image
                            source={{ uri: img.url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* KYC Documents */}
        {patient.kycDocuments && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="document-attach-outline" title="KYC Documents" />

            <View className="mb-3">
              <Text className="text-xs font-sans-medium text-gray-500 mb-1">Document Type</Text>
              <Text className="text-sm font-sans-semibold text-gray-900 capitalize">
                {patient.kycDocuments.documentType?.replace('_', ' ') || 'N/A'}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-xs font-sans-medium text-gray-500 mb-1">Document Number</Text>
              <Text className="text-sm font-sans-semibold text-gray-900">
                {patient.kycDocuments.documentNumber || 'N/A'}
              </Text>
            </View>

            {patient.kycDocuments.documentImage?.url && (
              <View className="bg-gray-50 rounded-lg p-4 mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-sans-semibold text-gray-900 mb-1">ID Document</Text>
                    <Text className="text-xs font-sans text-gray-500" numberOfLines={1}>
                      {patient.kycDocuments.documentImage.url}
                    </Text>
                  </View>
                  <View className="ml-3">
                    <TouchableOpacity className="bg-primary rounded-lg px-3 py-2">
                      <Text className="text-white font-sans-semibold text-xs">View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {patient.kycDocuments.selfieImage?.url && (
              <View className="bg-gray-50 rounded-lg p-4 mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-sans-semibold text-gray-900 mb-1">Selfie Photo</Text>
                    <Text className="text-xs font-sans text-gray-500" numberOfLines={1}>
                      {patient.kycDocuments.selfieImage.url}
                    </Text>
                  </View>
                  <View className="ml-3">
                    <TouchableOpacity className="bg-primary rounded-lg px-3 py-2">
                      <Text className="text-white font-sans-semibold text-xs">View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {patient.kycDocuments.proofOfAddress?.url && (
              <View className="bg-gray-50 rounded-lg p-4 mb-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-sans-semibold text-gray-900 mb-1">Proof of Address</Text>
                    <Text className="text-xs font-sans text-gray-500" numberOfLines={1}>
                      {patient.kycDocuments.proofOfAddress.url}
                    </Text>
                  </View>
                  <View className="ml-3">
                    <TouchableOpacity className="bg-primary rounded-lg px-3 py-2">
                      <Text className="text-white font-sans-semibold text-xs">View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {patient.kycDocuments.submittedAt && (
              <View className="mt-2 pt-2 border-t border-gray-200">
                <Text className="text-xs font-sans text-gray-500">
                  Submitted: {formatDate(patient.kycDocuments.submittedAt)}
                </Text>
                {patient.kycDocuments.reviewedAt && (
                  <Text className="text-xs font-sans text-gray-500 mt-1">
                    Reviewed: {formatDate(patient.kycDocuments.reviewedAt)}
                  </Text>
                )}
              </View>
            )}

            {patient.kycRejectionReason && (
              <View className="mt-3 bg-red-50 rounded-lg p-4 border border-red-200">
                <Text className="text-xs font-sans-semibold text-red-800 mb-2">REJECTION REASON</Text>
                <Text className="text-xs font-sans text-red-900">{patient.kycRejectionReason}</Text>
              </View>
            )}
          </View>
        )}

        {/* Notification Preferences */}
        {patient.notificationPreferences && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="notifications-outline" title="Notification Preferences" />

            <View className="space-y-3">
              <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-sm font-sans-semibold text-gray-900 mb-1">Medication Reminders</Text>
                  <Text className="text-xs font-sans text-gray-600">
                    {patient.notificationPreferences.medicationReminders?.advanceNotice?.value || 15}{' '}
                    {patient.notificationPreferences.medicationReminders?.advanceNotice?.unit || 'minutes'} advance notice
                  </Text>
                  {patient.notificationPreferences.medicationReminders?.sound && (
                    <Text className="text-xs font-sans text-gray-500 mt-1">
                      Sound: {patient.notificationPreferences.medicationReminders.sound}
                    </Text>
                  )}
                </View>
                <View className={`px-3 py-1 rounded-full ${patient.notificationPreferences.medicationReminders?.enabled
                  ? 'bg-green-100'
                  : 'bg-gray-100'
                  }`}>
                  <Text className={`text-xs font-sans-semibold ${patient.notificationPreferences.medicationReminders?.enabled
                    ? 'text-green-700'
                    : 'text-gray-600'
                    }`}>
                    {patient.notificationPreferences.medicationReminders?.enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-1">
                  <Text className="text-sm font-sans-semibold text-gray-900 mb-1">Health Alerts</Text>
                  <Text className="text-xs font-sans text-gray-600">Important health notifications</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${patient.notificationPreferences.healthAlerts?.enabled
                  ? 'bg-green-100'
                  : 'bg-gray-100'
                  }`}>
                  <Text className={`text-xs font-sans-semibold ${patient.notificationPreferences.healthAlerts?.enabled
                    ? 'text-green-700'
                    : 'text-gray-600'
                    }`}>
                    {patient.notificationPreferences.healthAlerts?.enabled ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Account Settings */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon="settings-outline" title="Account Settings" />

          <View className="space-y-3">
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Profile Sharing</Text>
                <Text className="text-sm font-sans-semibold text-gray-900">
                  {patient.shareProfile ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${patient.shareProfile ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                <Text className={`text-xs font-sans-semibold ${patient.shareProfile ? 'text-green-700' : 'text-gray-600'
                  }`}>
                  {patient.shareProfile ? 'Public' : 'Private'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Account Role</Text>
                <Text className="text-sm font-sans-semibold text-gray-900 capitalize">
                  {patient.role || 'Patient'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Admin Status</Text>
                <Text className="text-sm font-sans-semibold text-gray-900">
                  {patient.isAdmin ? 'Administrator' : patient.isSupportAdmin ? 'Support Admin' : 'Regular User'}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center py-3">
              <View className="flex-1">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Expo Push Token</Text>
                <Text className="text-xs font-sans text-gray-900" numberOfLines={1}>
                  {patient.expoPushToken || 'Not registered'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Password Reset Information */}
        {(patient.resetPasswordToken || patient.resetPasswordExpire) && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="key-outline" title="Password Reset Information" />
            {patient.resetPasswordToken && (
              <InfoRow label="Reset Token" value="Active" />
            )}
            {patient.resetPasswordExpire && (
              <InfoRow label="Token Expires" value={formatDate(patient.resetPasswordExpire)} />
            )}
          </View>
        )}

        {/* OTP Information */}
        {(patient.otp || patient.otpExpire || patient.otpPurpose) && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="shield-checkmark-outline" title="OTP Information" />
            {patient.otp && (
              <InfoRow label="OTP Status" value="Active" />
            )}
            {patient.otpExpire && (
              <InfoRow label="OTP Expires" value={formatDate(patient.otpExpire)} />
            )}
            {patient.otpPurpose && (
              <InfoRow label="OTP Purpose" value={patient.otpPurpose.replace('_', ' ').toUpperCase()} />
            )}
          </View>
        )}

        {/* Doctor Profile Reference */}
        {patient.doctorProfile && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="medical-outline" title="Doctor Profile" />
            <InfoRow label="Doctor Profile ID" value={patient.doctorProfile.toString()} />
            <Text className="text-xs font-sans text-gray-500 mt-2">
              This user has an associated doctor profile
            </Text>
          </View>
        )}

        {/* System Information */}
        <View className="bg-white mx-4 mt-4 mb-4 rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon="information-circle-outline" title="System Information" />
          <InfoRow label="Patient ID" value={patient._id} />
          <InfoRow label="Account Created" value={formatDate(patient.createdAt)} />
          {patient.updatedAt && (
            <InfoRow label="Last Updated" value={formatDate(patient.updatedAt)} />
          )}
          {patient.kycDocuments?.reviewedBy && (
            <InfoRow label="KYC Reviewed By" value={patient.kycDocuments.reviewedBy.toString()} />
          )}
        </View>

        {/* Bottom spacing for action buttons */}
        <View className="h-20" />
      </ScrollView>

      {/* Fixed Action Buttons */}
      {user?.role === 'admin' || user?.role === 'super_admin' && (
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          {patient.isActive ? (
            <TouchableOpacity
              onPress={handleDeactivate}
              className="bg-red-600 py-3.5 rounded-xl items-center justify-center flex-row"
            >
              <Ionicons name="power" size={20} color="white" />
              <Text className="text-white font-sans-bold ml-2">Deactivate Account</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleActivate}
              className="bg-primary py-3.5 rounded-xl items-center justify-center flex-row"
            >
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text className="text-white font-sans-bold ml-2">Activate Account</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Activate Confirmation Modal */}
      <ConfirmationModal
        visible={activateModalVisible}
        title="Activate Patient"
        message="Are you sure you want to activate this patient account?"
        confirmText="Activate"
        confirmColor="#67A9AF"
        onConfirm={confirmActivate}
        onCancel={() => setActivateModalVisible(false)}
        icon="checkmark-circle"
        iconColor="#67A9AF"
      />

      {/* Deactivate Confirmation Modal */}
      <ConfirmationModal
        visible={deactivateModalVisible}
        title="Deactivate Patient"
        message="Please provide a reason for deactivation (required):"
        confirmText="Deactivate"
        confirmColor="#EF4444"
        onConfirm={confirmDeactivate}
        onCancel={() => setDeactivateModalVisible(false)}
        icon="power"
        iconColor="#EF4444"
      >
        <TextInput
          className="mt-4 p-3 border border-gray-300 rounded-lg text-gray-900"
          placeholder="Enter reason for deactivation (required)"
          placeholderTextColor="#000"
          value={deactivateReason}
          onChangeText={setDeactivateReason}
          multiline
          numberOfLines={3}
        />
      </ConfirmationModal>

    </SafeAreaView>
  );
};

export default PatientDetailsScreen;