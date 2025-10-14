import { addBankDetails, getBanks, resolveAccount } from '@/api/doctor/earnings';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useToast } from './ui/Toast';

const MandatoryBankDetails = () => {
  const router = useRouter();
  const { doctorProfile, getDoctorProfile } = useAuth();
  const [bankDetails, setBankDetails] = useState({
    bankName: 'OPay Digital Services Limited (OPay)',
    bankCode: '999992',
    accountNumber: '9079889747',
    accountName: 'Chika Jephthah Ndukwe',
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([]);
  const [filteredBanks, setFilteredBanks] = useState<Array<{ name: string; code: string }>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();
  const [verificationError, setVerificationError] = useState('');

  useEffect(() => {
    // Load banks list
    const loadBanks = async () => {
      try {
        const banks = await getBanks();
        if (banks.success) {
          setBanks(banks.data);
          setFilteredBanks(banks.data);
        }
      } catch (error) {
        console.error('Error loading banks:', error);
        showToast('Failed to load banks. Please try again.', 'error');
      }
    };

    loadBanks();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = banks.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBanks(filtered);
    } else {
      setFilteredBanks(banks);
    }
  }, [searchQuery, banks]);

  const handleAccountNumberChange = async (text: string) => {
    // Only allow numbers
    const cleanedText = text.replace(/\D/g, '');
    setBankDetails({
      ...bankDetails,
      accountNumber: cleanedText,
      accountName: '', // Reset account name when account number changes
    });
    setVerificationError('');

    // Auto-verify when we have both bank code and 10-digit account number
    if (bankDetails.bankCode && cleanedText.length === 10) {
      await verifyAccount(cleanedText, bankDetails.bankCode);
    }
  };

  const verifyAccount = async (accountNumber: string, bankCode: string) => {
    if (!accountNumber || !bankCode) return;
    
    setIsVerifying(true);
    setVerificationError('');

    try {
      const response = await resolveAccount(accountNumber, bankCode);
      if (response.success && response.data) {
        setBankDetails(prev => ({
          ...prev,
          accountName: response.data.account_name,
        }));
      } else {
        setVerificationError(response.message || 'Failed to verify account');
      }
    } catch (error) {
      console.error('Error verifying account:', error);
      setVerificationError('Error verifying account. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBankSelect = (bank: { name: string; code: string }) => {
    setBankDetails({
      ...bankDetails,
      bankName: bank.name,
      bankCode: bank.code,
      accountName: '', // Reset account name when bank changes
    });
    setShowBankPicker(false);
    
    // If we already have an account number, verify it with the new bank
    if (bankDetails.accountNumber && bankDetails.accountNumber.length === 10) {
      verifyAccount(bankDetails.accountNumber, bank.code);
    }
  };

  const handleSubmit = async () => {
    if (!bankDetails.bankCode || !bankDetails.accountNumber || !bankDetails.accountName) {
      showToast('Please verify your bank account first', 'error');
      return;
    }

    if (verificationError) {
      showToast('Please fix the verification errors', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await addBankDetails({
        bankName: bankDetails.bankName,
        bankCode: bankDetails.bankCode,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName,
      });

      if (response.success) {
        await getDoctorProfile(); // Refresh doctor profile to update bankVerified status
        router.replace('/(doctor)/(tabs)/home');
      } else {
        showToast(response.message || 'Failed to save bank details', 'error');
      }
    } catch (error) {
      console.error('Error saving bank details:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show anything while loading
  if (!doctorProfile) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#67A9AF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white p-6 pt-12">
      <View className="flex-1">
        <View className="mb-8">
          <Text className="text-2xl font-sans-bold text-gray-900 mb-2">Add Bank Details</Text>
          <Text className="text-gray-600 font-sans">
            You need to add your bank account to receive payments for your services.
          </Text>
        </View>

        {/* Bank Selection */}
        <View className="mb-6">
          <Text className="text-sm font-sans-semibold text-gray-700 mb-2">Bank Name</Text>
          <TouchableOpacity
            className="border-2 border-gray-200 rounded-xl p-4 flex-row justify-between items-center"
            onPress={() => setShowBankPicker(true)}
            disabled={isVerifying || isSubmitting}
          >
            <Text className={`font-sans text-base ${bankDetails.bankName ? 'text-gray-900' : 'text-gray-400'}`}>
              {bankDetails.bankName || 'Select your bank'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Account Number */}
        <View className="mb-6">
          <Text className="text-sm font-sans-semibold text-gray-700 mb-2">Account Number</Text>
          <View className="border-2 border-gray-200 rounded-xl p-4 flex-row items-center">
            <Ionicons 
              name={bankDetails.accountName ? 'checkmark-circle' : 'card-outline'} 
              size={20} 
              color={bankDetails.accountName ? '#10B981' : '#6B7280'} 
              style={{ marginRight: 8 }} 
            />
            <TextInput
              placeholder="Enter 10-digit account number"
              value={bankDetails.accountNumber}
              onChangeText={handleAccountNumberChange}
              keyboardType="number-pad"
              maxLength={10}
              editable={!isVerifying && !isSubmitting}
              className="flex-1 font-sans text-base text-gray-900"
            />
            {isVerifying && <ActivityIndicator size="small" color="#67A9AF" />}
          </View>
          {verificationError ? (
            <Text className="text-red-500 text-xs mt-1 ml-1">{verificationError}</Text>
          ) : bankDetails.accountName ? (
            <Text className="text-green-600 text-xs mt-1 ml-1">
              Account verified: {bankDetails.accountName}
            </Text>
          ) : bankDetails.accountNumber?.length === 10 ? (
            <Text className="text-yellow-600 text-xs mt-1 ml-1">
              Verifying account...
            </Text>
          ) : null}
        </View>

        {/* Account Name (read-only, shown after verification) */}
        {bankDetails.accountName && (
          <View className="mb-6">
            <Text className="text-sm font-sans-semibold text-gray-700 mb-2">Account Name</Text>
            <View className="border-2 border-green-200 bg-green-50 rounded-xl p-4">
              <Text className="font-sans text-base text-gray-900">
                {bankDetails.accountName}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        className={`py-4 rounded-xl items-center justify-center ${
          !bankDetails.accountName || isVerifying || isSubmitting ? 'bg-gray-300' : 'bg-[#67A9AF]'
        }`}
        onPress={handleSubmit}
        disabled={!bankDetails.accountName || isVerifying || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-sans-bold text-base">
            Save Bank Details
          </Text>
        )}
      </TouchableOpacity>

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View className="flex-1 bg-white pt-6">
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-sans-bold text-gray-900">Select Bank</Text>
              <TouchableOpacity onPress={() => setShowBankPicker(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View className="border border-gray-200 rounded-lg px-4 py-2 flex-row items-center">
              <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                placeholder="Search banks..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 font-sans text-base text-gray-900"
                autoFocus
              />
            </View>
          </View>
          <FlatList
            data={filteredBanks}
            keyExtractor={(item) => `bank-${item.code}-${item.name}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="py-4 px-6 border-b border-gray-100"
                onPress={() => handleBankSelect(item)}
              >
                <Text className="font-sans text-base text-gray-900">{item.name}</Text>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <View className="py-8 items-center">
                <Text className="text-gray-500 font-sans">No banks found</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

export default MandatoryBankDetails;
