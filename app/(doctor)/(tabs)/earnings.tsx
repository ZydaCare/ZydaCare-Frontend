import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  RefreshControl,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/Toast';
import {
  getEarningsStats,
  getTransactions,
  getWithdrawals,
  getBanks,
  addBankDetails,
  requestWithdrawal,
  resolveAccount,
  EarningsStats,
  Transaction,
  Withdrawal,
  BankDetails,
} from '@/api/doctor/earnings';
import { useAuth } from '@/context/authContext';

type TabType = 'transactions' | 'withdrawals';

const formatCurrency = (amount: number | string | undefined | null): string => {
  try {
    // Handle null/undefined cases first
    if (amount === null || amount === undefined) {
      console.warn('Received null or undefined amount in formatCurrency');
      return '₦0.00';
    }

    // Convert string to number, handling different formats
    let numAmount: number;
    if (typeof amount === 'string') {
      // Remove any non-numeric characters except decimal point and negative sign
      const cleanAmount = amount.replace(/[^0-9.-]+/g, '');
      numAmount = parseFloat(cleanAmount);
    } else {
      numAmount = Number(amount);
    }

    // Validate the number
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      console.warn(`Invalid amount value: ${amount} (converted to: ${numAmount})`);
      return '₦0.00';
    }

    // Format the number as Nigerian Naira
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(numAmount);
  } catch (error) {
    console.error('Error in formatCurrency:', error);
    return '₦0.00';
  }
};

