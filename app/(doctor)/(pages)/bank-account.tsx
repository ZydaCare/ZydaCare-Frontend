import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { getBanks, addBankDetails, resolveAccount } from '@/api/doctor/earnings';

export default function BankAccountScreen() {
  const router = useRouter();
  const { doctorProfile, getDoctorProfile } = useAuth();
  const { showToast } = useToast();
  
  const [bankDetails, setBankDetails] = useState<{
    bankName?: string;
    bankCode?: string;
    accountNumber?: string;
    accountName?: string;
    bankVerified?: boolean;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });
  
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([]);
  const [showBankModal, setShowBankModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBanks, setFilteredBanks] = useState<Array<{ name: string; code: string }>>([]);

  // Filter banks based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = banks.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bank.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBanks(filtered);
    } else {
      setFilteredBanks(banks);
    }
  }, [searchQuery, banks]);

  // Load bank details from doctor profile and banks list
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load bank details from doctor profile
        if (doctorProfile) {
          const details = {
            bankName: doctorProfile.bankName,
            bankCode: doctorProfile.bankCode,
            accountNumber: doctorProfile.accountNumber,
            accountName: doctorProfile.accountName,
            bankVerified: doctorProfile.bankVerified
          };
          
          setBankDetails(details);
          setFormData({
            bankName: details.bankName || '',
            bankCode: details.bankCode || '',
            accountNumber: details.accountNumber || '',
            accountName: details.accountName || '',
          });
        }
        
        // Load banks list if not already loaded
        if (banks.length === 0) {
          const banksResponse = await getBanks();
          if (banksResponse.success) {
            setBanks(banksResponse.data);
            setFilteredBanks(banksResponse.data);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load bank details', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset verification error when user makes changes
    if (verificationError) setVerificationError('');
  };

  const handleBankSelect = (bank: { name: string; code: string }) => {
    setFormData(prev => ({
      ...prev,
      bankName: bank.name,
      bankCode: bank.code,
      accountName: '', // Reset account name when bank changes
    }));
    setShowBankModal(false);
    
    // Auto-verify if we have an account number
    if (formData.accountNumber && formData.accountNumber.length === 10) {
      verifyAccount();
    }
  };

  const verifyAccount = async (): Promise<boolean> => {
    const { accountNumber, bankCode } = formData;
    if (!accountNumber || !bankCode) {
      setVerificationError('Please select a bank and enter account number');
      return false;
    }
    
    if (accountNumber.length !== 10) {
      setVerificationError('Account number must be 10 digits');
      return false;
    }
    
    setIsVerifying(true);
    setVerificationError('');

    try {
      const response = await resolveAccount(accountNumber, bankCode);
      if (response.success && response.data) {
        setFormData(prev => ({
          ...prev,
          accountName: response.data.account_name,
        }));
        return true;
      } else {
        setVerificationError(response.message || 'Failed to verify account');
        return false;
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      setVerificationError('Error verifying account. Please try again.');
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAccountNumberChange = (text: string) => {
    // Only allow numbers and limit to 10 digits
    const cleanedText = text.replace(/\D/g, '').slice(0, 10);
    handleInputChange('accountNumber', cleanedText);
    
    // Auto-verify when we have 10 digits and a bank code
    if (cleanedText.length === 10 && formData.bankCode) {
      verifyAccount();
    }
  };

  const handleSaveChanges = async () => {
    const { bankCode, accountNumber, accountName, bankName } = formData;
    
    if (!bankCode || !accountNumber || !accountName || !bankName) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Verify account before saving
    const isVerified = await verifyAccount();
    if (!isVerified) {
      showToast('Please verify your bank account first', 'error');
      return;
    }

    try {
      setIsUpdating(true);
      const response = await addBankDetails({
        bankName: bankName,
        bankCode: bankCode,
        accountNumber: accountNumber,
        accountName: accountName,
      });

      if (response.success) {
        await getDoctorProfile(); // Refresh doctor profile
        setBankDetails({
          bankName,
          bankCode,
          accountNumber,
          accountName,
          bankVerified: false // Will be updated after refresh
        });
        setShowEditForm(false);
        showToast('Bank details saved successfully', 'success');
      } else {
        showToast(response.message || 'Failed to save bank details', 'error');
      }
    } catch (error) {
      console.error('Error saving bank details:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-4 py-6">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-2xl font-sans-bold text-gray-900">Bank Account</Text>
          </View>

          {!showEditForm ? (
            // View Mode
            <View className="bg-white rounded-xl p-6 shadow-sm">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-lg font-sans-semibold text-gray-900">Bank Details</Text>
                <TouchableOpacity 
                  onPress={() => setShowEditForm(true)}
                  className="p-2"
                >
                  <Ionicons name="pencil" size={20} color="#4B5563" />
                </TouchableOpacity>
              </View>

              {bankDetails?.accountNumber ? (
                <View className="space-y-4">
                  <View className="mb-4">
                    <Text className="text-sm font-sans-medium text-gray-500">Bank Name</Text>
                    <Text className="text-base font-sans text-gray-900">{bankDetails.bankName}</Text>
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-sans-medium text-gray-500">Account Number</Text>
                    <Text className="text-base font-sans text-gray-900">{bankDetails.accountNumber}</Text>
                  </View>
                  <View className="mb-4">
                    <Text className="text-sm font-sans-medium text-gray-500">Account Name</Text>
                    <Text className="text-base font-sans text-gray-900">{bankDetails.accountName}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-sm font-sans-medium text-gray-500">Verification Status: </Text>
                    <View className={`flex-row items-center ml-2 px-2 py-1 rounded-full ${bankDetails.bankVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
                      <Ionicons 
                        name={bankDetails.bankVerified ? 'checkmark-circle' : 'time'}
                        size={16} 
                        color={bankDetails.bankVerified ? '#10B981' : '#F59E0B'}
                        style={{ marginRight: 4 }}
                      />
                      <Text className={`text-xs font-sans-medium ${bankDetails.bankVerified ? 'text-green-800' : 'text-yellow-800'}`}>
                        {bankDetails.bankVerified ? 'Verified' : 'Pending Verification'}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View className="py-8 items-center">
                  <Ionicons name="card-outline" size={48} color="#9CA3AF" className="mb-3" />
                  <Text className="text-gray-500 font-sans text-center mb-4">No bank details added yet</Text>
                  <TouchableOpacity 
                    onPress={() => setShowEditForm(true)}
                    className="bg-primary py-3 px-6 rounded-lg"
                  >
                    <Text className="text-white font-sans-medium">Add Bank Details</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            // Edit Mode
            <View className="bg-white rounded-xl p-6 shadow-sm">
              <Text className="text-lg font-sans-semibold text-gray-900 mb-6">
                {bankDetails?.accountNumber ? 'Update Bank Details' : 'Add Bank Details'}
              </Text>
              
              {/* Bank Selection */}
              <View className="mb-4">
                <Text className="text-sm font-sans-medium text-gray-700 mb-2">Bank Name</Text>
                <TouchableOpacity
                  className="border border-gray-200 rounded-lg p-3 flex-row justify-between items-center"
                  onPress={() => setShowBankModal(true)}
                  disabled={isVerifying || isUpdating}
                >
                  <Text className={`font-sans text-base ${formData.bankName ? 'text-gray-900' : 'text-gray-400'}`}>
                    {formData.bankName || 'Select your bank'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

             {/* Bank Selection Modal */}
             <Modal
                visible={showBankModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBankModal(false)}
              >
                <View className="flex-1 justify-end bg-black/50">
                  <View className="bg-white rounded-t-3xl pt-5" style={{ height: '100%' }}>
                    {/* Header */}
                    <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                      <Text className="text-lg font-sans-bold text-gray-900">Select Bank</Text>
                      <TouchableOpacity onPress={() => setShowBankModal(false)}>
                        <Ionicons name="close" size={24} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Search Bar */}
                    <View className="px-5 pt-4 pb-2">
                      <View className="border border-gray-200 rounded-lg">
                        <View className="flex-row items-center px-3 py-2">
                          <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                          <TextInput
                            placeholder="Search by bank name or code..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="flex-1 font-sans text-base text-gray-900"
                            placeholderTextColor="#9CA3AF"
                            autoFocus
                            autoCapitalize="none"
                            autoCorrect={false}
                            clearButtonMode="while-editing"
                          />
                          {searchQuery.length > 0 && (
                            <TouchableOpacity 
                              onPress={() => setSearchQuery('')}
                              className="p-1"
                            >
                              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <Text className="text-xs text-gray-500 font-sans mt-2">
                        {filteredBanks.length} {filteredBanks.length === 1 ? 'bank' : 'banks'} found
                      </Text>
                    </View>

                    {/* Banks List */}
                    <FlatList
                      data={filteredBanks}
                      keyExtractor={(item) => `${item.code}-${item.name}`}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          className="py-3 px-5 border-b border-gray-100"
                          onPress={() => handleBankSelect(item)}
                        >
                          <Text className="font-sans text-gray-900">{item.name}</Text>
                        </TouchableOpacity>
                      )}
                      ListEmptyComponent={
                        <View className="py-8 items-center">
                          <Text className="text-gray-500 font-sans">No banks found</Text>
                        </View>
                      }
                      keyboardShouldPersistTaps="handled"
                      contentContainerStyle={{ paddingBottom: 20 }}
                    />
                  </View>
                </View>
              </Modal>

              {/* Account Number */}
              <View className="mb-4">
                <Text className="text-sm font-sans-medium text-gray-700 mb-2">Account Number</Text>
                <View className="border border-gray-200 rounded-lg p-3 flex-row items-center">
                  <Ionicons 
                    name={formData.accountName ? 'checkmark-circle' : 'card-outline'} 
                    size={20} 
                    color={formData.accountName ? '#10B981' : '#6B7280'} 
                    style={{ marginRight: 8 }} 
                  />
                  <TextInput
                    placeholder="Enter 10-digit account number"
                    value={formData.accountNumber}
                    onChangeText={handleAccountNumberChange}
                    keyboardType="number-pad"
                    maxLength={10}
                    editable={!isVerifying && !isUpdating}
                    className="flex-1 font-sans text-base text-gray-900"
                  />
                  {isVerifying && <ActivityIndicator size="small" color="#67A9AF" />}
                </View>
                
                {verificationError ? (
                  <Text className="text-red-500 font-sans text-xs mt-1">{verificationError}</Text>
                ) : formData.accountName ? (
                  <Text className="text-green-600 font-sans text-xs mt-1">Account verified: {formData.accountName}</Text>
                ) : formData.accountNumber.length === 10 && formData.bankCode && !isVerifying && !formData.accountName && (
                  <TouchableOpacity
                    onPress={verifyAccount}
                    disabled={isVerifying}
                    className="self-start mt-1"
                  >
                    <Text className="text-primary text-sm font-sans-medium">
                      {isVerifying ? 'Verifying...' : 'Verify Account'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Account Name (readonly) */}
              {formData.accountName && (
                <View className="mb-6">
                  <Text className="text-sm font-sans-medium text-gray-700 mb-2">Account Name</Text>
                  <View className="border border-gray-200 bg-gray-50 rounded-lg p-3">
                    <Text className="font-sans text-gray-900">{formData.accountName}</Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-6">
                <TouchableOpacity
                  onPress={() => {
                    if (bankDetails) {
                      // Reset form to original values
                      setFormData({
                        bankName: bankDetails.bankName || '',
                        bankCode: bankDetails.bankCode || '',
                        accountNumber: bankDetails.accountNumber || '',
                        accountName: bankDetails.accountName || '',
                      });
                      setVerificationError('');
                    } else {
                      // Clear form if adding new
                      setFormData({
                        bankName: '',
                        bankCode: '',
                        accountNumber: '',
                        accountName: '',
                      });
                    }
                    setShowEditForm(false);
                  }}
                  disabled={isUpdating}
                  className="flex-1 border border-gray-300 rounded-lg py-3 items-center"
                >
                  <Text className="text-gray-700 font-sans-medium">Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSaveChanges}
                  disabled={isUpdating || isVerifying}
                  className={`flex-1 rounded-lg py-3 items-center ${
                    isUpdating || isVerifying ? 'bg-primary/70' : 'bg-primary'
                  }`}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-sans-medium">Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Help Text */}
          <View className="mt-6 p-4 bg-blue-50 rounded-lg">
            <View className="flex-row items-start mb-2">
              <Ionicons name="information-circle" size={18} color="#3B82F6" style={{ marginTop: 2, marginRight: 8 }} />
              <Text className="flex-1 font-sans text-sm text-blue-800">
                Your bank details are securely encrypted and only used for processing payments. 
                We'll never share this information with third parties.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
