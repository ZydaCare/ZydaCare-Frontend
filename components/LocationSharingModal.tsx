// components/LocationSharingModal.tsx
// Simplified version with static imports

import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Animated,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import LocationTrackingService from '@/services/LocationTrackingService';

const { height } = Dimensions.get('window');

interface LocationSharingModalProps {
  visible: boolean;
  onClose: () => void;
  serverUrl: string;
  onSharingChange?: (isSharing: boolean) => void;
}

export const LocationSharingModal: React.FC<LocationSharingModalProps> = ({
  visible,
  onClose,
  serverUrl,
  onSharingChange,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateInterval, setUpdateInterval] = useState(5000);
  const [slideAnim] = useState(new Animated.Value(height));
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      
      // Initialize service when modal opens
      if (!isInitialized) {
        initializeService();
      }
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const initializeService = async () => {
    try {
      setLoading(true);
      
      // Check if already connected
      if (typeof LocationTrackingService.isConnected === 'function') {
        const connected = LocationTrackingService.isConnected();
        if (connected) {
          setIsInitialized(true);
          setLoading(false);
          return;
        }
      }
      
      // Initialize connection
      if (typeof LocationTrackingService.initialize === 'function') {
        const success = await LocationTrackingService.initialize(serverUrl);
        setIsInitialized(success);
        
        if (!success) {
          setError('Failed to connect to location service');
        }
      } else {
        setError('Location service not properly configured');
      }
    } catch (err: any) {
      console.error('Initialization error:', err);
      setError(err.message || 'Failed to initialize');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSharing = async () => {
    if (!isInitialized) {
      Alert.alert('Please Wait', 'Connecting to location service...');
      await initializeService();
      return;
    }

    if (isSharing) {
      // Stop sharing
      setLoading(true);
      try {
        if (typeof LocationTrackingService.stopSharingLocation === 'function') {
          const success = await LocationTrackingService.stopSharingLocation();
          
          if (success) {
            setIsSharing(false);
            if (onSharingChange) onSharingChange(false);
            Alert.alert(
              'Location Sharing Stopped',
              'Patients can no longer see your real-time location.'
            );
          } else {
            setError('Failed to stop sharing location');
          }
        } else {
          setError('Stop sharing function not available');
        }
      } catch (err: any) {
        console.error('Stop sharing error:', err);
        setError(err.message || 'Failed to stop sharing');
      } finally {
        setLoading(false);
      }
    } else {
      // Start sharing
      Alert.alert(
        'Start Location Sharing',
        'This will allow patients to see your real-time location and find you easily. You can stop sharing anytime.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Sharing',
            onPress: async () => {
              setLoading(true);
              setError(null);
              
              try {
                // Request permissions
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert(
                    'Permission Required',
                    'Location permission is required to share your location with patients.'
                  );
                  setLoading(false);
                  return;
                }

                // Ensure initialized
                if (!isInitialized) {
                  await initializeService();
                }

                // Start sharing
                if (typeof LocationTrackingService.startSharingLocation === 'function') {
                  const success = await LocationTrackingService.startSharingLocation(updateInterval);
                  
                  if (success) {
                    setIsSharing(true);
                    if (onSharingChange) onSharingChange(true);
                    Alert.alert(
                      'Location Sharing Active',
                      'Patients can now see your real-time location.'
                    );
                  } else {
                    setError('Failed to start sharing location');
                  }
                } else {
                  setError('Start sharing function not available');
                }
              } catch (err: any) {
                console.error('Start sharing error:', err);
                setError(err.message || 'Failed to start sharing');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    }
  };

  const handleUpdateIntervalChange = async (newInterval: number) => {
    setUpdateInterval(newInterval);
    
    // If currently sharing, restart with new interval
    if (isSharing && typeof LocationTrackingService.stopSharingLocation === 'function' && 
        typeof LocationTrackingService.startSharingLocation === 'function') {
      try {
        await LocationTrackingService.stopSharingLocation();
        await LocationTrackingService.startSharingLocation(newInterval);
      } catch (err) {
        console.error('Error updating interval:', err);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <TouchableOpacity 
          className="flex-1" 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
          }}
          className="bg-white rounded-t-3xl"
        >
          {/* Handle Bar */}
          <View className="items-center py-4">
            <View className="w-12 h-1 bg-gray-300 rounded-full" />
          </View>

          <View className="px-6 pb-8">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center flex-1">
                <View className={`w-12 h-12 rounded-full items-center justify-center ${
                  isSharing ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Ionicons
                    name={isSharing ? "navigate" : "navigate-outline"}
                    size={24}
                    color={isSharing ? "#10b981" : "#6B7280"}
                  />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-sans-bold text-gray-900 text-lg">
                    Location Sharing
                  </Text>
                  <Text className="text-xs font-sans text-gray-500">
                    {isSharing ? 'Currently sharing your location' : 'Not sharing'}
                  </Text>
                </View>
              </View>
              
              {loading ? (
                <ActivityIndicator size="small" color="#67A9AF" />
              ) : (
                <Switch
                  value={isSharing}
                  onValueChange={handleToggleSharing}
                  trackColor={{ false: '#D1D5DB', true: '#67A9AF' }}
                  thumbColor={isSharing ? '#fff' : '#f4f3f4'}
                  ios_backgroundColor="#D1D5DB"
                  disabled={!isInitialized && !loading}
                />
              )}
            </View>

            {/* Initialization Loading */}
            {loading && !isInitialized && (
              <View className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text className="text-blue-700 font-sans text-sm ml-3">
                    Connecting to location service...
                  </Text>
                </View>
              </View>
            )}

            {/* Status Banner */}
            {isSharing && (
              <View className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
                <View className="flex-row items-center mb-2">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <Text className="text-green-700 font-sans-semibold">
                    You're Live & Visible
                  </Text>
                </View>
                <Text className="text-green-600 text-sm font-sans">
                  Patients nearby can see your real-time location and contact you instantly
                </Text>
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                <Text className="text-red-600 font-sans text-sm">{error}</Text>
                {!isInitialized && (
                  <TouchableOpacity
                    onPress={initializeService}
                    className="mt-2 bg-red-600 py-2 px-4 rounded-lg"
                  >
                    <Text className="text-white font-sans-medium text-center text-sm">
                      Retry Connection
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Update Interval (when sharing) */}
            {isSharing && (
              <View className="mb-4">
                <Text className="text-gray-700 font-sans-semibold text-base mb-3">
                  Update Frequency
                </Text>
                <View className="flex-row gap-2">
                  {[
                    { label: 'Fast (3s)', value: 3000 },
                    { label: 'Normal (5s)', value: 5000 },
                    { label: 'Battery (10s)', value: 10000 },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => handleUpdateIntervalChange(option.value)}
                      className={`flex-1 py-3 px-4 rounded-xl ${
                        updateInterval === option.value
                          ? 'bg-primary'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-sm font-sans-semibold text-center ${
                          updateInterval === option.value
                            ? 'text-white'
                            : 'text-gray-600'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="text-gray-500 font-sans text-xs mt-2 text-center">
                  Updates every {updateInterval / 1000} seconds
                </Text>
              </View>
            )}

            {/* Benefits (when not sharing) */}
            {!isSharing && (
              <View className="mb-4">
                <Text className="text-gray-700 font-sans-semibold text-base mb-3">
                  Why share your location?
                </Text>
                
                <View className="space-y-3">
                  <View className="flex-row items-start mb-3">
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text className="text-gray-600 font-sans text-sm ml-3 flex-1">
                      Get found instantly by patients needing urgent care
                    </Text>
                  </View>
                  
                  <View className="flex-row items-start mb-3">
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text className="text-gray-600 font-sans text-sm ml-3 flex-1">
                      Increase visibility to nearby patients
                    </Text>
                  </View>
                  
                  <View className="flex-row items-start mb-3">
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text className="text-gray-600 font-sans text-sm ml-3 flex-1">
                      Receive more appointment bookings
                    </Text>
                  </View>

                  <View className="flex-row items-start mt-4 pt-4 border-t border-gray-100">
                    <Ionicons name="shield-checkmark" size={20} color="#3b82f6" />
                    <Text className="text-gray-600 font-sans text-sm ml-3 flex-1">
                      Your exact address is never shared - only your general location
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Privacy Note */}
            <View className="bg-blue-50 p-4 rounded-lg">
              <View className="flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#3b82f6" />
                <Text className="text-blue-700 font-sans text-xs ml-3 flex-1">
                  Location sharing stops automatically when you close the app or disable it manually. 
                  Your privacy is always protected.
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 py-4 rounded-xl mt-4"
            >
              <Text className="text-gray-700 font-sans-semibold text-center">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};