export default function EarningsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('transactions');
  const { doctorProfile } = useAuth();
  // Initialize with default values to prevent null checks throughout the component
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    withdrawnBalance: 0,
    totalTransactions: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    autoSplit: 0,
    manualSplit: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [banks, setBanks] = useState<Array<{ name: string, code: string }>>([]);
  const [bankDetails, setBankDetails] = useState<Partial<BankDetails> & { verifiedAccountName?: string }>({});
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const { showToast } = useToast();
  const [transactionPage, setTransactionPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [transactionHasMore, setTransactionHasMore] = useState(true);
  const [withdrawalHasMore, setWithdrawalHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    transactions: Transaction[];
    withdrawals: Withdrawal[];
  }>({ transactions: [], withdrawals: [] });
  const pageSize = 10; // Number of items per page

  // Helper to normalize amount for search
  const normalizeAmount = (amount: string | number): string => {
    // Remove all non-digit characters and leading zeros
    const cleanAmount = String(amount).replace(/\D/g, '').replace(/^0+/, '');
    return cleanAmount;
  };

  // Filter transactions and withdrawals based on search query
  const filterItems = (items: any[], query: string) => {
    if (!query) return items;
    
    const lowerQuery = query.toLowerCase().trim();
    const normalizedQuery = normalizeAmount(lowerQuery);
    
    return items.filter(item => {
      // Search in transaction fields
      if ('patient' in item && item.patient) {
        const patientName = `${item.patient.firstName || ''} ${item.patient.lastName || ''}`.toLowerCase();
        const amount = formatCurrency(item.doctorEarning || 0).toLowerCase();
        const numericAmount = normalizeAmount(amount);
        const status = item.paymentStatus?.toLowerCase() || '';
        
        return (
          patientName.includes(lowerQuery) ||
          amount.includes(lowerQuery) ||
          numericAmount.includes(normalizedQuery) ||
          status.includes(lowerQuery) ||
          item.reference?.toLowerCase().includes(lowerQuery) ||
          (item.booking?.appointmentDate && 
            new Date(item.booking.appointmentDate).toLocaleDateString().toLowerCase().includes(lowerQuery))
        );
      }
      
      // Search in withdrawal fields
      if ('status' in item) {
        const amount = formatCurrency(item.amount || 0).toLowerCase();
        const numericAmount = normalizeAmount(amount);
        const status = item.status?.toLowerCase() || '';
        const reference = item.reference?.toLowerCase() || '';
        const bankName = item.bankName?.toLowerCase() || '';
        
        return (
          amount.includes(lowerQuery) ||
          numericAmount.includes(normalizedQuery) ||
          status.includes(lowerQuery) ||
          reference.includes(lowerQuery) ||
          bankName.includes(lowerQuery) ||
          (item.requestedAt && 
            new Date(item.requestedAt).toLocaleDateString().toLowerCase().includes(lowerQuery))
        );
      }
      
      return false;
    });
  };

  // Handle search input change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      setIsSearching(true);
      setSearchResults({
        transactions: filterItems(transactions, query),
        withdrawals: filterItems(withdrawals, query)
      });
    } else {
      setIsSearching(false);
    }
  };

  // Get items to display based on search state
  const getDisplayItems = (type: 'transactions' | 'withdrawals') => {
    if (!isSearching) return type === 'transactions' ? transactions : withdrawals;
    return type === 'transactions' ? searchResults.transactions : searchResults.withdrawals;
  };

  // Helper function to calculate total withdrawn amount
  const calculateTotalWithdrawn = async (withdrawals: Withdrawal[]): Promise<number> => {
    try {
      return withdrawals.reduce((sum: number, withdrawal: Withdrawal) =>
        sum + (Number(withdrawal.amount) || 0), 0);
    } catch (error) {
      console.error('Error calculating total withdrawn:', error);
      return 0;
    }
  };

  const fetchData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
        setTransactionPage(1);
        setWithdrawalPage(1);
        setTransactionHasMore(true);
        setWithdrawalHasMore(true);
      } else {
        setLoading(true);
      }

      const [transactionsRes, withdrawalsRes, banksRes] = await Promise.all([
        getTransactions(1, pageSize),
        getWithdrawals(1, pageSize),
        getBanks(),
      ]);

      // Get stats from the transactions response
      const statsRes = await getEarningsStats();

      if (statsRes.success) {
        const statsData = statsRes.stats || {};
        const totalEarnings = Number(statsData.totalEarnings) || 0;
        const totalWithdrawn = await calculateTotalWithdrawn(withdrawalsRes.success ? withdrawalsRes.data : []);
        const availableBalance = totalEarnings - totalWithdrawn;

        const safeStats = {
          totalEarnings: Number(statsData.totalEarnings) || 0,
          availableBalance: Number(statsData.availableBalance) || 0,
          pendingBalance: Number(statsData.pendingBalance) || 0,
          withdrawnBalance: Number(statsData.withdrawnBalance) || 0,
          totalTransactions: Number(statsData.totalTransactions) || 0,
          successfulTransactions: Number(statsData.successfulTransactions) || 0,
          failedTransactions: Number(statsData.failedTransactions) || 0,
          autoSplit: Number(statsData.autoSplit) || 0,
          manualSplit: Number(statsData.manualSplit) || 0,
        };

        setStats(safeStats);
      } else {
        // Initialize with zeros if no data
        setStats({
          totalEarnings: 0,
          availableBalance: 0,
          pendingBalance: 0,
          withdrawnBalance: 0,
          totalTransactions: 0,
          successfulTransactions: 0,
          failedTransactions: 0,
          autoSplit: 0,
          manualSplit: 0,
        });
      }

      if (transactionsRes.success) {
        setTransactions(transactionsRes.data || []);
        // Update hasMore based on pagination
        if (transactionsRes.pagination) {
          setTransactionHasMore(transactionsRes.pagination.hasMore);
        }
      }

      if (withdrawalsRes.success) {
        setWithdrawals(withdrawalsRes.data || []);
        // Update hasMore based on pagination
        if (withdrawalsRes.pagination) {
          setWithdrawalHasMore(withdrawalsRes.pagination.hasMore);
        }
      }

      if (banksRes.success) {
        setBanks(banksRes.data || []);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching earnings data:', error);
      showToast(`Failed to load earnings data: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (loadingMore || !transactionHasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = transactionPage + 1;
      const response = await getTransactions(nextPage, pageSize);
      
      if (response.success && response.data) {
        setTransactions(prev => [...prev, ...response.data]);
        setTransactionPage(nextPage);
        if (response.pagination) {
          setTransactionHasMore(response.pagination.hasMore);
        }
      }
    } catch (error) {
      console.error('Error loading more transactions:', error);
      showToast('Failed to load more transactions', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const loadMoreWithdrawals = async () => {
    if (loadingMore || !withdrawalHasMore) return;
    
    try {
      setLoadingMore(true);
      const nextPage = withdrawalPage + 1;
      const response = await getWithdrawals(nextPage, pageSize);
      
      if (response.success && response.data) {
        setWithdrawals(prev => [...prev, ...response.data]);
        setWithdrawalPage(nextPage);
        if (response.pagination) {
          setWithdrawalHasMore(response.pagination.hasMore);
        }
      }
    } catch (error) {
      console.error('Error loading more withdrawals:', error);
      showToast('Failed to load more withdrawals', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    await fetchData(true);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(bankSearchQuery.toLowerCase())
  );

  const handleSelectBank = (bank: { name: string, code: string }) => {
    setBankDetails({
      ...bankDetails,
      bankName: bank.name,
      bankCode: bank.code
    });
    setShowBankPicker(false);
    setBankSearchQuery('');
  };

  // Verify bank account before adding
  const verifyBankAccount = async (accountNumber: string, bankCode: string) => {
    if (!accountNumber || !bankCode) return false;
    
    setIsVerifyingAccount(true);
    setVerificationError('');
    
    try {
      const response = await resolveAccount(accountNumber, bankCode);
      
      if (response.success && response.data) {
        setBankDetails(prev => ({
          ...prev,
          accountName: response.data.account_name,
          verifiedAccountName: response.data.account_name
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
      setIsVerifyingAccount(false);
    }
  };

  const handleAccountNumberChange = async (text: string) => {
    // Update account number
    setBankDetails(prev => ({
      ...prev,
      accountNumber: text,
      verifiedAccountName: '' // Reset verification when account number changes
    }));
    
    // Auto-verify when we have both account number and bank code
    if (text.length === 10 && bankDetails.bankCode) {
      await verifyBankAccount(text, bankDetails.bankCode);
    }
  };

  const handleBankSelect = async (bank: { name: string, code: string }) => {
    setBankDetails(prev => ({
      ...prev,
      bankName: bank.name,
      bankCode: bank.code,
      verifiedAccountName: '' // Reset verification when bank changes
    }));
    setShowBankPicker(false);
    setBankSearchQuery('');
    
    // Auto-verify if we have an account number
    if (bankDetails.accountNumber && bankDetails.accountNumber.length === 10) {
      await verifyBankAccount(bankDetails.accountNumber, bank.code);
    }
  };

  const handleAddBank = async () => {
    if (!bankDetails.bankCode || !bankDetails.accountNumber || !bankDetails.verifiedAccountName) {
      showToast('Please verify your bank account first', 'error');
      return;
    }

    try {
      setBankLoading(true);
      const response = await addBankDetails({
        bankName: bankDetails.bankName || '',
        bankCode: bankDetails.bankCode,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.verifiedAccountName || bankDetails.accountName || '',
      });

      if (response.success) {
        showToast('Bank details added successfully', 'success');
        setShowBankModal(false);
        setBankDetails({});
        fetchData();
      } else {
        showToast(response.message || 'Failed to add bank details', 'error');
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
      console.error('Error adding bank:', error);
    } finally {
      setBankLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    if (!stats || amount > stats.pendingBalance) {
      showToast('Insufficient balance', 'error');
      return;
    }

    try {
      setWithdrawLoading(true);
      const response = await requestWithdrawal(amount);

      if (response.success) {
        showToast('Withdrawal request submitted successfully', 'success');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchData();
      } else {
        showToast(response.message || 'Withdrawal failed', 'error');
      }
    } catch (error) {
      showToast('An error occurred. Please try again.', 'error');
      console.error('Error processing withdrawal:', error);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="font-sans-semibold text-gray-900 text-base mb-1">
            {item.patient ? `${item.patient.firstName} ${item.patient.lastName}` : 'N/A'}
          </Text>
          <Text className="text-sm text-gray-500 font-sans">
            {item.booking ? format(new Date(item.booking.appointmentDate), 'MMM d, yyyy · h:mm a') : 'N/A'}
          </Text>
        </View>
        <View className="items-end">
          <Text className={`font-sans-bold text-lg ${item.paymentStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(item.doctorEarning)}
          </Text>
          <View className={`mt-1 px-2 py-1 rounded-full ${item.paymentStatus === 'success' ? 'bg-green-50' : 'bg-red-50'
            }`}>
            <Text className={`text-xs font-sans-medium ${item.paymentStatus === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
              {item.paymentStatus === 'success' ? 'Completed' : 'Failed'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderWithdrawalItem = ({ item }: { item: Withdrawal }) => (
    <View className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="font-sans-semibold text-gray-900 text-base mb-1">
            Withdrawal Request
          </Text>
          <Text className="text-sm text-gray-500 font-sans mb-1">
            {format(new Date(item.requestedAt), 'MMM d, yyyy · h:mm a')}
          </Text>
          {item.reference && (
            <Text className="text-xs text-gray-400 font-sans">
              Ref: {item.reference}
            </Text>
          )}
        </View>
        <View className="items-end">
          <Text className="font-sans-bold text-lg text-gray-900">
            {formatCurrency(item.amount)}
          </Text>
          <View className={`mt-1 px-2 py-1 rounded-full ${item.status === 'completed' ? 'bg-green-50' :
              item.status === 'pending' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
            <Text className={`text-xs font-sans-medium ${item.status === 'completed' ? 'text-green-700' :
                item.status === 'pending' ? 'text-yellow-700' : 'text-red-700'
              }`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = (type: 'transactions' | 'withdrawals') => (
    <View className="flex-1 items-center justify-center py-12">
      <View className="bg-gray-100 rounded-full p-6 mb-4">
        <Ionicons
          name={type === 'transactions' ? 'receipt-outline' : 'cash-outline'}
          size={48}
          color="#9CA3AF"
        />
      </View>
      <Text className="text-gray-900 font-sans-semibold text-lg mb-2">
        {type === 'transactions' ? 'No Transactions Yet' : 'No Withdrawals Yet'}
      </Text>
      <Text className="text-gray-500 font-sans text-center px-8">
        {type === 'transactions'
          ? 'Your transaction history will appear here once you start seeing patients.'
          : 'Withdrawal requests will be shown here.'}
      </Text>
    </View>
  );

  if (loading && !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#67A9AF" />
        <Text className="text-gray-500 font-sans mt-3">Loading earnings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
    <View className="flex-1 bg-gray-50 pt-5">
      {/* Header */}
      <View className="bg-white px-6 pt-6 pb-4 shadow-sm">
        <Text className="text-2xl font-sans-bold text-gray-900">Earnings</Text>
        <Text className="text-sm font-sans text-gray-500 mt-1">
          Manage your earnings and withdrawals
        </Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#67A9AF']} />
        }
      >
        {/* Earnings Overview */}
        <View className="px-4 py-4">
          <Text className="font-sans-semibold text-gray-700 text-base mb-3">Earnings Overview</Text>

          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-sans text-gray-500">Total Earnings</Text>
                  <View className="bg-[#67A9AF]/10 rounded-full p-2">
                    <Ionicons name="wallet-outline" size={16} color="#67A9AF" />
                  </View>
                </View>
                <Text className="text-xl font-sans-bold text-gray-900" testID="total-earnings">
                  {formatCurrency(stats.totalEarnings)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-sans text-gray-500">Available</Text>
                  <View className="bg-green-100 rounded-full p-2">
                    <Ionicons name="cash-outline" size={16} color="#10B981" />
                  </View>
                </View>
                <Text className="text-xl font-sans-bold text-gray-900" testID="available-balance">
                  {formatCurrency(stats.availableBalance)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 px-2">
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-sans text-gray-500">Pending Balance</Text>
                  <View className="bg-yellow-100 rounded-full p-2">
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                  </View>
                </View>
                <Text className="text-xl font-sans-bold text-gray-900" testID="pending-balance">
                  {formatCurrency(stats.pendingBalance)}
                </Text>
              </View>
            </View>

            <View className="w-1/2 px-2">
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-sans text-gray-500">Withdrawn</Text>
                  <View className="bg-blue-100 rounded-full p-2">
                    <Ionicons name="arrow-down-circle-outline" size={16} color="#3B82F6" />
                  </View>
                </View>
                <Text className="text-xl font-sans-bold text-gray-900" testID="total-withdrawn">
                  {formatCurrency(stats.withdrawnBalance)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row px-6 pb-4">
          {/* <TouchableOpacity
            className={`flex-1 py-4 rounded-xl items-center flex-row justify-center mr-2 shadow-sm ${!stats || stats.pendingBalance <= 0 ? 'bg-gray-300' : 'bg-[#67A9AF]'
              }`}
            onPress={() => setShowWithdrawModal(true)}
            disabled={!stats || stats.pendingBalance <= 0}
          >
            <Ionicons name="arrow-down-circle-outline" size={20} color="white" />
            <Text className="text-white font-sans-bold ml-2">Withdraw</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            className="bg-white border-2 border-[#67A9AF] flex-1 py-4 rounded-xl items-center flex-row justify-center ml-2 shadow-sm"
            onPress={() => setShowBankModal(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#67A9AF" />
            <Text className="text-[#67A9AF] font-sans-bold ml-2">{doctorProfile?.bankVerified ? 'Edit Bank' : 'Add Bank'}</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="px-6 mb-4">
          <View className="bg-white rounded-xl p-3 flex-row items-center shadow-sm">
            <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChangeText={handleSearch}
              className="flex-1 font-sans text-base text-gray-900"
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Tabs */}
        <View className="bg-white mx-6 rounded-xl p-1 flex-row shadow-sm mb-4">
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${activeTab === 'transactions' ? 'bg-[#67A9AF]' : 'bg-transparent'}`}
            onPress={() => setActiveTab('transactions')}
          >
            <Text className={`font-sans-semibold text-center ${activeTab === 'transactions' ? 'text-white' : 'text-gray-500'}`}>
              Transactions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg ${activeTab === 'withdrawals' ? 'bg-[#67A9AF]' : 'bg-transparent'}`}
            onPress={() => setActiveTab('withdrawals')}
          >
            <Text className={`font-sans-semibold text-center ${activeTab === 'withdrawals' ? 'text-white' : 'text-gray-500'}`}>
              Withdrawals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="px-6">
          {activeTab === 'transactions' ? (
            (isSearching ? searchResults.transactions : transactions).length > 0 ? (
              <FlatList
                data={isSearching ? searchResults.transactions : transactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item, index) => `tx-${item._id || 'tx'}-${item.createdAt || Date.now()}-${index}`}
                scrollEnabled={false}
                onEndReached={loadMoreTransactions}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#67A9AF" />
                  </View>
                ) : null}
              />
            ) : (
              renderEmptyState('transactions')
            )
          ) : (
            (isSearching ? searchResults.withdrawals : withdrawals).length > 0 ? (
              <FlatList
                data={isSearching ? searchResults.withdrawals : withdrawals}
                renderItem={renderWithdrawalItem}
                keyExtractor={(item, index) => `wd-${item._id || 'wd'}-${item.requestedAt || Date.now()}-${index}`}
                scrollEnabled={false}
                onEndReached={loadMoreWithdrawals}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#67A9AF" />
                  </View>
                ) : null}
              />
            ) : (
              renderEmptyState('withdrawals')
            )
          )}
        </View>
      </ScrollView>

      <View className='h-24' />

      {/* Add Bank Modal */}
      <Modal
        visible={showBankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-sans-bold text-gray-900">Add Bank Account</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBankModal(false);
                  setBankDetails({});
                }}
                className="bg-gray-100 rounded-full p-2"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-4">
                <Text className="text-sm font-sans-semibold text-gray-700 mb-2">Select Bank</Text>
                <TouchableOpacity
                  className={`border-2 border-gray-200 rounded-xl p-4 flex-row justify-between items-center`}
                  onPress={() => setShowBankPicker(true)}
                  disabled={isVerifyingAccount}
                >
                  <View className="flex-1">
                    <Text className={`font-sans text-base ${bankDetails.bankName ? 'text-gray-900' : 'text-gray-400'}`}>
                      {bankDetails.bankName || 'Choose your bank'}
                    </Text>
                    {/* {bankDetails.bankName && bankDetails.verifiedAccountName && (
                      <Text className="text-xs text-green-600 mt-1">
                        Verified with {bankDetails.verifiedAccountName}
                      </Text>
                    )} */}
                  </View>
                  {isVerifyingAccount ? (
                    <ActivityIndicator size="small" color="#67A9AF" />
                  ) : (
                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-sans-semibold text-gray-700 mb-2">Account Number</Text>
                <View>
                  <View className={`border-2 ${bankDetails.accountNumber && bankDetails.accountNumber.length === 10 ? (bankDetails.verifiedAccountName ? 'border-green-200' : 'border-red-200') : 'border-gray-200'} rounded-xl p-4 flex-row items-center`}>
                    <Ionicons 
                      name={bankDetails.verifiedAccountName ? 'checkmark-circle' : 'card-outline'} 
                      size={20} 
                      color={bankDetails.verifiedAccountName ? '#10B981' : '#6B7280'} 
                      style={{ marginRight: 8 }} 
                    />
                    <TextInput
                      placeholder="Enter 10-digit account number"
                      value={bankDetails.accountNumber}
                      onChangeText={handleAccountNumberChange}
                      keyboardType="number-pad"
                      maxLength={10}
                      editable={!isVerifyingAccount}
                      className="flex-1 font-sans text-base text-gray-900"
                    />
                    {isVerifyingAccount && (
                      <ActivityIndicator size="small" color="#67A9AF" />
                    )}
                  </View>
                  {verificationError ? (
                    <Text className="text-red-500 text-xs mt-1 ml-1">{verificationError}</Text>
                  ) : bankDetails.accountNumber?.length === 10 && bankDetails.verifiedAccountName ? (
                    <Text className="text-green-600 text-xs mt-1 ml-1">
                      Account verified: {bankDetails.verifiedAccountName}
                    </Text>
                  ) : bankDetails.accountNumber?.length === 10 ? (
                    <Text className="text-yellow-600 text-xs mt-1 ml-1">
                      Verifying account...
                    </Text>
                  ) : bankDetails.accountNumber && bankDetails.accountNumber.length > 0 ? (
                    <Text className="text-gray-500 text-xs mt-1 ml-1">
                      Enter 10-digit account number
                    </Text>
                  ) : null}
                </View>
              </View>

              {bankDetails.verifiedAccountName && (
                <View className="mb-6">
                  <Text className="text-sm font-sans-semibold text-gray-700 mb-2">Account Name</Text>
                  <View className="border-2 border-green-200 bg-green-50 rounded-xl p-4 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" style={{ marginRight: 8 }} />
                    <Text className="font-sans text-base text-gray-900">
                      {bankDetails.verifiedAccountName}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                className={`py-4 rounded-xl items-center flex-row justify-center ${
                  !bankDetails.verifiedAccountName || bankLoading ? 'bg-gray-300' : 'bg-[#67A9AF]'
                }`}
                onPress={handleAddBank}
                disabled={!bankDetails.verifiedAccountName || bankLoading}
              >
                {bankLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                    <Text className="text-white font-sans-bold ml-2">
                      {bankDetails.verifiedAccountName ? 'Link Bank Account' : 'Verify Account First'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bank Picker Modal */}
      <Modal
        visible={showBankPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBankPicker(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6" style={{ height: '75%' }}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-sans-bold text-gray-900">Select Bank</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBankPicker(false);
                  setBankSearchQuery('');
                }}
                className="bg-gray-100 rounded-full p-2"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <View className="border-2 border-gray-200 rounded-xl p-3 flex-row items-center">
                <Ionicons name="search-outline" size={20} color="#6B7280" style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search banks..."
                  value={bankSearchQuery}
                  onChangeText={setBankSearchQuery}
                  className="flex-1 font-sans text-base text-gray-900"
                />
              </View>
            </View>

            <FlatList
              data={filteredBanks}
              keyExtractor={(item) => `bank-${item.code}-${item.name}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="py-4 border-b border-gray-100"
                  onPress={() => handleBankSelect(item)}
                >
                  <Text className="font-sans text-base text-gray-900">{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="py-8 items-center">
                  <Text className="text-gray-500 font-sans">No banks found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-sans-bold text-gray-900">Withdraw Funds</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                }}
                className="bg-gray-100 rounded-full p-2"
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="bg-[#67A9AF]/10 rounded-xl p-4 mb-6">
              <Text className="text-sm font-sans text-gray-600 mb-1">Available Balance</Text>
              <Text className="text-2xl font-sans-bold text-[#67A9AF]">
                {stats ? formatCurrency(stats.pendingBalance) : '₦0.00'}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-sans-semibold text-gray-700 mb-2">Amount to Withdraw</Text>
              <View className="border-2 border-gray-200 rounded-xl p-4 flex-row items-center">
                <Text className="text-gray-900 text-xl font-sans-bold mr-2">₦</Text>
                <TextInput
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChangeText={setWithdrawAmount}
                  keyboardType="decimal-pad"
                  className="flex-1 font-sans-bold text-xl text-gray-900"
                />
              </View>
              <Text className="text-xs text-gray-500 mt-2 ml-1">
                Enter the amount you want to withdraw
              </Text>
            </View>

            <TouchableOpacity
              className={`py-4 rounded-xl items-center flex-row justify-center mb-4 ${withdrawLoading ? 'bg-gray-300' : 'bg-[#67A9AF]'
                }`}
              onPress={handleWithdraw}
              disabled={withdrawLoading}
            >
              {withdrawLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="arrow-down-circle" size={20} color="white" />
                  <Text className="text-white font-sans-bold ml-2">Confirm Withdrawal</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="bg-blue-50 rounded-xl p-3 flex-row">
              <Ionicons name="information-circle" size={20} color="#3B82F6" style={{ marginRight: 8, marginTop: 2 }} />
              <Text className="text-xs text-blue-700 font-sans flex-1">
                Withdrawals are processed within 1-3 business days. You'll receive a notification once processed.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </KeyboardAvoidingView>
  );
}