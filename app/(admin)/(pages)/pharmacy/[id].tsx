import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Image,
  Modal,
  Platform,
  Share,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  Pharmacy,
  getPharmacy,
  approvePharmacy,
  rejectPharmacy,
} from '@/api/admin/pharmacies';
import { useToast } from '@/components/ui/Toast';

export default function PharmacyDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { showToast } = useToast();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{
    url: string;
    name: string;
    type: 'image' | 'document';
  } | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Update this with your actual API base URL
  const API_BASE_URL = 'https://zydacare-backend.onrender.com';

  const fetchPharmacyDetails = async () => {
    try {
      const response = await getPharmacy(id as string);
      setPharmacy(response);
    } catch (error: any) {
      console.error('Error fetching pharmacy details:', error);
      showToast(error.response?.data?.message || 'Failed to fetch pharmacy details', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPharmacyDetails();
    }
  }, [id]);

  const handleApprovePharmacy = async () => {
    setShowApproveModal(true);
  };

  const handleRejectPharmacy = async () => {
    setShowRejectModal(true);
  };

  const confirmApprovePharmacy = async () => {
    try {
      await approvePharmacy(id as string);
      showToast('Pharmacy approved successfully', 'success');
      setShowApproveModal(false);
      fetchPharmacyDetails();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to approve pharmacy', 'error');
    }
  };

  const confirmRejectPharmacy = async () => {
    if (!rejectionReason || rejectionReason.trim() === '') {
      showToast('Please provide a rejection reason', 'error');
      return;
    }
    try {
      await rejectPharmacy(id as string, rejectionReason);
      showToast('Pharmacy rejected successfully', 'success');
      setShowRejectModal(false);
      setRejectionReason('');
      fetchPharmacyDetails();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to reject pharmacy', 'error');
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'invited': 
        return { 
          color: '#F59E0B', 
          bg: '#FEF3C7', 
          icon: 'mail-outline',
          text: 'Invited'
        };
      case 'onboarding': 
        return { 
          color: '#3B82F6', 
          bg: '#DBEAFE', 
          icon: 'time-outline',
          text: 'Onboarding'
        };
      case 'onboarded': 
        return { 
          color: '#8B5CF6', 
          bg: '#EDE9FE', 
          icon: 'hourglass-outline',
          text: 'Pending Approval'
        };
      case 'approved': 
        return { 
          color: '#10B981', 
          bg: '#D1FAE5', 
          icon: 'checkmark-circle',
          text: 'Approved'
        };
      case 'rejected': 
        return { 
          color: '#EF4444', 
          bg: '#FEE2E2', 
          icon: 'close-circle',
          text: 'Rejected'
        };
      case 'expired': 
        return { 
          color: '#6B7280', 
          bg: '#F3F4F6', 
          icon: 'alert-circle-outline',
          text: 'Expired'
        };
      default: 
        return { 
          color: '#6B7280', 
          bg: '#F3F4F6', 
          icon: 'help-circle-outline',
          text: status
        };
    }
  };

  const openMapLocation = (location: string) => {
    if (location) {
      Linking.openURL(location);
    }
  };

  const getDocumentType = (path: string): 'image' | 'document' => {
    const extension = path.split('.').pop()?.toLowerCase();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    
    if (imageExtensions.includes(extension || '')) {
      return 'image';
    }
    return 'document'; // Includes PDF, Word, Excel, PowerPoint, etc.
  };

  const getDocumentName = (key: string): string => {
    const names: Record<string, string> = {
      pcnCertificate: 'PCN Certificate',
      pharmacistLicense: 'Pharmacist License',
      pharmacistValidId: 'Pharmacist Valid ID',
      premisesLicense: 'Premises License',
    };
    return names[key] || key;
  };

  const openDocument = (path: string, name: string) => {
    // Check if it's already a full Cloudinary URL or a local path
    const fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    const type = getDocumentType(path);
    
    if (type === 'image') {
      // For images, show in modal
      setImageLoading(true);
      setSelectedDocument({
        url: fullUrl,
        name,
        type,
      });
    } else {
      // For all documents (PDF, Word, etc.), download and open with native app
      handleOpenDocument(fullUrl, name, path);
    }
  };

  const handleOpenDocument = async (url: string, fileName: string, originalPath: string) => {
    try {
      setDownloadingDoc(true);
      showToast('Opening document...', 'info');

      console.log('Opening document in browser:', url);
      console.log('File name:', fileName);

      // Just open the URL directly in browser
      await Linking.openURL(url);
      showToast('Document opened in browser', 'success');

    } catch (error: any) {
      console.error('Error opening document:', error);
      console.error('Error details:', {
        url,
        fileName,
        originalPath,
        error: error.message,
        stack: error.stack
      });
      
      showToast('Failed to open document. Please try again.', 'error');
    } finally {
      setDownloadingDoc(false);
    }
  };

  const handleShareDocument = async () => {
    if (!selectedDocument) return;

    try {
      const result = await Share.share({
        message: `View ${selectedDocument.name}`,
        url: selectedDocument.url,
        title: selectedDocument.name,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
        } else {
          // Shared
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      showToast('Failed to share document', 'error');
    }
  };

  const handleDownloadAndShare = async (url: string, name: string, type: string) => {
    try {
      const result = await Share.share({
        message: `View ${name}`,
        url: url,
        title: name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('Failed to share document', 'error');
    }
  };

  const getAvailableDocuments = () => {
    if (!pharmacy) return [];
    
    const documents: Array<{ key: string; path: string; name: string; type: 'image' | 'document' }> = [];
    
    if (pharmacy.pcnCertificate) {
      documents.push({
        key: 'pcnCertificate',
        path: pharmacy.pcnCertificate,
        name: getDocumentName('pcnCertificate'),
        type: getDocumentType(pharmacy.pcnCertificate),
      });
    }
    if (pharmacy.pharmacistLicense) {
      documents.push({
        key: 'pharmacistLicense',
        path: pharmacy.pharmacistLicense,
        name: getDocumentName('pharmacistLicense'),
        type: getDocumentType(pharmacy.pharmacistLicense),
      });
    }
    if (pharmacy.pharmacistValidId) {
      documents.push({
        key: 'pharmacistValidId',
        path: pharmacy.pharmacistValidId,
        name: getDocumentName('pharmacistValidId'),
        type: getDocumentType(pharmacy.pharmacistValidId),
      });
    }
    if (pharmacy.premisesLicense) {
      documents.push({
        key: 'premisesLicense',
        path: pharmacy.premisesLicense,
        name: getDocumentName('premisesLicense'),
        type: getDocumentType(pharmacy.premisesLicense),
      });
    }
    
    return documents;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </SafeAreaView>
    );
  }

  if (!pharmacy) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center px-6">
        <View className="items-center">
          <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
            <Feather name="alert-circle" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-xl font-sans-bold text-gray-900 mb-2">Pharmacy Not Found</Text>
          <Text className="text-gray-500 font-sans text-center">
            The pharmacy you're looking for doesn't exist or has been removed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = getStatusConfig(pharmacy.status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerTitle: '',
          headerTransparent: true,
        }}
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPharmacyDetails} />
        }
      >
        {/* Hero Header with Gradient */}
        <View className="bg-[#67A9AF] pt-16 pb-16 px-6">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1">
              <View 
                style={{ backgroundColor: statusConfig.bg }} 
                className="px-3 py-1.5 rounded-full self-start mb-3 flex-row items-center"
              >
                <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
                <Text 
                  style={{ color: statusConfig.color }} 
                  className="text-xs font-sans-semibold ml-1.5"
                >
                  {statusConfig.text}
                </Text>
              </View>
              <Text className="text-2xl font-sans-bold text-white mb-2">
                {pharmacy.pharmacyName}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/80 font-sans ml-1">{pharmacy.city}</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions for Pending Approval */}
          {pharmacy.status === 'onboarded' && (
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={handleApprovePharmacy}
                className="flex-1 bg-white/20 backdrop-blur-lg rounded-xl py-3 flex-row items-center justify-center"
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text className="text-white font-sans-semibold ml-2">Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRejectPharmacy}
                className="flex-1 bg-white/20 backdrop-blur-lg rounded-xl py-3 flex-row items-center justify-center"
              >
                <Ionicons name="close-circle-outline" size={20} color="white" />
                <Text className="text-white font-sans-semibold ml-2">Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Contact Quick Actions */}
        <View className="px-6 -mt-6 mb-6">
          <View className="bg-white rounded-2xl shadow-lg p-4">
            <View className="flex-row justify-around">
              <TouchableOpacity 
                onPress={() => Linking.openURL(`tel:${pharmacy.phone}`)}
                className="items-center flex-1"
              >
                <View className="w-12 h-12 bg-[#67A9AF]/10 rounded-full items-center justify-center mb-2">
                  <Ionicons name="call" size={20} color="#67A9AF" />
                </View>
                <Text className="text-xs font-sans-medium text-gray-600">Call</Text>
              </TouchableOpacity>

              <View className="w-px bg-gray-200" />

              <TouchableOpacity 
                onPress={() => Linking.openURL(`mailto:${pharmacy.email}`)}
                className="items-center flex-1"
              >
                <View className="w-12 h-12 bg-[#67A9AF]/10 rounded-full items-center justify-center mb-2">
                  <Ionicons name="mail" size={20} color="#67A9AF" />
                </View>
                <Text className="text-xs font-sans-medium text-gray-600">Email</Text>
              </TouchableOpacity>

              <View className="w-px bg-gray-200" />

              <TouchableOpacity 
                onPress={() => pharmacy.googleMapLocation && openMapLocation(pharmacy.googleMapLocation)}
                className="items-center flex-1"
                disabled={!pharmacy.googleMapLocation}
              >
                <View className="w-12 h-12 bg-[#67A9AF]/10 rounded-full items-center justify-center mb-2">
                  <Ionicons name="map" size={20} color={pharmacy.googleMapLocation ? "#67A9AF" : "#D1D5DB"} />
                </View>
                <Text className="text-xs font-sans-medium text-gray-600">Map</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Info Cards */}
        <View className="px-6 space-y-4">
          {/* Primary Contact Info */}
          <View className="bg-white rounded-2xl shadow-sm p-5">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-[#67A9AF]/10 rounded-full items-center justify-center">
                <Ionicons name="person-outline" size={20} color="#67A9AF" />
              </View>
              <Text className="text-lg font-sans-bold text-gray-900 ml-3">Contact Person</Text>
            </View>
            
            <InfoRow icon="person" label="Name" value={pharmacy.contactPerson} />
            <InfoRow icon="call" label="Phone" value={pharmacy.phone} />
            <InfoRow icon="mail" label="Email" value={pharmacy.email} />
            <InfoRow icon="pricetag" label="Invite Code" value={pharmacy.inviteCode} />
          </View>

          {/* Pharmacy Identity */}
          {(pharmacy.pcnRegistrationNumber || pharmacy.yearOfRegistration || pharmacy.address) && (
            <View className="bg-white rounded-2xl shadow-sm p-5">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                  <Ionicons name="shield-checkmark-outline" size={20} color="#3B82F6" />
                </View>
                <Text className="text-lg font-sans-bold text-gray-900 ml-3">Registration</Text>
              </View>

              {pharmacy.pcnRegistrationNumber && (
                <InfoRow icon="document-text" label="PCN Number" value={pharmacy.pcnRegistrationNumber} />
              )}
              {pharmacy.yearOfRegistration && (
                <InfoRow icon="calendar" label="Year Registered" value={pharmacy.yearOfRegistration.toString()} />
              )}
              {pharmacy.pharmacyType && (
                <InfoRow icon="business" label="Type" value={pharmacy.pharmacyType} />
              )}
              
              {pharmacy.address && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <Text className="text-xs font-sans-semibold text-gray-500 mb-2">PHYSICAL ADDRESS</Text>
                  <View className="bg-gray-50 p-4 rounded-xl">
                    {pharmacy.address.street && (
                      <Text className="text-gray-900 font-sans mb-1">{pharmacy.address.street}</Text>
                    )}
                    {pharmacy.address.city && pharmacy.address.state && (
                      <Text className="text-gray-900 font-sans mb-1">
                        {pharmacy.address.city}, {pharmacy.address.state}
                      </Text>
                    )}
                    {pharmacy.address.zipCode && (
                      <Text className="text-gray-600 font-sans">{pharmacy.address.zipCode}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Pharmacist Details */}
          {(pharmacy.superintendentPharmacistName || pharmacy.pharmacistPcnNumber) && (
            <View className="bg-white rounded-2xl shadow-sm p-5">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                  <Ionicons name="medical-outline" size={20} color="#8B5CF6" />
                </View>
                <Text className="text-lg font-sans-bold text-gray-900 ml-3">Pharmacist</Text>
              </View>

              {pharmacy.superintendentPharmacistName && (
                <InfoRow icon="person" label="Name" value={pharmacy.superintendentPharmacistName} />
              )}
              {pharmacy.pharmacistPcnNumber && (
                <InfoRow icon="card" label="PCN Number" value={pharmacy.pharmacistPcnNumber} />
              )}
              {pharmacy.pharmacistPhone && (
                <InfoRow icon="call" label="Phone" value={pharmacy.pharmacistPhone} />
              )}
              {pharmacy.pharmacistEmail && (
                <InfoRow icon="mail" label="Email" value={pharmacy.pharmacistEmail} />
              )}
            </View>
          )}

          {/* Operations */}
          {(pharmacy.deliveryRadius || pharmacy.emergencyAvailability !== undefined) && (
            <View className="bg-white rounded-2xl shadow-sm p-5">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                  <Ionicons name="settings-outline" size={20} color="#10B981" />
                </View>
                <Text className="text-lg font-sans-bold text-gray-900 ml-3">Operations</Text>
              </View>

              {pharmacy.deliveryRadius && (
                <InfoRow icon="bicycle" label="Delivery Radius" value={`${pharmacy.deliveryRadius} km`} />
              )}
              {pharmacy.emergencyAvailability !== undefined && (
                <InfoRow 
                  icon="medical" 
                  label="Emergency Services" 
                  value={pharmacy.emergencyAvailability ? 'Available' : 'Not Available'} 
                />
              )}

              {pharmacy.supportedDrugCategories && pharmacy.supportedDrugCategories.length > 0 && (
                <View className="mt-3 pt-3 border-t border-gray-100">
                  <Text className="text-xs font-sans-semibold text-gray-500 mb-3">DRUG CATEGORIES</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {pharmacy.supportedDrugCategories.map((category, index) => (
                      <View key={index} className="bg-green-50 px-3 py-2 rounded-lg">
                        <Text className="text-green-700 text-xs font-sans-medium">{category}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Payment Info */}
          {(pharmacy.bankName || pharmacy.accountNumber) && (
            <View className="bg-white rounded-2xl shadow-sm p-5">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-amber-50 rounded-full items-center justify-center">
                  <Ionicons name="card-outline" size={20} color="#F59E0B" />
                </View>
                <Text className="text-lg font-sans-bold text-gray-900 ml-3">Payment Details</Text>
              </View>

              {pharmacy.bankName && (
                <InfoRow icon="business" label="Bank" value={pharmacy.bankName} />
              )}
              {pharmacy.accountNumber && (
                <InfoRow icon="card" label="Account" value={`****${pharmacy.accountNumber.slice(-4)}`} />
              )}
              {pharmacy.accountName && (
                <InfoRow icon="person" label="Account Name" value={pharmacy.accountName} />
              )}
              {pharmacy.settlementPreference && (
                <InfoRow icon="time" label="Settlement" value={pharmacy.settlementPreference} capitalize />
              )}
            </View>
          )}

          {/* License & Documents */}
          {(pharmacy.licenseNumber || pharmacy.licenseExpiry || getAvailableDocuments().length > 0) && (
            <View className="bg-white rounded-2xl shadow-sm p-5">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-cyan-50 rounded-full items-center justify-center">
                  <Ionicons name="document-text-outline" size={20} color="#06B6D4" />
                </View>
                <Text className="text-lg font-sans-bold text-gray-900 ml-3">License & Documents</Text>
              </View>

              {pharmacy.licenseNumber && (
                <InfoRow icon="ribbon" label="License Number" value={pharmacy.licenseNumber} />
              )}
              {pharmacy.licenseExpiry && (
                <InfoRow 
                  icon="calendar" 
                  label="License Expiry" 
                  value={new Date(pharmacy.licenseExpiry).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })} 
                />
              )}

              {getAvailableDocuments().length > 0 && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <Text className="text-xs font-sans-semibold text-gray-500 mb-3">UPLOADED DOCUMENTS</Text>
                  <View className="gap-3">
                    {getAvailableDocuments().map((doc) => (
                      <TouchableOpacity
                        key={doc.key}
                        onPress={() => openDocument(doc.path, doc.name)}
                        className="flex-row items-center justify-between bg-gray-50 p-3 rounded-xl active:bg-gray-100"
                      >
                        <View className="flex-row items-center flex-1">
                          <View className={`w-10 h-10 rounded-lg items-center justify-center ${
                            doc.type === 'document' ? 'bg-red-100' : 'bg-blue-100'
                          }`}>
                            <Ionicons 
                              name={doc.type === 'document' ? 'document-text' : 'image'} 
                              size={20} 
                              color={doc.type === 'document' ? '#EF4444' : '#3B82F6'} 
                            />
                          </View>
                          <View className="ml-3 flex-1">
                            <Text className="text-gray-900 font-sans-medium">{doc.name}</Text>
                            <Text className="text-gray-500 text-xs font-sans mt-0.5">
                              {doc.type.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Compliance */}
          {pharmacy.agreements && (
            <View className="bg-white rounded-2xl shadow-sm p-5">
              <View className="flex-row items-center mb-4">
                <View className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center">
                  <Ionicons name="checkbox-outline" size={20} color="#6366F1" />
                </View>
                <Text className="text-lg font-sans-bold text-gray-900 ml-3">Compliance</Text>
              </View>

              <View className="gap-3">
                <ComplianceItem 
                  checked={pharmacy.agreements.validPrescriptions || false}
                  label="Valid prescriptions only"
                />
                <ComplianceItem 
                  checked={pharmacy.agreements.noCounterfeitDrugs || false}
                  label="No counterfeit drugs"
                />
                <ComplianceItem 
                  checked={pharmacy.agreements.acceptAudits || false}
                  label="Accept audits"
                />
                <ComplianceItem 
                  checked={pharmacy.agreements.followDeliverySOP || false}
                  label="Follow delivery SOP"
                />
              </View>

              {pharmacy.digitalSignature && (
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <Text className="text-xs font-sans-semibold text-gray-500 mb-2">DIGITAL SIGNATURE</Text>
                  <View className="bg-indigo-50 p-4 rounded-xl">
                    <Text className="text-indigo-900 font-serif italic text-lg">
                      {pharmacy.digitalSignature}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Timeline */}
          <View className="bg-white rounded-2xl shadow-sm p-5 mb-8">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
                <Ionicons name="time-outline" size={20} color="#6B7280" />
              </View>
              <Text className="text-lg font-sans-bold text-gray-900 ml-3">Timeline</Text>
            </View>

            <View className="gap-3">
              <TimelineItem 
                icon="add-circle" 
                label="Created" 
                date={pharmacy.createdAt} 
              />
              {pharmacy.verifiedAt && (
                <TimelineItem 
                  icon="checkmark-circle" 
                  label="Verified" 
                  date={pharmacy.verifiedAt} 
                />
              )}
              {pharmacy.approvedAt && (
                <TimelineItem 
                  icon="shield-checkmark" 
                  label="Approved" 
                  date={pharmacy.approvedAt} 
                />
              )}
              {pharmacy.expiresAt && (
                <TimelineItem 
                  icon="calendar" 
                  label="Expires" 
                  date={pharmacy.expiresAt} 
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Document Viewer Modal - Only for Images */}
      <Modal
        visible={selectedDocument !== null && selectedDocument.type === 'image'}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setSelectedDocument(null);
          setImageLoading(false);
        }}
      >
        <SafeAreaView className="flex-1 bg-black">
          {/* Header */}
          <View className="px-4 py-3 bg-black/95">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-white font-sans-semibold text-base" numberOfLines={1}>
                  {selectedDocument?.name}
                </Text>
                <Text className="text-white/60 font-sans text-xs mt-0.5">
                  Image Document
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setSelectedDocument(null);
                  setImageLoading(false);
                }}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Container */}
          <View className="flex-1 items-center justify-center bg-black">
            {imageLoading && (
              <View className="absolute z-10">
                <ActivityIndicator size="large" color="#67A9AF" />
              </View>
            )}
            
            {selectedDocument?.url && (
              <Image
                source={{ uri: selectedDocument.url }}
                style={{ 
                  width: '100%', 
                  height: '100%',
                }}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={(error) => {
                  console.error('Image load error:', error);
                  setImageLoading(false);
                  showToast('Failed to load image', 'error');
                }}
              />
            )}
          </View>

          {/* Actions Footer */}
          <View className="px-4 py-4 bg-black/95 border-t border-white/10">
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => selectedDocument && handleDownloadAndShare(selectedDocument.url, selectedDocument.name, selectedDocument.type)}
                disabled={downloadingDoc}
                className="flex-1 bg-white/10 py-3.5 rounded-xl flex-row items-center justify-center active:bg-white/20"
              >
                {downloadingDoc ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="share-outline" size={20} color="white" />
                    <Text className="text-white font-sans-semibold ml-2">Share</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => selectedDocument && Linking.openURL(selectedDocument.url)}
                className="flex-1 bg-[#67A9AF] py-3.5 rounded-xl flex-row items-center justify-center active:bg-[#5A9299]"
              >
                <Ionicons name="open-outline" size={20} color="white" />
                <Text className="text-white font-sans-semibold ml-2">Open External</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Approve Modal */}
      <Modal
        visible={showApproveModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowApproveModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-primary/30 rounded-full items-center justify-center mb-4">
                <Ionicons name="checkmark-circle" size={32} color="#67A9AF" />
              </View>
              <Text className="text-xl font-sans-bold text-gray-900 text-center mb-2">
                Approve Pharmacy
              </Text>
              <Text className="text-gray-600 font-sans text-center text-sm">
                Are you sure you want to approve this pharmacy? They will gain access to the dashboard and can start managing orders.
              </Text>
            </View>
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowApproveModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-sans-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmApprovePharmacy}
                className="flex-1 bg-primary py-3 rounded-xl items-center"
              >
                <Text className="text-white font-sans-semibold">Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <View className="items-center mb-6">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="close-circle" size={32} color="#EF4444" />
              </View>
              <Text className="text-xl font-sans-bold text-gray-900 text-center mb-2">
                Reject Pharmacy
              </Text>
              <Text className="text-gray-600 font-sans text-center text-sm mb-4">
                Please provide a reason for rejecting this pharmacy application.
              </Text>
            </View>
            
            <TextInput
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-gray-900 font-sans"
              placeholder="Enter rejection reason..."
              placeholderTextColor="#9CA3AF"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-100 py-3 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-sans-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRejectPharmacy}
                className="flex-1 bg-red-500 py-3 rounded-xl items-center"
              >
                <Text className="text-white font-sans-semibold">Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay for Document Downloads */}
      {downloadingDoc && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
          <View className="bg-white rounded-2xl p-6 items-center mx-6">
            <ActivityIndicator size="large" color="#67A9AF" />
            <Text className="text-gray-900 font-sans-semibold mt-4">
              Opening Document...
            </Text>
            <Text className="text-gray-500 font-sans text-sm text-center mt-2">
              Please wait while we prepare your document
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Helper Components
interface InfoRowProps {
  icon: string;
  label: string;
  value: string;
  capitalize?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, capitalize }) => (
  <View className="flex-row items-center py-2.5">
    <Ionicons name={icon as any} size={16} color="#9CA3AF" />
    <Text className="text-gray-500 font-sans-medium text-sm ml-2 w-28">{label}</Text>
    <Text className={`flex-1 text-gray-900 font-sans ${capitalize ? 'capitalize' : ''}`}>
      {value}
    </Text>
  </View>
);

interface ComplianceItemProps {
  checked: boolean;
  label: string;
}

const ComplianceItem: React.FC<ComplianceItemProps> = ({ checked, label }) => (
  <View className="flex-row items-center">
    <View className={`w-5 h-5 rounded-full items-center justify-center ${checked ? 'bg-green-100' : 'bg-red-100'}`}>
      <Ionicons 
        name={checked ? "checkmark" : "close"} 
        size={14} 
        color={checked ? "#10B981" : "#EF4444"} 
      />
    </View>
    <Text className="text-gray-700 font-sans ml-3">{label}</Text>
  </View>
);

interface TimelineItemProps {
  icon: string;
  label: string;
  date: string;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ icon, label, date }) => (
  <View className="flex-row items-center">
    <Ionicons name={icon as any} size={18} color="#67A9AF" />
    <Text className="text-gray-500 font-sans-medium text-sm ml-2 w-24">{label}</Text>
    <Text className="flex-1 text-gray-900 font-sans">
      {new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })}
    </Text>
  </View>
);