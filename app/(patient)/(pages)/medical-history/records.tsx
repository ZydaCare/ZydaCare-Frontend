// Medical History List Screen - Complete Implementation

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, SafeAreaView, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { BASE_URL } from '@/config';

// const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function MedicalHistoryScreen() {
  const [medicalHistory, setMedicalHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'chronic' | 'acute'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ total: 0, chronic: 0, acute: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user, token } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const fetchMedicalHistory = async () => {
    try {
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }
      
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (activeFilter !== 'all') {
        params.append('category', activeFilter);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const queryString = params.toString();
      const url = `${BASE_URL}/medical-history${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch medical history');
      }

      if (data.success) {
        setMedicalHistory(data.data || []);
        setStats(data.stats || { total: 0, chronic: 0, acute: 0 });
      }
    } catch (error) {
      console.error('Error fetching medical history:', error);
      showToast(error instanceof Error ? error.message : 'Failed to load medical history', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      setDeleting(true);

      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      const response = await fetch(`${BASE_URL}/medical-history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete record');
      }

      if (data.success) {
        showToast('Medical record deleted successfully', 'success');
        // Refresh the list
        fetchMedicalHistory();
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete record', 'error');
    } finally {
      setDeleting(false);
      setRecordToDelete(null);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMedicalHistory();
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMedicalHistory();
    }, [activeFilter, searchQuery])
  );

  // Listen for refresh param
  const { refresh } = useLocalSearchParams();
  
  useEffect(() => {
    if (refresh) {
      fetchMedicalHistory();
    }
  }, [refresh]);

  const handleAddNew = () => {
    router.push('/(patient)/(pages)/medical-history/add');
  };

  const handleEditRecord = (id: string) => {
    router.push({
      pathname: '/(patient)/(pages)/medical-history/edit/[id]',
      params: { id }
    } as any);
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'mild': return { bg: '#D1FAE5', text: '#065F46' };
      case 'moderate': return { bg: '#FEF3C7', text: '#92400E' };
      case 'severe': return { bg: '#FEE2E2', text: '#991B1B' };
      default: return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const filteredRecords = medicalHistory;

  const confirmDelete = (id: string) => {
    setRecordToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      setShowDeleteModal(false);
      handleDeleteRecord(recordToDelete);
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#67A9AF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 pt-5">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-4">
          <Text className="text-2xl font-sans-bold text-gray-900 mb-2">Medical History</Text>
          <Text className="text-sm text-gray-600 mb-6">Track and manage your health records</Text>
          
          {/* Stats Cards */}
          <View className="flex-row gap-3 mb-6">
            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-gray-600 mb-1">Total</Text>
                  <Text className="text-2xl font-sans-bold text-gray-900">{stats.total || 0}</Text>
                </View>
                <View className="bg-blue-100 w-10 h-10 rounded-lg items-center justify-center">
                  <Ionicons name="document-text" size={20} color="#2563EB" />
                </View>
              </View>
            </View>

            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-gray-600 mb-1">Chronic</Text>
                  <Text className="text-2xl font-sans-bold text-gray-900">{stats.chronic || 0}</Text>
                </View>
                <View className="bg-amber-100 w-10 h-10 rounded-lg items-center justify-center">
                  <Ionicons name="pulse" size={20} color="#D97706" />
                </View>
              </View>
            </View>
          </View>

          {/* Search Bar */}
          <View className="bg-white rounded-xl p-3 mb-4 shadow-sm flex-row items-center">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-base font-sans text-gray-900"
              placeholder="Search medical records..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter Tabs */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                activeFilter === 'all' ? 'bg-primary' : 'bg-white border border-gray-200'
              }`}
            >
              <Text className={`font-sans-medium ${
                activeFilter === 'all' ? 'text-white' : 'text-gray-600'
              }`}>
                All ({stats.total || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('chronic')}
              className={`px-4 py-2 rounded-lg ${
                activeFilter === 'chronic' ? 'bg-primary' : 'bg-white border border-gray-200'
              }`}
            >
              <Text className={`font-sans-medium ${
                activeFilter === 'chronic' ? 'text-white' : 'text-gray-600'
              }`}>
                Chronic ({stats.chronic || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveFilter('acute')}
              className={`px-4 py-2 rounded-lg ${
                activeFilter === 'acute' ? 'bg-primary' : 'bg-white border border-gray-200'
              }`}
            >
              <Text className={`font-sans-medium ${
                activeFilter === 'acute' ? 'text-white' : 'text-gray-600'
              }`}>
                Acute ({stats.acute || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add New Button */}
          <TouchableOpacity
            onPress={handleAddNew}
            className="bg-primary flex-row items-center justify-center py-3 rounded-xl mb-6 shadow-sm"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white font-sans-semibold ml-2">Add New Record</Text>
          </TouchableOpacity>

          {/* Medical Records List */}
          {filteredRecords.length === 0 ? (
            <View className="bg-white rounded-xl p-10 items-center shadow-sm">
              <View className="bg-gray-100 w-16 h-16 rounded-full items-center justify-center mb-4">
                <Ionicons name="document-text-outline" size={32} color="#9CA3AF" />
              </View>
              <Text className="text-lg font-sans-semibold text-gray-900 mb-2">
                {searchQuery ? 'No results found' : 'No medical records'}
              </Text>
              <Text className="text-sm text-gray-600 text-center mb-6">
                {searchQuery 
                  ? 'Try adjusting your search or filters'
                  : 'Add your first record to get started'}
              </Text>
            </View>
          ) : (
            filteredRecords.map((record) => {
              const severityColors = getSeverityColor(record.severity || 'mild');
              
              return (
                <TouchableOpacity
                  key={record._id}
                  className="bg-white rounded-xl p-5 mb-4 shadow-sm"
                  activeOpacity={0.7}
                  onPress={() => handleEditRecord(record._id)}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-2 flex-wrap">
                        <Text className="text-lg font-sans-bold text-gray-900 flex-shrink">
                          {record.condition || 'Medical Condition'}
                        </Text>
                        {record.severity && (
                          <View 
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: severityColors.bg }}
                          >
                            <Text 
                              className="text-xs font-sans-semibold capitalize"
                              style={{ color: severityColors.text }}
                            >
                              {record.severity}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                          <Text className="text-xs text-gray-600 ml-1">
                            {new Date(record.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Text>
                        </View>
                        
                        {record.category && (
                          <View className="flex-row items-center">
                            <Ionicons 
                              name={record.category === 'chronic' ? 'pulse' : 'alert-circle-outline'} 
                              size={14} 
                              color="#6B7280" 
                            />
                            <Text className="text-xs text-gray-600 ml-1 capitalize">
                              {record.category}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    
                    <View className="flex-row items-center">
                      <TouchableOpacity 
                        onPress={(e) => {
                          e.stopPropagation();
                          confirmDelete(record._id);
                        }}
                        className="p-2"
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                      <Ionicons name="chevron-forward" size={20} color="#67A9AF" />
                    </View>
                  </View>

                  {record.diagnosis && (
                    <View className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                      <View className="flex-row items-start">
                        <Ionicons name="document-text" size={16} color="#2563EB" />
                        <View className="flex-1 ml-2">
                          <Text className="text-xs font-sans-semibold text-blue-900 mb-1">
                            Diagnosis
                          </Text>
                          <Text className="text-sm text-blue-800 font-sans">
                            {record.diagnosis}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {record.treatment && (
                    <View className="bg-teal-50 rounded-lg p-3 mb-3 border border-teal-100">
                      <View className="flex-row items-start">
                        <Ionicons name="medical" size={16} color="#0D9488" />
                        <View className="flex-1 ml-2">
                          <Text className="text-xs font-sans-semibold text-teal-900 mb-1">
                            Treatment
                          </Text>
                          <Text className="text-sm text-teal-800 font-sans">
                            {record.treatment}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {record.notes && (
                    <View className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <View className="flex-row items-start">
                        <Ionicons name="information-circle" size={16} color="#6B7280" />
                        <View className="flex-1 ml-2">
                          <Text className="text-xs font-sans-semibold text-gray-900 mb-1">
                            Additional Notes
                          </Text>
                          <Text className="text-sm text-gray-700 font-sans">
                            {record.notes}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {record.images && record.images.length > 0 && (
                    <View className="mt-3">
                      <Text className="text-sm font-sans-medium text-gray-700 mb-2">
                        Attachments: {record.images.length}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {record.images.map((image: any, idx: number) => (
                          <Image
                            key={idx}
                            source={{ uri: image.url || image }}
                            className="w-16 h-16 rounded-md mr-2"
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-xl p-6 w-full max-w-sm">
            <Text className="text-lg font-sans-bold text-gray-900 mb-2">Delete Record</Text>
            <Text className="text-gray-700 mb-6">
              Are you sure you want to delete this medical record? This action cannot be undone.
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-4 py-2 rounded-lg"
                onPress={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                <Text className="text-gray-700 font-sans-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-4 py-2 bg-red-600 rounded-lg"
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-sans-medium">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}