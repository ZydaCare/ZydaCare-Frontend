import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import { getTransactions, getRevenueSummary } from '@/api/admin/payments';
import { useToast } from '@/components/ui/Toast';

type PaymentStatus = 'success' | 'pending' | 'failed';

interface Transaction {
  _id: string;
  amount: number;
  paymentStatus: string;
  reference: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  doctor: {
    fullName: string;
    profile: {
      title: string;
    };
  };
}

export default function PaymentsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PaymentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsData, summaryData] = await Promise.all([
        getTransactions(),
        getRevenueSummary()
      ]);
      
      setTransactions(transactionsData);
      setRevenueSummary(summaryData);
    } catch (error) {
      showToast('Failed to load payment data', 'error');
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    // Filter by tab
    const matchesTab = activeTab === 'all' || tx.paymentStatus.toLowerCase() === activeTab;
    
    // If no search query, just filter by tab
    const query = searchQuery.trim();
    if (!query) return matchesTab;
    
    const queryLower = query.toLowerCase();
    
    // Check if query is a number (for amount search) - handle both with and without commas
    const cleanQuery = query.replace(/,/g, '');
    const queryAsNumber = parseFloat(cleanQuery);
    const isNumericSearch = !isNaN(queryAsNumber) && cleanQuery !== '';
    
    // Search in different fields
    const matchesSearch = 
      // Check full name match first (both first and last name in any order)
      (tx.patient?.firstName && tx.patient?.lastName && 
        (`${tx.patient.firstName.toLowerCase()} ${tx.patient.lastName.toLowerCase()}`.includes(queryLower) ||
         `${tx.patient.lastName.toLowerCase()} ${tx.patient.firstName.toLowerCase()}`.includes(queryLower))) ||
      
      // Check individual name fields
      tx.patient?.firstName?.toLowerCase().includes(queryLower) ||
      tx.patient?.lastName?.toLowerCase().includes(queryLower) ||
      
      // Check doctor's full name with or without title
      (tx.doctor?.fullName && (
        // Match full name with title (e.g., "Dr Mercy Ndukwe")
        tx.doctor.fullName.toLowerCase().includes(queryLower) ||
        // Match without title (e.g., "Mercy Ndukwe")
        (tx.doctor.profile?.title && 
          tx.doctor.fullName.toLowerCase().includes(
            queryLower.replace(tx.doctor.profile.title.toLowerCase(), '').trim()
          )
        ) ||
        // Match last name only with title (e.g., "Dr Ndukwe")
        (tx.doctor.profile?.title && 
          queryLower === `${tx.doctor.profile.title.toLowerCase()} ${tx.doctor.fullName.split(' ').pop()?.toLowerCase()}`
        )
      )) ||
      
      // Check reference (case insensitive)
      tx.reference?.toLowerCase().includes(queryLower) ||
      
      // Amount search (exact match for numbers, partial for text)
      (isNumericSearch 
        ? tx.amount === queryAsNumber 
        : tx.amount?.toString().includes(queryLower));
    
    return matchesTab && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' };
      case 'pending':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' };
      case 'failed':
        return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' };
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#67A9AF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-1">
            <Text className="text-2xl font-sans-bold text-gray-900">Payments</Text>
          </View>
          <View className="flex-row space-x-2">
            <TouchableOpacity 
              onPress={fetchData}
              className="p-2"
            >
              <Ionicons name="refresh" size={20} color="#67A9AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <View className="relative">
            <TextInput
              className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-base font-sans-regular text-gray-900"
              placeholder="Search transactions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            <Ionicons 
              name="search" 
              size={20} 
              color="#9CA3AF" 
              style={{
                position: 'absolute',
                left: 12,
                top: 14
              }} 
            />
          </View>
        </View>

        {/* Stats Cards */}
        {revenueSummary && (
          <View className="grid grid-cols-2 gap-4 mb-6">
            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <Text className="text-gray-500 font-sans-medium text-sm">Total Revenue</Text>
              <Text className="text-2xl font-sans-bold text-gray-900 mt-1">
                ₦{revenueSummary.totalRevenue?.toLocaleString() || '0'}
              </Text>
            </View>
            <View className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <Text className="text-gray-500 font-sans-medium text-sm">Total Transactions</Text>
              <Text className="text-2xl font-sans-bold text-gray-900 mt-1">
                {revenueSummary.totalTransactions?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View className="flex-row bg-white rounded-xl p-1 border border-gray-200 mb-4">
          {['all', 'success', 'pending', 'failed'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab as PaymentStatus)}
                className={`flex-1 py-2 rounded-lg items-center ${isActive ? 'bg-primary/20' : ''}`}
              >
                <Text
                  className={`text-sm font-sans-medium ${isActive ? 'text-primary' : 'text-gray-500'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Transaction List */}
        <ScrollView className="flex-1">
          {filteredTransactions.length === 0 ? (
            <View className="items-center justify-center py-10">
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">No transactions found</Text>
            </View>
          ) : (
            filteredTransactions.map((tx) => {
              const statusStyle = getStatusColor(tx.paymentStatus);
              const doctorName = tx.doctor ? `${tx.doctor.profile?.title || ''} ${tx.doctor.fullName}` : 'N/A';
              
              return (
                <TouchableOpacity 
                  key={tx._id}
                  onPress={() => router.push(`/(admin)/(pages)/transactions/${tx._id}`)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-3"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-sm font-sans-medium text-gray-500">
                        {tx.patient?.firstName} {tx.patient?.lastName}
                      </Text>
                      <Text className="text-sm text-gray-400">
                        {doctorName}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <View className={`w-2 h-2 rounded-full ${statusStyle.dot} mr-1`} />
                        <Text className={`text-xs font-sans-medium ${statusStyle.text}`}>
                          {tx.paymentStatus}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-sans-bold text-gray-900">
                        ₦{tx.amount?.toLocaleString()}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {format(new Date(tx.createdAt), 'MMM d, yyyy')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
