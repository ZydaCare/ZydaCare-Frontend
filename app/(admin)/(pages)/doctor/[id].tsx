import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { getDoctor, approveDoctor, rejectDoctor, suspendDoctor, deleteDoctor, unsuspendDoctor } from '@/api/admin/doctors';
import { Doctor as DoctorType } from '@/types/Doctor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

const DoctorDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<DoctorType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Modal states
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [suspendModalVisible, setSuspendModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Form states
  const [rejectReason, setRejectReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

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
    const fetchDoctorDetails = async () => {
      if (!token) return;

      try {
        setLoading(true);
        const data = await getDoctor(id as string);
        setDoctor(data);
      } catch (error) {
        console.error('Error fetching doctor details:', error);
        showToast('Failed to load doctor details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchDoctorDetails();
    }
  }, [id, token]);

  const handleApprove = async () => {
    setApproveModalVisible(true);
  };

  const confirmApprove = async () => {
    try {
      await approveDoctor(doctor?._id!);
      showToast('Doctor has been approved', 'success');
      setApproveModalVisible(false);
      router.back();
    } catch (error) {
      showToast('Failed to approve doctor', 'error');
    }
  };

  const handleReject = () => {
    setRejectModalVisible(true);
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      showToast('Please provide a reason for rejection', 'warning');
      return;
    }

    try {
      await rejectDoctor(doctor?._id!, rejectReason);
      showToast('Doctor has been rejected', 'success');
      setRejectModalVisible(false);
      setRejectReason('');
      router.back();
    } catch (error) {
      showToast('Failed to reject doctor', 'error');
    }
  };

  const handleSuspend = () => {
    setSuspendModalVisible(true);
  };

  const confirmSuspend = async () => {
    try {
      await suspendDoctor(doctor?._id!, suspendReason || undefined);
      showToast('Doctor has been suspended', 'success');
      setSuspendModalVisible(false);
      setSuspendReason('');
      router.back();
    } catch (error) {
      showToast('Failed to suspend doctor', 'error');
    }
  };

  const handleUnsuspendDoctor = async () => {
    try {
      await unsuspendDoctor(doctor?._id!);
      showToast('Doctor has been unsuspended', 'success');
      router.back();
    } catch (error) {
      showToast('Failed to unsuspend doctor', 'error');
    }
  }

  const handleDelete = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoctor(doctor?._id!);
      showToast('Doctor has been deleted', 'success');
      setDeleteModalVisible(false);
      router.back();
    } catch (error) {
      showToast('Failed to delete doctor', 'error');
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
      under_review: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      suspended: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' },
    }[status] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-300' };

    return (
      <View className={`px-4 py-1.5 rounded-full border ${statusConfig.bg} ${statusConfig.border}`}>
        <Text className={`text-xs font-sans-semibold uppercase tracking-wide ${statusConfig.text}`}>
          {status.replace('_', ' ')}
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

  const DocumentCard = ({ label, url, verified = true }: { label: string; url?: string; verified?: boolean }) => {
    if (!url) return null;
    return (
      <View className="bg-gray-50 rounded-lg p-4 mb-3 flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-sm font-sans-semibold text-gray-900 mb-1">{label}</Text>
          <Text className="text-xs font-sans text-gray-500" numberOfLines={1}>{url}</Text>
        </View>
        <View className="ml-3">
          {verified ? (
            <View className="bg-green-100 rounded-full p-2">
              <MaterialIcons name="verified" size={18} color="#10B981" />
            </View>
          ) : (
            <View className="bg-yellow-100 rounded-full p-2">
              <MaterialIcons name="pending" size={18} color="#F59E0B" />
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading || !doctor) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#67A9AF" />
        <Text className="text-gray-600 font-sans-medium mt-4">Loading doctor details...</Text>
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
              <Text className="text-xl font-sans-bold text-gray-900">Doctor Profile</Text>
              <Text className="text-xs font-sans text-gray-500 mt-0.5">ID: {doctor._id}</Text>
            </View>
          </View>
          {/* <TouchableOpacity 
            onPress={() => router.push(`/admin/doctors/edit/${doctor._id}`)}
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
                {doctor.profile?.profileImage?.url ? (
                  <Image
                    source={{ uri: doctor.profile.profileImage.url }}
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
                    {doctor.profile?.title || 'Dr.'} {doctor.fullName}
                  </Text>
                  {doctor.isVerified && (
                    <View className="ml-2 bg-blue-100 rounded-full p-1">
                      <MaterialIcons name="verified" size={16} color="#3B82F6" />
                    </View>
                  )}
                </View>
                <Text className="text-sm font-sans-medium text-gray-600 mb-2">
                  {doctor.speciality || 'General Practitioner'}
                </Text>
                {renderStatusBadge(doctor.status || 'pending')}
              </View>
            </View>
          </View>

          <View className="px-6 py-4 bg-gray-50 flex-row items-center justify-around border-t border-gray-100">
            <View className="items-center">
              <Text className="text-xl font-sans-bold text-gray-900">
                {doctor.profile?.yearsOfExperience || doctor.yearsOfExperience || '0'}
              </Text>
              <Text className="text-xs font-sans text-gray-500 mt-1">Years Exp.</Text>
            </View>
            <View className="w-px h-8 bg-gray-300" />
            <View className="items-center">
              <Text className="text-xl font-sans-bold text-gray-900">
                {doctor.profile?.rating?.toFixed(1) || '0.0'}
              </Text>
              <Text className="text-xs font-sans text-gray-500 mt-1">Rating</Text>
            </View>
            <View className="w-px h-8 bg-gray-300" />
            <View className="items-center">
              <Text className="text-xl font-sans-bold text-gray-900">
                {doctor.profile?.totalReviews || '0'}
              </Text>
              <Text className="text-xs font-sans text-gray-500 mt-1">Reviews</Text>
            </View>
          </View>
        </View>

        {/* Professional Summary */}
        {doctor.profile?.professionalSummary && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="document-text-outline" title="Professional Summary" />
            <Text className="text-sm font-sans text-gray-700 leading-5">
              {doctor.profile.professionalSummary}
            </Text>
          </View>
        )}

        {/* Personal Information */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon="person-outline" title="Personal Information" />
          <InfoRow label="Full Name" value={doctor.fullName} icon="person" />
          <InfoRow label="Email Address" value={doctor.email} icon="mail" />
          <InfoRow label="Phone Number" value={doctor.phoneNumber} icon="call" />
          <InfoRow label="Date of Birth" value={doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toLocaleDateString() : 'N/A'} icon="calendar" />
          <InfoRow label="Gender" value={doctor.profile?.gender} icon="male-female" />
          <InfoRow label="Nationality" value={doctor.nationality} icon="flag" />
          <InfoRow label="Contact Address" value={doctor.contactAddress} icon="location" />
          <InfoRow label="ID Number" value={doctor.idNumber} icon="card" />
          <InfoRow label="Work Hospital" value={doctor.workHospitalName} icon="business" />
        </View>

        {/* Location Information */}
        {doctor.profile?.location && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="location-outline" title="Location Details" />
            <InfoRow label="Address" value={doctor.profile.location.address} />
            <InfoRow label="City" value={doctor.profile.location.city} />
            <InfoRow label="State" value={doctor.profile.location.state} />
            <InfoRow label="Country" value={doctor.profile.location.country} />
            <InfoRow label="Postal Code" value={doctor.profile.location.postalCode} />
          </View>
        )}

        {/* MDCN Registration */}
        {doctor.mdcnRegistration && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="shield-checkmark-outline" title="MDCN Registration" />
            <InfoRow label="Registration Type" value={doctor.mdcnRegistration.registrationType?.toUpperCase()} />
            <InfoRow label="Folio Number" value={doctor.mdcnRegistration.folioNumber} />
            <View className="mt-3">
              <DocumentCard
                label="Registration Certificate"
                url={doctor.mdcnRegistration.registrationCertificate}
                verified={true}
              />
              <DocumentCard
                label="Practicing License"
                url={doctor.mdcnRegistration.practicingLicense}
                verified={true}
              />
            </View>
          </View>
        )}

        {/* Education Details */}
        {doctor.educationDetails && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="school-outline" title="Medical Education" />
            <InfoRow label="Degree" value={doctor.educationDetails.degree} />
            <InfoRow label="Medical School" value={doctor.educationDetails.medicalSchool} />
            <InfoRow label="Graduation Year" value={doctor.educationDetails.graduationYear?.toString()} />
            {doctor.educationDetails.certificate && (
              <View className="mt-3">
                <DocumentCard label="Medical Degree Certificate" url={doctor.educationDetails.certificate} />
              </View>
            )}
          </View>
        )}

        {/* Internship Details */}
        {doctor.internship?.hospitalName && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="medical-outline" title="Internship Experience" />
            <InfoRow label="Hospital Name" value={doctor.internship.hospitalName} />
            <InfoRow label="Supervisor" value={doctor.internship.supervisor} />
            <InfoRow
              label="Duration"
              value={`${new Date(doctor.internship.startDate).toLocaleDateString()} - ${doctor.internship.endDate ? new Date(doctor.internship.endDate).toLocaleDateString() : 'Present'}`}
            />
            {doctor.internship.proof && (
              <View className="mt-3">
                <DocumentCard label="Internship Proof" url={doctor.internship.proof} />
              </View>
            )}
          </View>
        )}

        {/* Work Experience */}
        {doctor.profile?.experience && doctor.profile.experience.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="briefcase-outline" title="Work Experience" />
            {doctor.profile.experience.map((exp: any, index: number) => (
              <View key={index} className={`pb-4 mb-4 ${index < doctor.profile.experience.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <Text className="text-sm font-sans-bold text-gray-900 mb-1">{exp.position}</Text>
                <Text className="text-sm font-sans-medium text-primary mb-2">{exp.hospital}</Text>
                <Text className="text-xs font-sans text-gray-500 mb-2">
                  {new Date(exp.startDate).toLocaleDateString()} - {exp.isCurrent ? 'Present' : new Date(exp.endDate).toLocaleDateString()}
                </Text>
                {exp.description && (
                  <Text className="text-sm font-sans text-gray-700">{exp.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Additional Qualifications */}
        {doctor.additionalQualifications && doctor.additionalQualifications.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="ribbon-outline" title="Additional Qualifications" />
            {doctor.additionalQualifications.map((qual: any, index: number) => (
              <View key={index} className="mb-4">
                <Text className="text-sm font-sans-bold text-gray-900 mb-1">{qual.qualificationName}</Text>
                <Text className="text-sm font-sans text-gray-600 mb-1">{qual.institution}</Text>
                <Text className="text-xs font-sans text-gray-500 mb-2">
                  {new Date(qual.dateObtained).toLocaleDateString()}
                </Text>
                {qual.certificate && (
                  <DocumentCard label="Certificate" url={qual.certificate} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Foreign Credentials */}
        {doctor.foreignCredentials && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="globe-outline" title="Foreign Credentials" />
            <InfoRow label="Degree" value={doctor.foreignCredentials.degree} />
            <InfoRow label="Regulatory Authority" value={doctor.foreignCredentials.regulatoryAuthority} />
            <InfoRow label="License Number" value={doctor.foreignCredentials.licenseNumber} />
            {doctor.foreignCredentials.goodStandingLetter && (
              <View className="mt-3">
                <DocumentCard label="Good Standing Letter" url={doctor.foreignCredentials.goodStandingLetter} />
              </View>
            )}
          </View>
        )}

        {/* Specialties & Services */}
        {(doctor.profile?.specialties?.length > 0 || doctor.profile?.services?.length > 0) && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="fitness-outline" title="Specialties & Services" />

            {doctor.profile.specialties && doctor.profile.specialties.length > 0 && (
              <View className="mb-4">
                <Text className="text-xs font-sans-semibold text-gray-500 mb-2">SPECIALTIES</Text>
                <View className="flex-row flex-wrap">
                  {doctor.profile.specialties.map((specialty: any, index: number) => (
                    <View key={index} className="bg-primary/10 rounded-full px-3 py-1.5 mr-2 mb-2">
                      <Text className="text-xs font-sans-semibold text-primary">{specialty}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {doctor.profile.services && doctor.profile.services.length > 0 && (
              <View>
                <Text className="text-xs font-sans-semibold text-gray-500 mb-2">SERVICES OFFERED</Text>
                {doctor.profile.services.map((service: any, index: number) => (
                  <View key={index} className="bg-gray-50 rounded-lg p-3 mb-2">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="text-sm font-sans-semibold text-gray-900 flex-1">{service.name}</Text>
                      {service.price && (
                        <Text className="text-sm font-sans-bold text-primary ml-2">
                          ₦{service.price.toLocaleString()}
                        </Text>
                      )}
                    </View>
                    {service.description && (
                      <Text className="text-xs font-sans text-gray-600 mb-1">{service.description}</Text>
                    )}
                    {service.duration && (
                      <Text className="text-xs font-sans text-gray-500">{service.duration} minutes</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Consultation Fees */}
        {doctor.profile?.consultationFees && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="cash-outline" title="Consultation Fees" />
            <View className="space-y-2">
              {doctor.profile.consultationFees.inPerson > 0 && (
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm font-sans text-gray-600">In-Person Consultation</Text>
                  <Text className="text-sm font-sans-bold text-gray-900">
                    {doctor.profile.consultationFees.currency} {doctor.profile.consultationFees.inPerson.toLocaleString()}
                  </Text>
                </View>
              )}
              {doctor.profile.consultationFees.video > 0 && (
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm font-sans text-gray-600">Video Consultation</Text>
                  <Text className="text-sm font-sans-bold text-gray-900">
                    {doctor.profile.consultationFees.currency} {doctor.profile.consultationFees.video.toLocaleString()}
                  </Text>
                </View>
              )}
              {doctor.profile.consultationFees.homeVisit > 0 && (
                <View className="flex-row justify-between py-2">
                  <Text className="text-sm font-sans text-gray-600">Home Visit</Text>
                  <Text className="text-sm font-sans-bold text-gray-900">
                    {doctor.profile.consultationFees.currency} {doctor.profile.consultationFees.homeVisit.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Availability */}
        {doctor.profile?.availability && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="time-outline" title="Availability" />
            <View className="space-y-2">
              <View className="flex-row items-center py-2">
                <Ionicons name={doctor.profile.availability.isAvailableForInPersonConsultations ? "checkmark-circle" : "close-circle"} size={20} color={doctor.profile.availability.isAvailableForInPersonConsultations ? "#10B981" : "#EF4444"} />
                <Text className="text-sm font-sans text-gray-700 ml-3">In-Person Consultations</Text>
              </View>
              <View className="flex-row items-center py-2">
                <Ionicons name={doctor.profile.availability.isAvailableForOnlineConsultations ? "checkmark-circle" : "close-circle"} size={20} color={doctor.profile.availability.isAvailableForOnlineConsultations ? "#10B981" : "#EF4444"} />
                <Text className="text-sm font-sans text-gray-700 ml-3">Online Consultations</Text>
              </View>
              <View className="flex-row items-center py-2">
                <Ionicons name={doctor.profile.availability.isAvailableForHomeVisits ? "checkmark-circle" : "close-circle"} size={20} color={doctor.profile.availability.isAvailableForHomeVisits ? "#10B981" : "#EF4444"} />
                <Text className="text-sm font-sans text-gray-700 ml-3">Home Visits</Text>
              </View>
              {doctor.profile.availability.noticePeriod && (
                <View className="mt-2 pt-2 border-t border-gray-100">
                  <Text className="text-xs font-sans text-gray-500">
                    Notice Period: {doctor.profile.availability.noticePeriod} hours
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Languages */}
        {doctor.profile?.languages && doctor.profile.languages.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="language-outline" title="Languages Spoken" />
            <View className="flex-row flex-wrap">
              {doctor.profile.languages.map((lang: any, index: number) => (
                <View key={index} className="bg-gray-50 rounded-lg px-4 py-2 mr-2 mb-2 flex-row items-center">
                  <Text className="text-sm font-sans-semibold text-gray-900">{lang.language}</Text>
                  <Text className="text-xs font-sans text-gray-500 ml-2">({lang.proficiency})</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Practice Information */}
        {doctor.profile?.practiceInfo?.clinicName && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="business-outline" title="Practice Information" />
            <InfoRow label="Clinic Name" value={doctor.profile.practiceInfo.clinicName} />
            {doctor.profile.practiceInfo.clinicAddress && (
              <>
                <InfoRow label="Street" value={doctor.profile.practiceInfo.clinicAddress.street} />
                <InfoRow label="City" value={doctor.profile.practiceInfo.clinicAddress.city} />
                <InfoRow label="State" value={doctor.profile.practiceInfo.clinicAddress.state} />
                <InfoRow label="Country" value={doctor.profile.practiceInfo.clinicAddress.country} />
              </>
            )}
            <InfoRow label="Consultation Hours" value={doctor.profile.practiceInfo.consultationHours} />
            <InfoRow label="Emergency Contact" value={doctor.profile.practiceInfo.emergencyContact} />
            {doctor.profile.practiceInfo.aboutClinic && (
              <View className="mt-3">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">ABOUT CLINIC</Text>
                <Text className="text-sm font-sans text-gray-700">{doctor.profile.practiceInfo.aboutClinic}</Text>
              </View>
            )}
          </View>
        )}

        {/* Insurance */}
        {doctor.profile?.acceptedInsurances && doctor.profile.acceptedInsurances.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="shield-outline" title="Accepted Insurance" />
            {doctor.profile.acceptedInsurances.map((insurance: any, index: number) => (
              <View key={index} className="flex-row items-center justify-between py-2 border-b border-gray-100">
                <Text className="text-sm font-sans text-gray-900">{insurance.name}</Text>
                <View className={`px-2 py-1 rounded ${insurance.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Text className={`text-xs font-sans-semibold ${insurance.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                    {insurance.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Awards & Recognition */}
        {doctor.profile?.awards && doctor.profile.awards.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="trophy-outline" title="Awards & Recognition" />
            {doctor.profile.awards.map((award: any, index: number) => (
              <View key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
                <Text className="text-sm font-sans-bold text-gray-900 mb-1">{award.title}</Text>
                <Text className="text-sm font-sans text-gray-600 mb-1">{award.organization}</Text>
                <Text className="text-xs font-sans text-gray-500 mb-2">{award.year}</Text>
                {award.description && (
                  <Text className="text-sm font-sans text-gray-700">{award.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Publications */}
        {doctor.profile?.publications && doctor.profile.publications.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="book-outline" title="Research & Publications" />
            {doctor.profile.publications.map((pub: any, index: number) => (
              <View key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
                <Text className="text-sm font-sans-bold text-gray-900 mb-1">{pub.title}</Text>
                {pub.publisher && (
                  <Text className="text-sm font-sans text-gray-600 mb-1">{pub.publisher}</Text>
                )}
                {pub.publicationDate && (
                  <Text className="text-xs font-sans text-gray-500 mb-2">
                    {new Date(pub.publicationDate).toLocaleDateString()}
                  </Text>
                )}
                {pub.description && (
                  <Text className="text-sm font-sans text-gray-700 mb-2">{pub.description}</Text>
                )}
                {pub.url && (
                  <Text className="text-xs font-sans text-primary" numberOfLines={1}>{pub.url}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Supporting Documents */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon="document-attach-outline" title="Supporting Documents" />
          <DocumentCard label="Medical Degree" url={doctor.medicalDegree} />
          <DocumentCard label="Birth Certificate" url={doctor.birthCertificate} />
          <DocumentCard label="Proof of Address" url={doctor.proofOfAddress} />
          <DocumentCard label="ID Photo" url={doctor.idPhoto} />
          <DocumentCard label="Secondary Education" url={doctor.secondaryEducation} />
          <DocumentCard label="Passport" url={doctor.passport} />
          <DocumentCard label="Name Change Document" url={doctor.nameChangeDocument} />
        </View>

        {/* CPD Details */}
        {doctor.cpd && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="school-outline" title="Continuous Professional Development" />
            <InfoRow label="CPD Units" value={doctor.cpd.units?.toString()} />
            <InfoRow
              label="Date Completed"
              value={doctor.cpd.dateCompleted ? new Date(doctor.cpd.dateCompleted).toLocaleDateString() : 'N/A'}
            />
            {doctor.cpd.proof && (
              <View className="mt-3">
                <DocumentCard label="CPD Proof" url={doctor.cpd.proof} />
              </View>
            )}
          </View>
        )}

        {/* Verification Badges */}
        {doctor.verificationBadges && doctor.verificationBadges.length > 0 && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="shield-checkmark" title="Verification Badges" />
            <View className="flex-row flex-wrap">
              {doctor.verificationBadges.map((badge: string, index: number) => (
                <View key={index} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 mr-2 mb-2 flex-row items-center">
                  <MaterialIcons name="verified" size={16} color="#3B82F6" />
                  <Text className="text-sm font-sans-semibold text-blue-700 ml-2 capitalize">{badge}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Bank & Payout Information */}
        {(doctor.bankName || doctor.accountNumber) && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="card-outline" title="Bank & Payout Details" />
            <InfoRow label="Bank Name" value={doctor.bankName} />
            <InfoRow label="Account Number" value={doctor.accountNumber} />
            <InfoRow label="Account Name" value={doctor.accountName} />
            <InfoRow label="Bank Code" value={doctor.bankCode} />
            <View className="flex-row items-center py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-xs font-sans-medium text-gray-500 mb-1">Bank Verified</Text>
              </View>
              <View className={`px-3 py-1 rounded-full ${doctor.bankVerified ? 'bg-green-100' : 'bg-red-100'}`}>
                <Text className={`text-xs font-sans-semibold ${doctor.bankVerified ? 'text-green-700' : 'text-red-700'}`}>
                  {doctor.bankVerified ? 'Verified' : 'Not Verified'}
                </Text>
              </View>
            </View>
            <InfoRow label="Subaccount Code" value={doctor.subaccountCode} />
            <InfoRow label="Payout Recipient Code" value={doctor.payoutRecipientCode} />
            <View className="mt-4 bg-gray-50 rounded-lg p-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm font-sans-medium text-gray-600">Pending Balance:</Text>
                <Text className="text-sm font-sans-bold text-gray-900">
                  ₦{(doctor.pendingBalance || 0).toLocaleString()}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm font-sans-medium text-gray-600">Total Earnings:</Text>
                <Text className="text-sm font-sans-bold text-primary">
                  ₦{(doctor.totalEarnings || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Social Media */}
        {doctor.profile?.socialMedia && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="share-social-outline" title="Social Media & Contact" />
            <InfoRow label="Website" value={doctor.profile.socialMedia.website} icon="globe" />
            <InfoRow label="LinkedIn" value={doctor.profile.socialMedia.linkedin} icon="logo-linkedin" />
            <InfoRow label="Twitter" value={doctor.profile.socialMedia.twitter} icon="logo-twitter" />
            <InfoRow label="Facebook" value={doctor.profile.socialMedia.facebook} icon="logo-facebook" />
            <InfoRow label="Instagram" value={doctor.profile.socialMedia.instagram} icon="logo-instagram" />
          </View>
        )}

        {/* Declarations */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon="checkbox-outline" title="Declarations" />
          <View className="space-y-3">
            <View className="flex-row items-center py-2">
              <Ionicons
                name={doctor.noSanctionsDeclaration ? "checkmark-circle" : "close-circle"}
                size={20}
                color={doctor.noSanctionsDeclaration ? "#10B981" : "#EF4444"}
              />
              <Text className="text-sm font-sans text-gray-700 ml-3 flex-1">
                No Sanctions Declaration
              </Text>
            </View>
            <View className="flex-row items-center py-2">
              <Ionicons
                name={doctor.verificationConsent ? "checkmark-circle" : "close-circle"}
                size={20}
                color={doctor.verificationConsent ? "#10B981" : "#EF4444"}
              />
              <Text className="text-sm font-sans text-gray-700 ml-3 flex-1">
                Verification Consent
              </Text>
            </View>
            <View className="flex-row items-center py-2">
              <Ionicons
                name={doctor.truthDeclaration ? "checkmark-circle" : "close-circle"}
                size={20}
                color={doctor.truthDeclaration ? "#10B981" : "#EF4444"}
              />
              <Text className="text-sm font-sans text-gray-700 ml-3 flex-1">
                Truth Declaration
              </Text>
            </View>
          </View>
        </View>

        {/* Admin Review Information */}
        {(doctor.reviewNotes || doctor.reviewedBy || doctor.reviewedAt) && (
          <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm border border-gray-100 p-6">
            <SectionHeader icon="clipboard-outline" title="Admin Review" />
            {doctor.reviewedBy && (
              <InfoRow label="Reviewed By" value={doctor.reviewedBy.toString()} />
            )}
            {doctor.reviewedAt && (
              <InfoRow
                label="Reviewed At"
                value={new Date(doctor.reviewedAt).toLocaleString()}
              />
            )}
            {doctor.reviewNotes && (
              <View className="mt-3 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <Text className="text-xs font-sans-semibold text-yellow-800 mb-2">REVIEW NOTES</Text>
                <Text className="text-sm font-sans text-yellow-900">{doctor.reviewNotes}</Text>
              </View>
            )}
          </View>
        )}

        {/* System Information */}
        <View className="bg-white mx-4 mt-4 mb-4 rounded-xl shadow-sm border border-gray-100 p-6">
          <SectionHeader icon="information-circle-outline" title="System Information" />
          <InfoRow label="Doctor ID" value={doctor._id} />
          <InfoRow label="User Reference" value={doctor.user?.toString()} />
          <InfoRow label="Expo Push Token" value={doctor.expoPushToken} />
          <InfoRow label="Profile Complete" value={doctor.profile?.isProfileComplete ? 'Yes' : 'No'} />
          <InfoRow
            label="Last Profile Update"
            value={doctor.profile?.lastProfileUpdate ? new Date(doctor.profile.lastProfileUpdate).toLocaleString() : 'N/A'}
          />
          <InfoRow
            label="Created At"
            value={doctor.createdAt ? new Date(doctor.createdAt).toLocaleString() : 'N/A'}
          />
          <InfoRow
            label="Updated At"
            value={doctor.updatedAt ? new Date(doctor.updatedAt).toLocaleString() : 'N/A'}
          />
        </View>

        {/* Bottom spacing for action buttons */}
        <View className="h-20" />
      </ScrollView>

      {/* Fixed Action Buttons */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <View className="bg-white border-t border-gray-200 px-4 py-3">
          {doctor.status === 'pending' ? (
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={handleApprove}
                className="flex-1 bg-primary py-3.5 rounded-xl items-center flex-row justify-center mr-2 shadow-sm"
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text className="text-white font-sans-bold ml-2">Approve Doctor</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReject}
                className="flex-1 bg-red-600 py-3.5 rounded-xl items-center flex-row justify-center ml-2 shadow-sm"
              >
                <Ionicons name="close-circle" size={20} color="white" />
                <Text className="text-white font-sans-bold ml-2">Reject</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row space-x-3">
              {doctor.isActive === true && (
                <TouchableOpacity
                  onPress={handleSuspend}
                  className="flex-1 bg-secondary py-3.5 rounded-xl items-center flex-row justify-center mr-2 shadow-sm"
                >
                  <Ionicons name="pause-circle" size={20} color="white" />
                  <Text className="text-white font-sans-bold ml-2">Suspend</Text>
                </TouchableOpacity>
              )}
              {doctor.isActive === false && (
                <TouchableOpacity
                  onPress={handleUnsuspendDoctor}
                  className="flex-1 bg-secondary py-3.5 rounded-xl items-center flex-row justify-center mr-2 shadow-sm"
                >
                  <Ionicons name="play-circle" size={20} color="white" />
                  <Text className="text-white font-sans-bold ml-2">Unsuspend</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleDelete}
                className="flex-1 bg-red-600 py-3.5 rounded-xl items-center flex-row justify-center ml-2 shadow-sm"
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text className="text-white font-sans-bold ml-2">Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Approve Confirmation Modal */}
      <ConfirmationModal
        visible={approveModalVisible}
        title="Approve Doctor"
        message="Are you sure you want to approve this doctor?"
        confirmText="Approve"
        confirmColor="#67A9AF"
        onConfirm={confirmApprove}
        onCancel={() => setApproveModalVisible(false)}
        icon="checkmark-circle"
        iconColor="#67A9AF"
      />

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        visible={rejectModalVisible}
        title="Reject Doctor"
        message="Please provide a reason for rejection (required):"
        confirmText="Reject"
        confirmColor="#EF4444"
        onConfirm={confirmReject}
        onCancel={() => setRejectModalVisible(false)}
        icon="close-circle"
        iconColor="#EF4444"
      >
        <TextInput
          className="mt-4 p-3 border border-gray-300 rounded-lg text-gray-900"
          placeholder="Enter reason for rejection (required)"
          placeholderTextColor="#000"
          value={rejectReason}
          onChangeText={setRejectReason}
          multiline
          numberOfLines={3}
        />
      </ConfirmationModal>

      {/* Suspend Confirmation Modal */}
      <ConfirmationModal
        visible={suspendModalVisible}
        title="Suspend Doctor"
        message="Please provide a reason for suspension (required):"
        confirmText="Suspend"
        confirmColor="#D65C1E"
        onConfirm={confirmSuspend}
        onCancel={() => setSuspendModalVisible(false)}
        icon="pause-circle"
        iconColor="#D65C1E"
      >
        <TextInput
          className="mt-4 p-3 border border-gray-300 rounded-lg text-gray-900"
          placeholder="Enter reason for suspension (required)"
          placeholderTextColor="#000"
          value={suspendReason}
          onChangeText={setSuspendReason}
          multiline
          numberOfLines={3}
        />
      </ConfirmationModal>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor? This action cannot be undone."
        confirmText="Delete"
        confirmColor="#EF4444"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        icon="trash"
        iconColor="#EF4444"
      />
    </SafeAreaView>
  );
};

export default DoctorDetailsScreen;