import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import {
  Pharmacy,
  PharmacyInviteData,
  getPharmacies,
  createPharmacyInvite,
  resendPharmacyInvite,
  getPharmacyStats,
  approvePharmacy,
  rejectPharmacy,
  getPharmacy,
  PharmacyStats,
} from '@/api/admin/pharmacies';
import { useToast } from '@/components/ui/Toast';

export default function PharmaciesScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [stats, setStats] = useState<PharmacyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [formData, setFormData] = useState<PharmacyInviteData>({
    pharmacyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    city: '',
    pharmacyType: 'Community Pharmacy',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPharmacies = async () => {
    try {
      const response = await getPharmacies();
      setPharmacies(response.data);
      
      // Fetch stats
      const statsData = await getPharmacyStats();
      setStats(statsData);
    } catch (error: any) {
      console.error('Error fetching pharmacies:', error);
      showToast(error.response?.data?.message || 'Failed to fetch pharmacies', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const handleInvitePharmacy = async () => {
    if (!formData.pharmacyName || !formData.contactPerson || !formData.email || !formData.phone || !formData.city) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createPharmacyInvite(formData);

      showToast(`Pharmacy invite sent! Invite code: ${response.inviteCode}`, 'success');
      setShowInviteModal(false);
      setFormData({
        pharmacyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        city: '',
        pharmacyType: 'Community Pharmacy',
      });
      fetchPharmacies();
    } catch (error: any) {
      console.error('Error creating pharmacy invite:', error);
      showToast(error.response?.data?.message || 'Failed to send pharmacy invite', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'invited': return 'text-yellow-600 bg-yellow-50';
      case 'onboarding': return 'text-blue-600 bg-blue-50';
      case 'onboarded': return 'text-purple-600 bg-purple-50';
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'expired': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'invited': return 'Invited';
      case 'onboarding': return 'Onboarding';
      case 'onboarded': return 'Pending Approval';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  const copyInviteLink = async (link: string) => {
    try {
      await Clipboard.setString(link);
      showToast('Invite link copied to clipboard', 'success');
    } catch (error) {
      showToast('Failed to copy invite link', 'error');
    }
  };

  const resendInvite = async (pharmacyId: string) => {
    try {
      await resendPharmacyInvite(pharmacyId);
      showToast('Invite resent successfully', 'success');
      fetchPharmacies();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to resend invite', 'error');
    }
  };

  const viewPharmacyDetails = (pharmacyId: string) => {
    router.push(`/(admin)/(pages)/pharmacy/${pharmacyId}`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerTitle: 'Pharmacy Management',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setShowInviteModal(true)}
              className="mr-4 bg-[#67A9AF] p-2 rounded-lg"
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchPharmacies} />
        }
      >
        <View className="mb-6">
          <Text className="text-2xl font-sans-semibold text-gray-900 mb-2">
            Pharmacy Partners
          </Text>
          <Text className="text-gray-600 font-sans-medium">
            Manage pharmacy invitations and onboarding
          </Text>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View className="flex-row mb-6 gap-2">
            <View className="flex-1 bg-white p-3 rounded-xl shadow-sm">
              <Text className="text-gray-500 text-xs font-sans mb-1">Total</Text>
              <Text className="text-xl font-bold text-gray-900">
                {stats.total}
              </Text>
            </View>
            <View className="flex-1 bg-white p-3 rounded-xl shadow-sm">
              <Text className="text-gray-500 text-xs font-sans mb-1">Invited</Text>
              <Text className="text-xl font-bold text-yellow-600">
                {stats.invited}
              </Text>
            </View>
            <View className="flex-1 bg-white p-3 rounded-xl shadow-sm">
              <Text className="text-gray-500 text-xs font-sans mb-1">Pending</Text>
              <Text className="text-xl font-bold text-purple-600">
                {stats.onboarded}
              </Text>
            </View>
            <View className="flex-1 bg-white p-3 rounded-xl shadow-sm">
              <Text className="text-gray-500 text-xs font-sans mb-1">Approved</Text>
              <Text className="text-xl font-bold text-green-600">
                {stats.approved}
              </Text>
            </View>
          </View>
        )}

        {/* Pharmacy List */}
        <View className="space-y-4">
          {pharmacies.map((pharmacy) => (
            <View key={pharmacy._id} className="bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-sans-semibold text-gray-900">
                    {pharmacy.pharmacyName}
                  </Text>
                  <Text className="text-gray-600 font-sans text-sm">
                    {pharmacy.contactPerson} • {pharmacy.city}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${getStatusColor(pharmacy.status)}`}>
                  <Text className="text-xs font-sans-medium capitalize">
                    {getStatusText(pharmacy.status)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center text-gray-500 text-sm mb-3">
                <Ionicons name="mail" size={14} className="mr-1" />
                <Text className="mr-4 font-sans">{pharmacy.email}</Text>
                <Ionicons name="call" size={14} className="mr-1" />
                <Text className="font-sans">{pharmacy.phone}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1 font-sans">Invite Code</Text>
                  <Text className="font-sans text-sm text-gray-900">
                    {pharmacy.inviteCode}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => viewPharmacyDetails(pharmacy._id)}
                    className="p-2 bg-gray-100 rounded-lg"
                  >
                    <Feather name="eye" size={16} color="#64748b" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => copyInviteLink(pharmacy.inviteLink)}
                    className="p-2 bg-gray-100 rounded-lg"
                  >
                    <Feather name="copy" size={16} color="#64748b" />
                  </TouchableOpacity>
                  {pharmacy.status === 'invited' && (
                    <TouchableOpacity
                      onPress={() => resendInvite(pharmacy._id)}
                      className="p-2 bg-blue-100 rounded-lg"
                    >
                      <Feather name="send" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {pharmacy.expiresAt && (
                <Text className="text-xs font-sans text-gray-500 mt-2">
                  Expires: {new Date(pharmacy.expiresAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          ))}

          {pharmacies.length === 0 && (
            <View className="bg-white rounded-xl p-8 text-center">
              <Feather name="shield" size={48} color="#E5E7EB" className="mx-auto mb-4" />
              <Text className="text-gray-900 font-sans-semibold mb-2 text-center">
                No pharmacies invited yet
              </Text>
              <Text className="text-gray-600 font-sans text-sm mb-6 text-center">
                Start by inviting your first pharmacy partner
              </Text>
              <TouchableOpacity
                onPress={() => setShowInviteModal(true)}
                className="bg-[#67A9AF] px-4 py-3 rounded-lg"
              >
                <Text className="text-white text-[16px] font-sans-medium text-center">INVITE PHARMACY</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text className="text-lg font-sans-semibold text-center">Invite Pharmacy</Text>
            <View className="w-6" />
          </View>

          <ScrollView className="flex-1 p-4">
            <Text className="text-gray-600 font-sans mb-6">
              Send an invitation to a pharmacy to join ZydaCare platform
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-gray-700 font-sans-medium mb-2">Pharmacy Name *</Text>
                <TextInput
                  value={formData.pharmacyName}
                  onChangeText={(text) => setFormData({ ...formData, pharmacyName: text })}
                  className="border border-gray-300 rounded-lg font-sans px-4 py-3"
                  placeholder="Enter pharmacy name"
                />
              </View>

              <View>
                <Text className="text-gray-700 font-sans-medium mb-2 mt-4">Contact Person *</Text>
                <TextInput
                  value={formData.contactPerson}
                  onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                  className="border border-gray-300 font-sans rounded-lg px-4 py-3"
                  placeholder="Enter contact person name"
                />
              </View>

              <View>
                <Text className="text-gray-700 font-sans-medium mb-2 mt-4">Email Address *</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  className="border border-gray-300 font-sans rounded-lg px-4 py-3"
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View>
                <Text className="text-gray-700 font-sans-medium mb-2 mt-4">Phone Number *</Text>
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  className="border border-gray-300 font-sans rounded-lg px-4 py-3"
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className="text-gray-700 font-sans-medium mb-2 mt-4">City/Area *</Text>
                <TextInput
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  className="border border-gray-300 font-sans rounded-lg px-4 py-3"
                  placeholder="Enter city or area"
                />
              </View>

              <View>
                <Text className="text-gray-700 font-sans-medium mb-2 mt-4">Pharmacy Type *</Text>
                <View className="flex-row gap-3">
                  {(['Community Pharmacy', 'Hospital Pharmacy', 'Retail Pharmacy Chain', 'Independent Pharmacy', 'Clinical Pharmacy', 'Compounding Pharmacy', 'Wholesale Pharmacy'] as const).map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setFormData({ ...formData, pharmacyType: type })}
                      className={`flex-1 p-3 rounded-lg border-2 ${
                        formData.pharmacyType === type
                          ? 'border-[#67A9AF] bg-[#67A9AF]/10'
                          : 'border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-center text-xs ${
                          formData.pharmacyType === type
                            ? 'text-[#67A9AF] font-sans-medium'
                            : 'text-gray-700 font-sans'
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View className="mt-8 mb-4">
              <TouchableOpacity
                onPress={handleInvitePharmacy}
                disabled={submitting}
                className={`bg-[#67A9AF] p-4 rounded-lg ${
                  submitting ? 'opacity-50' : ''
                }`}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans-semibold text-center">
                    Send Invitation
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
