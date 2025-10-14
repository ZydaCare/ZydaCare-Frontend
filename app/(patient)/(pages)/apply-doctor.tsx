import { View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/authContext';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { applyToBecomeDoctor, getDoctorApplicationStatus, DoctorApplicationStatus } from '@/api/patient/user';
import { router } from 'expo-router';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FileType = {
  name: string;
  uri: string;
  mimeType: string;
  size: number;
} | null;

type Step = 1 | 2 | 3 | 4 | 5;

const getStepTitle = (step: number): string => {
  switch (step) {
    case 1: return 'Personal Information';
    case 2: return 'Education';
    case 3: return 'Internship';
    case 4: return 'MDCN Registration';
    case 5: return 'Review & Submit';
    default: return '';
  }
};

export default function ApplyDoctor() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<DoctorApplicationStatus | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const { showToast } = useToast();
  const [showDatePicker, setShowDatePicker] = useState({ show: false, field: '' });

  // Pre-fill user data
  const fullName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : '';
  const fullAddress = [
    user?.address,
    user?.city,
    user?.state,
    user?.country
  ].filter(Boolean).join(', ');

  // Form state
  const [formData, setFormData] = useState({
    fullName: fullName,
    email: user?.email || '',
    dateOfBirth: user?.dob ? new Date(user.dob) : new Date() || '',
    nationality: '',
    contactAddress: fullAddress,
    phoneNumber: user?.phone || '',
    hospitalName: '',
    idNumber: '',
    specialty: '',
    medicalSchool: '',
    graduationYear: '',
    degree: '',
    internshipHospitalName: '',
    startDate: new Date() || '',
    endDate: new Date() || '',
    supervisor: '',
    registrationType: 'provisional' as 'provisional' | 'full' | 'foreign',
    folioNumber: '',
    foreignDegree: '',
    regulatoryAuthority: '',
    licenseNumber: '',
    noSanctionsDeclaration: false,
    verificationConsent: false,
    truthDeclaration: false,
  });

  const [files, setFiles] = useState<Record<string, FileType>>({
    idPhoto: null,
    secondaryEducation: null,
    medicalDegree: null,
    educationCertificate: null,
    internshipProof: null,
    registrationCertificate: null,
    practicingLicense: null,
    birthCertificate: null,
    proofOfAddress: null,
    goodStandingLetter: null,
    nameChangeDocument: null,
    passport: null,
  });

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


  // Check application status on mount
  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    if (!token) {
      setCheckingStatus(false);
      return;
    }

    try {
      const status = await getDoctorApplicationStatus(token);
      setApplicationStatus(status);
    } catch (error: any) {
      console.error('Error checking status:', error);
      showToast('Failed to check application status', 'error');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Render loading state
  if (checkingStatus) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor="#67A9AF" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#67A9AF" />
          <Text className="text-gray-600 mt-4 font-sans-medium">Checking application status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render Pending Status
  if (applicationStatus?.isPending) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor="#67A9AF" />
        <View className="flex-1">
          {/* Header */}
          <View className="bg-white shadow-sm px-5 py-5" style={{ elevation: 3 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-sans-semibold text-gray-900">Application Status</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
            {/* Status Card */}
            <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
              <View className="items-center mb-6">
                <View className="w-24 h-24 rounded-full bg-yellow-100 items-center justify-center mb-4">
                  <MaterialIcons name="hourglass-empty" size={48} color="#F59E0B" />
                </View>
                <Text className="text-2xl font-sans-semibold text-gray-900 mb-2">Under Review</Text>
                <View className="bg-yellow-50 px-4 py-2 rounded-full">
                  <Text className="text-yellow-700 font-sans-medium">Pending Verification</Text>
                </View>
              </View>

              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <Text className="text-gray-700 font-sans-medium leading-6 text-center">
                  Your application is currently being reviewed by our verification team. We're carefully examining all submitted documents and information.
                </Text>
              </View>

              {applicationStatus.createdAt && (
                <View className="flex-row items-center justify-center mb-4">
                  <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
                  <Text className="text-gray-600 font-sans-medium ml-2">
                    Submitted on {new Date(applicationStatus.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Timeline Card */}
            <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
              <Text className="text-lg font-sans-semibold text-gray-900 mb-4">Review Process</Text>

              <View className="space-y-4">
                <View className="flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
                    <MaterialIcons name="check" size={16} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-gray-900">Application Submitted</Text>
                    <Text className="text-sm font-sans text-gray-600 mt-1">Your application has been received</Text>
                  </View>
                </View>

                <View className="ml-4 w-0.5 h-8 bg-yellow-300" />

                <View className="flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-yellow-400 items-center justify-center mr-3">
                    <MaterialIcons name="sync" size={16} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-gray-900">Document Verification</Text>
                    <Text className="text-sm font-sans text-gray-600 mt-1">In Progress - Verifying credentials</Text>
                  </View>
                </View>

                <View className="ml-4 w-0.5 h-8 bg-gray-200" />

                <View className="flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-3">
                    <MaterialIcons name="verified-user" size={16} color="#9CA3AF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-gray-400">Final Review</Text>
                    <Text className="text-sm font-sans text-gray-400 mt-1">Pending verification completion</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Information Card */}
            <View className="bg-primary/5 rounded-2xl p-5 border-l-4 border-primary mb-5">
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <MaterialIcons name="info" size={24} color="#67A9AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-sans-semibold text-gray-900 mb-2">Expected Timeline</Text>
                  <Text className="text-sm font-sans text-gray-700 leading-6 mb-3">
                    The complete review process typically takes 7-10 business days. You will receive email notifications at each stage.
                  </Text>
                  <View className="bg-white rounded-lg p-3 mt-2">
                    <Text className="text-sm font-sans-semibold text-gray-900 mb-2">What happens next?</Text>
                    <Text className="text-sm font-sans text-gray-600 leading-5">
                      • Our team verifies all submitted documents{'\n'}
                      • We confirm credentials with relevant authorities{'\n'}
                      • You'll receive an email with the final decision{'\n'}
                      • If approved, you'll gain access to the doctor dashboard
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Contact Support */}
            <View className="bg-white rounded-2xl p-5 shadow-sm" style={{ elevation: 2 }}>
              <Text className="text-base font-sans-semibold text-gray-900 mb-2">Need Help?</Text>
              <Text className="text-sm font-sans text-gray-600 mb-3">
                If you have questions about your application status, please contact our support team.
              </Text>
              <TouchableOpacity
                className="bg-gray-100 rounded-xl p-4 flex-row items-center justify-center"
                activeOpacity={0.7}
              >
                <MaterialIcons name="support-agent" size={20} color="#374151" />
                <Text className="text-gray-700 font-sans-semibold ml-2">Contact Support</Text>
              </TouchableOpacity>
            </View>

            <View className="h-12" />
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Render Approved Status
  if (applicationStatus?.isApproved) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor="#67A9AF" />
        <View className="flex-1">
          {/* Header */}
          <View className="bg-white shadow-sm px-5 py-5" style={{ elevation: 3 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-sans-semibold text-gray-900">Application Approved</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
            {/* Success Card */}
            <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
              <View className="items-center mb-6">
                <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center mb-4">
                  <MaterialIcons name="check-circle" size={48} color="#10B981" />
                </View>
                <Text className="text-2xl font-sans-semibold text-gray-900 mb-2">Congratulations!</Text>
                <View className="bg-green-50 px-4 py-2 rounded-full">
                  <Text className="text-green-700 font-sans-semibold">Application Approved</Text>
                </View>
              </View>

              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <Text className="text-gray-700 font-sans leading-6 text-center">
                  Your application has been successfully approved! You are now registered as a doctor on our platform.
                </Text>
              </View>

              {applicationStatus.reviewedAt && (
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
                  <Text className="text-gray-600 font-sans ml-2">
                    Approved on {new Date(applicationStatus.reviewedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Access Instructions */}
            <View className="bg-primary/5 rounded-2xl p-5 border-l-4 border-primary mb-5">
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <MaterialIcons name="info" size={24} color="#67A9AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-sans-semibold text-gray-900 mb-2">Access Your Doctor Dashboard</Text>
                  <Text className="text-sm font-sans text-gray-700 leading-6 mb-3">
                    If you don't see the doctor dashboard yet, please log out and log back in to refresh your account permissions.
                  </Text>
                  <View className="bg-white rounded-lg p-3 mt-2">
                    <Text className="text-sm font-sans-semibold text-gray-900 mb-2">Steps to access:</Text>
                    <Text className="text-sm font-sans text-gray-600 leading-5">
                      1. Tap the "Log Out & Refresh" button below{'\n'}
                      2. Log back in with your credentials{'\n'}
                      3. You'll automatically see your doctor dashboard{'\n'}
                      4. Start managing your practice!
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Features Card */}
            <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
              <Text className="text-lg font-sans-semibold text-gray-900 mb-4">What's Next?</Text>

              <View className="space-y-3">
                <View className="flex-row items-start mb-3">
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <MaterialIcons name="dashboard" size={18} color="#67A9AF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-gray-900">Doctor Dashboard</Text>
                    <Text className="text-sm font-sans text-gray-600 mt-1">Manage your appointments and patients</Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-3">
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <MaterialIcons name="people" size={18} color="#67A9AF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-gray-900">Patient Management</Text>
                    <Text className="text-sm font-sans text-gray-600 mt-1">View and manage your patient records</Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-3">
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <MaterialIcons name="schedule" size={18} color="#67A9AF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-gray-900">Appointment Scheduling</Text>
                    <Text className="text-sm font-sans text-gray-600 mt-1">Set your availability and manage bookings</Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <MaterialIcons name="medical-services" size={18} color="#67A9AF" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-gray-900">Medical Records</Text>
                    <Text className="text-sm font-sans text-gray-600 mt-1">Access and update medical documentation</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="h-32" />
          </ScrollView>

          {/* Action Button */}
          <View
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4"
            style={{ elevation: 8 }}
          >
            <TouchableOpacity
              onPress={async () => {
                await logout();
                router.replace('/(auth)/login');
              }}
              className="bg-primary rounded-xl py-4 flex-row items-center justify-center shadow-lg"
              style={{ elevation: 4 }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="logout" size={20} color="white" />
              <Text className="text-white font-sans-semibold text-base ml-2">Log Out & Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render Rejected Status
  if (applicationStatus?.isRejected) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="light-content" backgroundColor="#67A9AF" />
        <View className="flex-1">
          {/* Header */}
          <View className="bg-white shadow-sm px-5 py-5" style={{ elevation: 3 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-sans-semibold text-gray-900">Application Status</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1 px-5 py-6" showsVerticalScrollIndicator={false}>
            {/* Status Card */}
            <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
              <View className="items-center mb-6">
                <View className="w-24 h-24 rounded-full bg-red-100 items-center justify-center mb-4">
                  <MaterialIcons name="cancel" size={48} color="#EF4444" />
                </View>
                <Text className="text-2xl font-sans-semibold text-gray-900 mb-2">Application Not Approved</Text>
                <View className="bg-red-50 px-4 py-2 rounded-full">
                  <Text className="text-red-700 font-sans-semibold">Rejected</Text>
                </View>
              </View>

              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <Text className="text-gray-700 font-sans leading-6 text-center">
                  Unfortunately, your application could not be approved at this time. Please review the feedback below.
                </Text>
              </View>

              {applicationStatus.reviewedAt && (
                <View className="flex-row items-center justify-center">
                  <MaterialIcons name="calendar-today" size={16} color="#6B7280" />
                  <Text className="text-gray-600 font-sans ml-2">
                    Reviewed on {new Date(applicationStatus.reviewedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Rejection Reason */}
            {applicationStatus.reviewNotes && (
              <View className="bg-red-50 rounded-2xl p-5 border-l-4 border-red-500 mb-5">
                <View className="flex-row items-start">
                  <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                    <MaterialIcons name="error-outline" size={24} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-sans-semibold text-gray-900 mb-2">Reason for Rejection</Text>
                    <Text className="text-sm text-gray-700 font-sans leading-6">
                      {applicationStatus.reviewNotes}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Reapply Information */}
            <View className="bg-primary/5 rounded-2xl p-5 border-l-4 border-primary mb-5">
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <MaterialIcons name="info" size={24} color="#67A9AF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-sans-semibold text-gray-900 mb-2">You Can Reapply</Text>
                  <Text className="text-sm text-gray-700 font-sans leading-6 mb-3">
                    Don't worry! You can submit a new application after addressing the issues mentioned above.
                  </Text>
                  <View className="bg-white rounded-lg p-3 mt-2">
                    <Text className="text-sm font-sans-semibold text-gray-900 mb-2">Before reapplying:</Text>
                    <Text className="text-sm font-sans text-gray-600 leading-5">
                      • Carefully review the rejection reason{'\n'}
                      • Ensure all documents are clear and valid{'\n'}
                      • Double-check all information is accurate{'\n'}
                      • Contact support if you need clarification
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Contact Support */}
            <View className="bg-white rounded-2xl p-5 mb-5 shadow-sm" style={{ elevation: 2 }}>
              <Text className="text-base font-sans-semibold text-gray-900 mb-2">Need Help?</Text>
              <Text className="text-sm text-gray-600 font-sans mb-3">
                If you have questions about the rejection or need guidance for reapplying, please contact our support team.
              </Text>
              <TouchableOpacity
                className="bg-gray-100 rounded-xl p-4 flex-row items-center justify-center"
                activeOpacity={0.7}
              >
                <MaterialIcons name="support-agent" size={20} color="#374151" />
                <Text className="text-gray-700 font-sans-semibold ml-2">Contact Support</Text>
              </TouchableOpacity>
            </View>

            <View className="h-28" />
          </ScrollView>

          {/* Reapply Button */}
          <View
            className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4"
            style={{ elevation: 8 }}
          >
            <TouchableOpacity
              onPress={() => {
                setApplicationStatus(null);
                setCurrentStep(1);
                // Reset form data
                setFormData({
                  fullName: fullName,
                  email: user?.email || '',
                  dateOfBirth: user?.dob ? new Date(user.dob) : new Date(),
                  nationality: '',
                  contactAddress: fullAddress,
                  phoneNumber: user?.phone || '',
                  hospitalName: '',
                  specialty: '',
                  idNumber: '',
                  medicalSchool: '',
                  graduationYear: '',
                  degree: '',
                  internshipHospitalName: '',
                  startDate: new Date(),
                  endDate: new Date(),
                  supervisor: '',
                  registrationType: 'provisional',
                  folioNumber: '',
                  foreignDegree: '',
                  regulatoryAuthority: '',
                  licenseNumber: '',
                  noSanctionsDeclaration: false,
                  verificationConsent: false,
                  truthDeclaration: false,
                });
                // Reset files
                setFiles({
                  idPhoto: null,
                  secondaryEducation: null,
                  medicalDegree: null,
                  educationCertificate: null,
                  internshipProof: null,
                  registrationCertificate: null,
                  practicingLicense: null,
                  birthCertificate: null,
                  proofOfAddress: null,
                  goodStandingLetter: null,
                  nameChangeDocument: null,
                  passport: null,
                });
              }}
              className="bg-secondary rounded-xl py-4 flex-row items-center justify-center shadow-lg"
              style={{ elevation: 4 }}
              activeOpacity={0.8}
            >
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text className="text-white font-sans-semibold text-base ml-2">Submit New Application</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Original application form (rest of your existing code)
  const handleInputChange = (field: string, value: string | boolean | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined, field: string) => {
    setShowDatePicker({ show: false, field: '' });
    if (selectedDate) {
      setFormData(prev => ({ ...prev, [field]: selectedDate }));
    }
  };

  const pickDocument = async (field: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (asset.size && asset.size > 5 * 1024 * 1024) {
          showToast('File size should be less than 5MB', 'error');
          return;
        }

        const file = {
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        };

        setFiles(prev => ({ ...prev, [field]: file }));
        showToast('File uploaded successfully', 'success');
      }
    } catch (error) {
      console.error('Picker error:', error);
      showToast('Failed to pick document', 'error');
    }
  };

  const validateStep = (step: Step): boolean => {
    const requiredFields: Record<number, string[]> = {
      1: ['fullName', 'nationality', 'contactAddress', 'phoneNumber', 'idNumber'],
      2: ['medicalSchool', 'graduationYear', 'degree'],
      4: ['registrationType', 'folioNumber'],
    };

    const requiredFiles: Record<number, string[]> = {
      1: ['idPhoto', 'birthCertificate', 'proofOfAddress'],
      2: ['medicalDegree', 'educationCertificate'],
      4: ['registrationCertificate', 'practicingLicense'],
    };

    if (requiredFields[step]) {
      const missingFields = requiredFields[step].filter(field => !formData[field as keyof typeof formData]);
      if (missingFields.length > 0) {
        showToast(`Please fill in all required fields`, 'error');
        return false;
      }
    }

    if (requiredFiles[step]) {
      const missingFiles = requiredFiles[step].filter(file => !files[file]);
      if (missingFiles.length > 0) {
        showToast('Please upload all required documents', 'error');
        return false;
      }
    }

    if (step === 5 && !(formData.noSanctionsDeclaration && formData.verificationConsent && formData.truthDeclaration)) {
      showToast('Please accept all declarations', 'error');
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5) as Step);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (!token) {
      showToast('Authentication required', 'error');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();

      const {
        medicalSchool, graduationYear, degree,
        internshipHospitalName, startDate, endDate, supervisor,
        registrationType, folioNumber, foreignDegree,
        regulatoryAuthority, licenseNumber,
        noSanctionsDeclaration, verificationConsent, truthDeclaration,
        ...restData
      } = formData;

      Object.entries(restData).forEach(([key, value]) => {
        if (key === 'dateOfBirth') return;

        if (typeof value === 'boolean') {
          formDataToSend.append(key, value.toString());
        } else if (value !== undefined && value !== null) {
          formDataToSend.append(key, String(value));
        }
      });

      if (formData.dateOfBirth instanceof Date) {
        formDataToSend.append('dateOfBirth', formData.dateOfBirth.toISOString());
      }

      const educationDetails = {
        medicalSchool: medicalSchool || '',
        graduationYear: graduationYear || '',
        degree: degree || ''
      };
      formDataToSend.append('educationDetails', JSON.stringify(educationDetails));

      if (internshipHospitalName || startDate || endDate || supervisor) {
        const internship = {
          hospitalName: String(internshipHospitalName || ''),
          startDate: startDate instanceof Date ? startDate.toISOString() : '',
          endDate: endDate instanceof Date ? endDate.toISOString() : '',
          supervisor: String(supervisor || '')
        };
        formDataToSend.append('internship', JSON.stringify(internship));
      }

      const mdcnRegistration = {
        registrationType: registrationType || '',
        folioNumber: folioNumber || '',
        foreignDegree: foreignDegree || ''
      };
      formDataToSend.append('mdcnRegistration', JSON.stringify(mdcnRegistration));

      if (registrationType === 'foreign' && (regulatoryAuthority || licenseNumber)) {
        const foreignCredentials = {
          regulatoryAuthority: regulatoryAuthority || '',
          licenseNumber: licenseNumber || ''
        };
        formDataToSend.append('foreignCredentials', JSON.stringify(foreignCredentials));
      }

      formDataToSend.append('noSanctionsDeclaration', noSanctionsDeclaration ? 'true' : 'false');
      formDataToSend.append('verificationConsent', verificationConsent ? 'true' : 'false');
      formDataToSend.append('truthDeclaration', truthDeclaration ? 'true' : 'false');

      Object.entries(files).forEach(([key, file]) => {
        if (file && file.uri) {
          formDataToSend.append(key, {
            uri: file.uri,
            type: file.mimeType || 'application/octet-stream',
            name: file.name || `${key}.jpg`,
          } as any);
        }
      });

      await applyToBecomeDoctor(formDataToSend, token);

      showToast('Application submitted successfully!', 'success');
      router.back();
    } catch (error: any) {
      console.error('Submission error:', error);
      showToast(
        error.response?.data?.message || error.message || 'Failed to submit application. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // All your existing render functions (renderStepIndicator, renderInput, renderFileUpload, etc.)
  // Copy all the render functions from your original code here
  const renderStepIndicator = () => (
    <View className="mb-6">
      <View className="flex-row items-center justify-between px-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <React.Fragment key={step}>
            <View className="items-center flex-1">
              <View
                className={`w-12 h-12 rounded-full items-center justify-center shadow-md ${currentStep >= step ? 'bg-primary' : 'bg-white border-2 border-gray-200'
                  }`}
                style={{
                  elevation: currentStep >= step ? 4 : 0,
                }}
              >
                {currentStep > step ? (
                  <MaterialIcons name="check" size={24} color="white" />
                ) : (
                  <Text
                    className={`font-sans-semibold text-lg ${currentStep >= step ? 'text-white' : 'text-gray-400'
                      }`}
                  >
                    {step}
                  </Text>
                )}
              </View>
              <Text className={`text-xs mt-2 font-sans-medium text-center ${currentStep >= step ? 'text-primary' : 'text-gray-400'
                }`}>
                {step === 1 ? 'Personal' :
                  step === 2 ? 'Education' :
                    step === 3 ? 'Internship' :
                      step === 4 ? 'MDCN' : 'Review'}
              </Text>
            </View>
            {step < 5 && (
              <View className="flex-1 items-center" style={{ marginTop: -30 }}>
                <View
                  className={`h-1 rounded-full ${currentStep > step ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  style={{ width: '100%' }}
                />
              </View>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );

  const renderInput = ({
    label,
    value,
    onChange,
    placeholder = '',
    required = true,
    multiline = false,
    keyboardType = 'default',
    editable = true,
  }: {
    label: string;
    value: string;
    onChange: (text: string) => void;
    placeholder?: string;
    required?: boolean;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    editable?: boolean;
  }) => (
    <View className="mb-5">
      <View className="flex-row items-center mb-2">
        <Text className="text-sm font-sans-semibold text-gray-800">
          {label}
        </Text>
        {required && (
          <View className="ml-1 bg-secondary/10 px-2 py-0.5 rounded-full">
            <Text className="text-xs font-sans-semibold text-secondary">Required</Text>
          </View>
        )}
      </View>
      <TextInput
        className={`border-2 rounded-xl p-4 text-gray-900 font-sans-medium ${!editable ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 focus:border-primary'
          } ${multiline ? 'h-28' : 'h-14'}`}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        editable={editable}
        style={{ elevation: 1 }}
      />
    </View>
  );

  const renderFileUpload = ({
    label,
    field,
    required = true,
    description,
  }: {
    label: string;
    field: string;
    required?: boolean;
    description?: string;
  }) => (
    <View className="mb-5">
      <View className="flex-row items-center mb-2">
        <Text className="text-sm font-sans-semibold text-gray-800">
          {label}
        </Text>
        {required && (
          <View className="ml-1 bg-secondary/10 px-2 py-0.5 rounded-full">
            <Text className="text-xs font-sans-semibold text-secondary">Required</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={() => pickDocument(field)}
        className={`border-2 rounded-xl p-5 ${files[field]
          ? 'border-primary bg-primary/5'
          : 'border-dashed border-gray-300'
          }`}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <View className={`w-12 h-12 rounded-full items-center justify-center ${files[field] ? 'bg-primary' : 'bg-gray-200'
            }`}>
            <MaterialIcons
              name={files[field] ? 'check-circle' : 'cloud-upload'}
              size={24}
              color={files[field] ? 'white' : '#6B7280'}
            />
          </View>
          <View className="flex-1 ml-4">
            <Text className={`font-sans-semibold ${files[field] ? 'text-primary' : 'text-gray-700'
              }`}>
              {files[field]
                ? files[field]?.name || 'File uploaded'
                : 'Choose file to upload'}
            </Text>
            {description && (
              <Text className="text-xs font-sans text-gray-500 mt-1">
                {description}
              </Text>
            )}
          </View>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={files[field] ? '#67A9AF' : '#9CA3AF'}
          />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderDatePicker = ({
    label,
    value,
    field,
    required = true,
  }: {
    label: string;
    value: Date;
    field: string;
    required?: boolean;
  }) => (
    <View className="mb-5">
      <View className="flex-row items-center mb-2">
        <Text className="text-sm font-sans-semibold text-gray-800">
          {label}
        </Text>
        {required && (
          <View className="ml-1 bg-secondary/10 px-2 py-0.5 rounded-full">
            <Text className="text-xs font-sans-semibold text-secondary">Required</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={() => setShowDatePicker({ show: true, field })}
        className="border-2 border-gray-200 rounded-xl p-4 bg-white h-14 flex-row items-center justify-between"
        style={{ elevation: 1 }}
        activeOpacity={0.7}
      >
        <Text className="text-gray-900 font-sans-medium">
          {value.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
        <MaterialIcons name="calendar-today" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  const renderCheckbox = ({
    label,
    value,
    onChange,
    required = true,
  }: {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
    required?: boolean;
  }) => (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      className="flex-row items-start mb-5 p-4 rounded-xl bg-gray-50"
      activeOpacity={0.7}
    >
      <View
        className={`w-6 h-6 rounded-lg mr-3 mt-0.5 items-center justify-center ${value ? 'bg-primary' : 'bg-white border-2 border-gray-300'
          }`}
        style={{ elevation: value ? 2 : 0 }}
      >
        {value && (
          <MaterialIcons name="check" size={18} color="white" />
        )}
      </View>
      <Text className="flex-1 text-gray-700 font-sans leading-6">
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderStep1 = () => (
    <View className="mb-6">
      <View className="mb-6">
        <View className="flex-row items-center mb-2">
          <View className="w-1 h-6 bg-primary rounded-full mr-3" />
          <Text className="text-2xl font-sans-semibold text-gray-900">Personal Details</Text>
        </View>
        <Text className="text-gray-500 font-sans ml-4">Please provide your personal information</Text>
      </View>

      <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <MaterialIcons name="person" size={20} color="#67A9AF" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Basic Information</Text>
        </View>

        {renderInput({
          label: 'Full Name',
          value: formData.fullName,
          onChange: (value) => handleInputChange('fullName', value),
          placeholder: 'Enter your full legal name',
        })}

        {renderInput({
          label: 'Email',
          value: formData.email,
          onChange: () => { },
          editable: false,
          placeholder: 'Your email address',
        })}

        {renderDatePicker({
          label: 'Date of Birth',
          value: formData.dateOfBirth,
          field: 'dateOfBirth',
        })}

        {renderInput({
          label: 'Nationality',
          value: formData.nationality,
          onChange: (value) => handleInputChange('nationality', value),
          placeholder: 'Your nationality',
        })}

        {renderInput({
          label: 'Contact Address',
          value: formData.contactAddress,
          onChange: (value) => handleInputChange('contactAddress', value),
          placeholder: 'Your complete residential address',
          multiline: true,
        })}

        {renderInput({
          label: 'Phone Number',
          value: formData.phoneNumber,
          onChange: (value) => handleInputChange('phoneNumber', value),
          placeholder: 'Your active phone number',
          keyboardType: 'phone-pad',
        })}

        {renderInput({
          label: 'Hospital Name of Work',
          value: formData.hospitalName,
          onChange: (value) => handleInputChange('hospitalName', value),
          placeholder: 'Current hospital you work in (if any)',
          required: false,
        })}

        {renderInput({
          label: 'ID Number',
          value: formData.idNumber,
          onChange: (value) => handleInputChange('idNumber', value),
          placeholder: 'Government issued ID number',
        })}

        {renderInput({
          label: 'Medical Specialty',
          value: formData.specialty,
          onChange: (value) => handleInputChange('specialty', value),
          placeholder: 'e.g., Cardiology, Pediatrics, etc.',
        })}
      </View>

      <View className="bg-white rounded-2xl p-6 shadow-sm" style={{ elevation: 2 }}>
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center">
            <MaterialIcons name="description" size={20} color="#D65C1E" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Supporting Documents</Text>
        </View>

        {renderFileUpload({
          label: 'ID Photo',
          field: 'idPhoto',
          description: 'Clear photo of your government-issued ID'
        })}

        {renderFileUpload({
          label: 'Birth Certificate',
          field: 'birthCertificate',
          description: 'Scanned copy of your birth certificate'
        })}

        {renderFileUpload({
          label: 'Proof of Address',
          field: 'proofOfAddress',
          description: 'Recent utility bill or bank statement (not older than 3 months)'
        })}

        {renderFileUpload({
          label: 'Name Change Document',
          field: 'nameChangeDocument',
          required: false,
          description: 'Marriage certificate or legal name change document (if applicable)'
        })}

        {renderFileUpload({
          label: 'Passport',
          field: 'passport',
          required: false,
          description: 'Clear copy of your passport data page (for foreign applicants)'
        })}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="mb-6">
      <View className="mb-6">
        <View className="flex-row items-center mb-2">
          <View className="w-1 h-6 bg-primary rounded-full mr-3" />
          <Text className="text-2xl font-sans-semibold text-gray-900">Education Details</Text>
        </View>
        <Text className="text-gray-500 font-sans ml-4">Your medical education background</Text>
      </View>

      <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <MaterialIcons name="school" size={20} color="#67A9AF" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Academic Credentials</Text>
        </View>

        {renderInput({
          label: 'Medical School',
          value: formData.medicalSchool,
          onChange: (value) => handleInputChange('medicalSchool', value),
          placeholder: 'Name of your medical school',
        })}

        {renderInput({
          label: 'Graduation Year',
          value: formData.graduationYear,
          onChange: (value) => handleInputChange('graduationYear', value.replace(/[^0-9]/g, '')),
          placeholder: 'Year of graduation (e.g., 2020)',
          keyboardType: 'numeric',
        })}

        {renderInput({
          label: 'Degree Obtained',
          value: formData.degree,
          onChange: (value) => handleInputChange('degree', value),
          placeholder: 'e.g., MBBS, MD, etc.',
        })}
      </View>

      <View className="bg-white rounded-2xl p-6 shadow-sm" style={{ elevation: 2 }}>
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center">
            <MaterialIcons name="description" size={20} color="#D65C1E" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Education Documents</Text>
        </View>

        {renderFileUpload({
          label: 'Secondary Education Certificate',
          field: 'secondaryEducation',
          description: 'WAEC, NECO, or equivalent certificate',
          required: false
        })}

        {renderFileUpload({
          label: 'Medical Degree Certificate',
          field: 'medicalDegree',
          description: 'Your MBBS or equivalent degree certificate'
        })}

        {renderFileUpload({
          label: 'Education Certificate',
          field: 'educationCertificate',
          description: 'Any additional educational certificates'
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="mb-6">
      <View className="mb-6">
        <View className="flex-row items-center mb-2">
          <View className="w-1 h-6 bg-primary rounded-full mr-3" />
          <Text className="text-2xl font-sans-semibold text-gray-900">Internship Details</Text>
        </View>
        <Text className="text-gray-500 font-sans ml-4">Your practical training experience</Text>
      </View>

      <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <MaterialIcons name="local-hospital" size={20} color="#67A9AF" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Internship Information</Text>
        </View>

        {renderInput({
          label: 'Hospital Name',
          value: formData.internshipHospitalName,
          onChange: (value) => handleInputChange('internshipHospitalName', value),
          placeholder: 'Name of the hospital where you interned',
          required: false
        })}

        <View className="flex-row gap-5 mb-5">
          <View className="flex-1">
            {renderDatePicker({
              label: 'Start Date',
              value: formData.startDate,
              field: 'startDate',
              required: false
            })}
          </View>
          <View className="flex-1">
            {renderDatePicker({
              label: 'End Date',
              value: formData.endDate,
              field: 'endDate',
              required: false
            })}
          </View>
        </View>

        {renderInput({
          label: 'Supervisor Name',
          value: formData.supervisor,
          onChange: (value) => handleInputChange('supervisor', value),
          placeholder: 'Name of your internship supervisor',
          required: false
        })}
      </View>

      <View className="bg-white rounded-2xl p-6 shadow-sm" style={{ elevation: 2 }}>
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center">
            <MaterialIcons name="description" size={20} color="#D65C1E" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Internship Documents</Text>
        </View>

        {renderFileUpload({
          label: 'Internship Completion Certificate',
          field: 'internshipProof',
          description: 'Certificate or letter confirming completion of internship',
          required: false
        })}
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View className="mb-6">
      <View className="mb-6">
        <View className="flex-row items-center mb-2">
          <View className="w-1 h-6 bg-primary rounded-full mr-3" />
          <Text className="text-2xl font-sans-semibold text-gray-900">MDCN Registration</Text>
        </View>
        <Text className="text-gray-500 font-sans ml-4">Medical and Dental Council registration details</Text>
      </View>

      <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <MaterialIcons name="verified-user" size={20} color="#67A9AF" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Registration Type</Text>
        </View>

        <View className="mb-5">
          <View className="flex-row items-center mb-3">
            <Text className="text-sm font-sans-semibold text-gray-800">Select Registration Type</Text>
            <View className="ml-2 bg-secondary/10 px-2 py-0.5 rounded-full">
              <Text className="text-xs font-sans-semibold text-secondary">Required</Text>
            </View>
          </View>

          {[
            { value: 'provisional', label: 'Provisional Registration', icon: 'assignment' },
            { value: 'full', label: 'Full Registration', icon: 'verified' },
            { value: 'foreign', label: 'Foreign Trained', icon: 'flight' },
          ].map((type) => (
            <TouchableOpacity
              key={type.value}
              onPress={() => handleInputChange('registrationType', type.value as any)}
              className={`flex-row items-center p-4 rounded-xl mb-3 ${formData.registrationType === type.value
                ? 'bg-primary/10 border-2 border-primary'
                : 'bg-gray-50 border-2 border-gray-200'
                }`}
              activeOpacity={0.7}
            >
              <View className={`w-10 h-10 rounded-full items-center justify-center ${formData.registrationType === type.value ? 'bg-primary' : 'bg-gray-200'
                }`}>
                <MaterialIcons
                  name={type.icon as any}
                  size={20}
                  color={formData.registrationType === type.value ? 'white' : '#6B7280'}
                />
              </View>
              <Text className={`flex-1 ml-4 font-sans-semibold ${formData.registrationType === type.value ? 'text-primary' : 'text-gray-700'
                }`}>
                {type.label}
              </Text>
              {formData.registrationType === type.value && (
                <MaterialIcons name="check-circle" size={24} color="#67A9AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {renderInput({
          label: 'MDCN Folio Number',
          value: formData.folioNumber,
          onChange: (value) => handleInputChange('folioNumber', value),
          placeholder: 'Enter your MDCN folio number',
        })}
      </View>

      <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center">
            <MaterialIcons name="description" size={20} color="#D65C1E" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Registration Documents</Text>
        </View>

        {renderFileUpload({
          label: 'MDCN Registration Certificate',
          field: 'registrationCertificate',
          description: 'Your official MDCN registration certificate'
        })}

        {renderFileUpload({
          label: 'Current Practicing License',
          field: 'practicingLicense',
          description: 'Your most recent practicing license'
        })}
      </View>

      {formData.registrationType === 'foreign' && (
        <View className="bg-white rounded-2xl p-6 shadow-sm" style={{ elevation: 2 }}>
          <View className="flex-row items-center mb-5">
            <View className="w-10 h-10 rounded-full bg-secondary/10 items-center justify-center">
              <MaterialIcons name="flight" size={20} color="#D65C1E" />
            </View>
            <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Foreign Credentials</Text>
          </View>

          {renderInput({
            label: 'Foreign Degree',
            value: formData.foreignDegree,
            onChange: (value) => handleInputChange('foreignDegree', value),
            placeholder: 'Your foreign medical degree',
          })}

          {renderInput({
            label: 'Regulatory Authority',
            value: formData.regulatoryAuthority,
            onChange: (value) => handleInputChange('regulatoryAuthority', value),
            placeholder: 'Name of foreign regulatory body',
          })}

          {renderInput({
            label: 'License Number',
            value: formData.licenseNumber,
            onChange: (value) => handleInputChange('licenseNumber', value),
            placeholder: 'Your foreign license number',
          })}

          {renderFileUpload({
            label: 'Certificate of Good Standing',
            field: 'goodStandingLetter',
            description: 'From your foreign medical board',
            required: false,
          })}
        </View>
      )}
    </View>
  );

  const renderStep5 = () => (
    <View className="mb-6">
      <View className="mb-6">
        <View className="flex-row items-center mb-2">
          <View className="w-1 h-6 bg-primary rounded-full mr-3" />
          <Text className="text-2xl font-sans-semibold text-gray-900">Final Review</Text>
        </View>
        <Text className="text-gray-500 font-sans ml-4">Review and accept the declarations</Text>
      </View>

      <View className="bg-white rounded-2xl p-6 mb-5 shadow-sm" style={{ elevation: 2 }}>
        <View className="flex-row items-center mb-5">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <MaterialIcons name="assignment-turned-in" size={20} color="#67A9AF" />
          </View>
          <Text className="text-lg font-sans-semibold text-gray-900 ml-3">Declarations</Text>
        </View>

        <Text className="text-gray-600 font-sans mb-5 leading-6">
          Please read carefully and accept the following declarations to proceed with your application.
        </Text>

        {renderCheckbox({
          label: 'I declare that I have never been convicted of any criminal offense or professional misconduct in any country.',
          value: formData.noSanctionsDeclaration,
          onChange: (value) => handleInputChange('noSanctionsDeclaration', value),
        })}

        {renderCheckbox({
          label: 'I consent to the verification of all information and documents provided in this application by the relevant authorities.',
          value: formData.verificationConsent,
          onChange: (value) => handleInputChange('verificationConsent', value),
        })}

        {renderCheckbox({
          label: 'I declare that all the information provided in this application is true and correct to the best of my knowledge. I understand that providing false information may lead to the rejection of my application or revocation of my registration.',
          value: formData.truthDeclaration,
          onChange: (value) => handleInputChange('truthDeclaration', value),
        })}
      </View>

      <View className="bg-primary/5 rounded-2xl p-5 border-l-4 border-primary">
        <View className="flex-row items-start">
          <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
            <MaterialIcons name="info" size={24} color="#67A9AF" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-sans-semibold text-gray-900 mb-2">
              Application Review Process
            </Text>
            <Text className="text-sm text-gray-700 font-sans leading-6">
              Your application will be carefully reviewed by our verification team. You will receive email notifications at each stage of the process. The complete review typically takes 7-10 business days.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor="#67A9AF" />
      <View className="flex-1">
        <View className="bg-white shadow-sm" style={{ elevation: 3 }}>
          <View className="px-5 pt-5 pb-2">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Text className="text-3xl font-sans-semibold text-gray-900">Doctor Application</Text>
                <View className="flex-row items-center mt-2">
                  <View className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="text-sm font-sans-semibold text-primary">
                      Step {currentStep} of 5
                    </Text>
                  </View>
                  <Text className="text-gray-500 ml-2 font-sans-medium">
                    {getStepTitle(currentStep)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5 py-6"
          showsVerticalScrollIndicator={false}
        >
          {renderStepIndicator()}
          {renderCurrentStep()}
          <View className="h-32" />
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4"
          style={{ elevation: 8 }}
        >
          <View className="flex-row gap-5">
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={prevStep}
                className="flex-1 bg-gray-100 rounded-xl py-4 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <MaterialIcons name="arrow-back" size={20} color="#374151" />
                <Text className="text-gray-700 font-sans-semibold ml-2">Previous</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={currentStep === 5 ? handleSubmit : nextStep}
              disabled={loading}
              className={`${currentStep === 1 ? 'flex-1' : 'flex-[2]'} ${currentStep === 5 ? 'bg-secondary' : 'bg-primary'
                } rounded-xl py-4 flex-row items-center justify-center shadow-lg`}
              style={{ elevation: 4 }}
              activeOpacity={0.8}
            >
              {loading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-sans-semibold ml-2">Processing...</Text>
                </View>
              ) : (
                <>
                  <Text className="text-white font-sans-semibold text-base">
                    {currentStep === 5 ? 'Submit Application' : 'Continue'}
                  </Text>
                  {currentStep < 5 && (
                    <MaterialIcons name="arrow-forward" size={20} color="white" className="ml-2" />
                  )}
                  {currentStep === 5 && (
                    <MaterialIcons name="send" size={20} color="white" className="ml-2" />
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker.show && (
          <DateTimePicker
            value={formData[showDatePicker.field as keyof typeof formData] as Date}
            mode="date"
            display="default"
            onChange={(e, date) => handleDateChange(e, date, showDatePicker.field)}
            maximumDate={new Date()}
            themeVariant="light"
          />
        )}
      </View>
    </SafeAreaView>
  );
}