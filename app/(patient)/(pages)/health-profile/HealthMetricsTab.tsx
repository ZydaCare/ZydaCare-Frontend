import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { healthProfileApi } from '@/api/patient/healthProfile';
import { shareProfile } from '@/api/patient/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HealthMetricsState {
  temperature: { value: string; unit: 'C' | 'F' };
  bloodPressure: { systolic: string; diastolic: string };
  pulseRate: string;
  bloodOxygen: string;
  height: { value: string; unit: 'cm' | 'ft' };
  weight: { value: string; unit: 'kg' | 'lb' };
  bmi?: { value: number; category: string };
  visualAcuity: { leftEye: string; rightEye: string };
}

export default function HealthMetricsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sharingProfile, setSharingProfile] = useState(false);
  const [profileShared, setProfileShared] = useState(false);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetricsState>({
    temperature: { value: '', unit: 'C' },
    bloodPressure: { systolic: '', diastolic: '' },
    pulseRate: '',
    bloodOxygen: '',
    height: { value: '', unit: 'cm' },
    weight: { value: '', unit: 'kg' },
    visualAcuity: { leftEye: '20', rightEye: '20' },
  });

  const { showToast } = useToast();

  useEffect(() => {
    fetchHealthProfile();
  }, []);

  const fetchHealthProfile = async () => {
    const token = await AsyncStorage.getItem('token');
    try {
      const { healthProfile } = await healthProfileApi.getHealthProfile(token!);

      if (healthProfile.temperature) {
        setHealthMetrics(prev => ({
          ...prev,
          temperature: {
            value: healthProfile.temperature.value?.toString() || '',
            unit: healthProfile.temperature.unit || 'C'
          }
        }));
      }

      if (healthProfile.bloodPressure) {
        setHealthMetrics(prev => ({
          ...prev,
          bloodPressure: {
            systolic: healthProfile.bloodPressure.systolic?.toString() || '',
            diastolic: healthProfile.bloodPressure.diastolic?.toString() || ''
          }
        }));
      }

      if (healthProfile.pulseRate) {
        setHealthMetrics(prev => ({
          ...prev,
          pulseRate: healthProfile.pulseRate.value?.toString() || ''
        }));
      }

      if (healthProfile.bloodOxygen) {
        setHealthMetrics(prev => ({
          ...prev,
          bloodOxygen: healthProfile.bloodOxygen.value?.toString() || ''
        }));
      }

      if (healthProfile.height) {
        setHealthMetrics(prev => ({
          ...prev,
          height: {
            value: healthProfile.height.value?.toString() || '',
            unit: healthProfile.height.unit || 'cm'
          }
        }));
      }

      if (healthProfile.weight) {
        setHealthMetrics(prev => ({
          ...prev,
          weight: {
            value: healthProfile.weight.value?.toString() || '',
            unit: healthProfile.weight.unit || 'kg'
          },
          bmi: healthProfile.bmi
        }));
      }

      if (healthProfile.visualAcuity) {
        setHealthMetrics(prev => ({
          ...prev,
          visualAcuity: {
            leftEye: healthProfile.visualAcuity.leftEye?.replace('/20', '') || '20',
            rightEye: healthProfile.visualAcuity.rightEye?.replace('/20', '') || '20'
          }
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching health profile:', error);
      setLoading(false);
      showToast('Failed to load health profile', 'error');
    }
  };

  const handleSaveHealthMetrics = async () => {
    setSaving(true);
    try {
      const payload: any = {};

      if (healthMetrics.temperature.value) {
        payload.temperature = {
          value: parseFloat(healthMetrics.temperature.value),
          unit: healthMetrics.temperature.unit
        };
      }

      if (healthMetrics.bloodPressure.systolic && healthMetrics.bloodPressure.diastolic) {
        payload.bloodPressure = {
          systolic: parseInt(healthMetrics.bloodPressure.systolic),
          diastolic: parseInt(healthMetrics.bloodPressure.diastolic)
        };
      }

      if (healthMetrics.pulseRate) {
        payload.pulseRate = parseFloat(healthMetrics.pulseRate);
      }

      if (healthMetrics.bloodOxygen) {
        payload.bloodOxygen = parseFloat(healthMetrics.bloodOxygen);
      }

      if (healthMetrics.height.value) {
        payload.height = {
          value: parseFloat(healthMetrics.height.value),
          unit: healthMetrics.height.unit
        };
      }

      if (healthMetrics.weight.value) {
        payload.weight = {
          value: parseFloat(healthMetrics.weight.value),
          unit: healthMetrics.weight.unit
        };
      }

      if (healthMetrics.visualAcuity.leftEye && healthMetrics.visualAcuity.rightEye) {
        payload.visualAcuity = {
          leftEye: `${healthMetrics.visualAcuity.leftEye}/20`,
          rightEye: `${healthMetrics.visualAcuity.rightEye}/20`
        };
      }
      const token = await AsyncStorage.getItem('token');
      const response = await healthProfileApi.updateHealthMetrics(token!, payload);

      if (response.healthProfile.bmi) {
        setHealthMetrics(prev => ({
          ...prev,
          bmi: response.healthProfile.bmi
        }));
      }

      showToast('Health metrics saved successfully', 'success');
    } catch (error: any) {
      console.error('Error saving health metrics:', error);
      showToast(error.response?.data?.error || 'Failed to save health metrics', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleShareProfile = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      showToast('Authentication required', 'error');
      return;
    }

    try {
      setSharingProfile(true);
      const res = await shareProfile(token);
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to share profile');
      }
      showToast('Profile shared successfully', 'success');
      setProfileShared(true);
    } catch (err: any) {
      showToast(err?.message || 'Failed to share profile', 'error');
      setProfileShared(false);
    } finally {
      setSharingProfile(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      {/* Share Profile Card */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center mb-3">
          <Ionicons name="share-social-outline" size={22} color="#67A9AF" />
          <Text className="text-lg font-sans-semibold ml-2">Share Health Profile</Text>
        </View>

        <View className="bg-blue-50 p-3 rounded-lg mb-3">
          <View className="flex-row items-start gap-2">
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text className="text-xs font-sans text-blue-700 flex-1">
              Share your complete health profile with doctors to help them provide better care and make informed decisions about your treatment when you book an appointment.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleShareProfile}
          disabled={sharingProfile || profileShared}
          className={`flex-row items-center justify-center gap-2 py-3.5 rounded-xl ${
            profileShared
              ? 'bg-green-50 border border-green-200'
              : sharingProfile
              ? 'bg-gray-100'
              : 'bg-[#67A9AF]'
          }`}
        >
          {sharingProfile ? (
            <>
              <ActivityIndicator color="#6B7280" size="small" />
              <Text className="text-gray-600 font-sans-medium">Sharing Profile...</Text>
            </>
          ) : profileShared ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text className="text-green-700 font-sans-medium">Profile Shared Successfully</Text>
            </>
          ) : (
            <>
              <Ionicons name="share-outline" size={20} color="white" />
              <Text className="text-white font-sans-medium">Share My Health Profile</Text>
            </>
          )}
        </TouchableOpacity>

        {profileShared && (
          <View className="mt-3 bg-green-50 p-3 rounded-lg flex-row items-start gap-2">
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text className="text-xs text-green-700 flex-1">
              Your health profile has been shared and is now accessible to your healthcare providers
            </Text>
          </View>
        )}
      </View>

      {/* Vital Signs Card */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center mb-4">
          <Ionicons name="heart-outline" size={22} color="#67A9AF" />
          <Text className="text-lg font-sans-semibold ml-2">Vital Signs</Text>
        </View>

        {/* Temperature */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Temperature</Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 border border-gray-200 rounded-lg px-3 py-3 mr-2"
              value={healthMetrics.temperature.value}
              onChangeText={(text) => setHealthMetrics({
                ...healthMetrics,
                temperature: { ...healthMetrics.temperature, value: text }
              })}
              keyboardType="numeric"
              placeholder="36.5"
            />
            <View className="flex-row bg-gray-100 rounded-lg p-1">
              <TouchableOpacity
                className={`px-4 py-2 rounded ${healthMetrics.temperature.unit === 'C' ? 'bg-primary' : ''}`}
                onPress={() => setHealthMetrics({
                  ...healthMetrics,
                  temperature: { ...healthMetrics.temperature, unit: 'C' }
                })}
              >
                <Text className={healthMetrics.temperature.unit === 'C' ? 'text-white font-medium' : 'text-gray-600'}>°C</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded ${healthMetrics.temperature.unit === 'F' ? 'bg-primary' : ''}`}
                onPress={() => setHealthMetrics({
                  ...healthMetrics,
                  temperature: { ...healthMetrics.temperature, unit: 'F' }
                })}
              >
                <Text className={healthMetrics.temperature.unit === 'F' ? 'text-white font-medium' : 'text-gray-600'}>°F</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Blood Pressure */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Blood Pressure (mmHg)</Text>
          <View className="flex-row items-center">
            <View className="flex-1 mr-2">
              <Text className="text-xs text-gray-500 mb-1">Systolic</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-3 text-center"
                value={healthMetrics.bloodPressure.systolic}
                onChangeText={(text) => setHealthMetrics({
                  ...healthMetrics,
                  bloodPressure: { ...healthMetrics.bloodPressure, systolic: text }
                })}
                keyboardType="numeric"
                placeholder="120"
              />
            </View>
            <Text className="text-2xl text-gray-400 mx-2">/</Text>
            <View className="flex-1 ml-2">
              <Text className="text-xs text-gray-500 mb-1">Diastolic</Text>
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-3 text-center"
                value={healthMetrics.bloodPressure.diastolic}
                onChangeText={(text) => setHealthMetrics({
                  ...healthMetrics,
                  bloodPressure: { ...healthMetrics.bloodPressure, diastolic: text }
                })}
                keyboardType="numeric"
                placeholder="80"
              />
            </View>
          </View>
        </View>

        {/* Pulse Rate */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Pulse Rate (bpm)</Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-3 py-3"
            value={healthMetrics.pulseRate}
            onChangeText={(text) => setHealthMetrics({ ...healthMetrics, pulseRate: text })}
            keyboardType="numeric"
            placeholder="72"
          />
        </View>

        {/* Blood Oxygen */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Blood Oxygen SpO₂ (%)</Text>
          <TextInput
            className="border border-gray-200 rounded-lg px-3 py-3"
            value={healthMetrics.bloodOxygen}
            onChangeText={(text) => setHealthMetrics({ ...healthMetrics, bloodOxygen: text })}
            keyboardType="numeric"
            placeholder="98"
          />
        </View>
      </View>

      {/* Physical Measurements Card */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <View className="flex-row items-center mb-4">
          <Ionicons name="body-outline" size={22} color="#67A9AF" />
          <Text className="text-lg font-sans-semibold ml-2">Physical Measurements</Text>
        </View>

        {/* Height */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Height</Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 border border-gray-200 rounded-lg px-3 py-3 mr-2"
              value={healthMetrics.height.value}
              onChangeText={(text) => setHealthMetrics({
                ...healthMetrics,
                height: { ...healthMetrics.height, value: text }
              })}
              keyboardType="numeric"
              placeholder="175"
            />
            <View className="flex-row bg-gray-100 rounded-lg p-1">
              <TouchableOpacity
                className={`px-4 py-2 rounded ${healthMetrics.height.unit === 'cm' ? 'bg-primary' : ''}`}
                onPress={() => setHealthMetrics({
                  ...healthMetrics,
                  height: { ...healthMetrics.height, unit: 'cm' }
                })}
              >
                <Text className={healthMetrics.height.unit === 'cm' ? 'text-white font-medium' : 'text-gray-600'}>cm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded ${healthMetrics.height.unit === 'ft' ? 'bg-primary' : ''}`}
                onPress={() => setHealthMetrics({
                  ...healthMetrics,
                  height: { ...healthMetrics.height, unit: 'ft' }
                })}
              >
                <Text className={healthMetrics.height.unit === 'ft' ? 'text-white font-medium' : 'text-gray-600'}>ft</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Weight */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Weight</Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 border border-gray-200 rounded-lg px-3 py-3 mr-2"
              value={healthMetrics.weight.value}
              onChangeText={(text) => setHealthMetrics({
                ...healthMetrics,
                weight: { ...healthMetrics.weight, value: text }
              })}
              keyboardType="numeric"
              placeholder="70"
            />
            <View className="flex-row bg-gray-100 rounded-lg p-1">
              <TouchableOpacity
                className={`px-4 py-2 rounded ${healthMetrics.weight.unit === 'kg' ? 'bg-primary' : ''}`}
                onPress={() => setHealthMetrics({
                  ...healthMetrics,
                  weight: { ...healthMetrics.weight, unit: 'kg' }
                })}
              >
                <Text className={healthMetrics.weight.unit === 'kg' ? 'text-white font-medium' : 'text-gray-600'}>kg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded ${healthMetrics.weight.unit === 'lb' ? 'bg-primary' : ''}`}
                onPress={() => setHealthMetrics({
                  ...healthMetrics,
                  weight: { ...healthMetrics.weight, unit: 'lb' }
                })}
              >
                <Text className={healthMetrics.weight.unit === 'lb' ? 'text-white font-medium' : 'text-gray-600'}>lb</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BMI Display */}
        {healthMetrics.bmi && (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-gray-700 font-medium mb-1">Body Mass Index (BMI)</Text>
                <Text className="text-xs text-gray-500">Auto-calculated</Text>
              </View>
              <View className="items-end">
                <Text className="text-2xl font-bold text-primary">{healthMetrics.bmi.value}</Text>
                <Text className="text-sm text-gray-600 capitalize">
                  {healthMetrics.bmi.category}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Visual Acuity */}
        <View className="mb-4">
          <Text className="text-gray-700 font-medium mb-2">Visual Acuity</Text>
          <View className="flex-row">
            <View className="flex-1 mr-2">
              <Text className="text-xs text-gray-500 mb-1">Left Eye (20/...)</Text>
              <View className="flex-row items-center border border-gray-200 rounded-lg px-3 py-3">
                <Text className="mr-2 text-gray-600">20/</Text>
                <TextInput
                  className="flex-1"
                  value={healthMetrics.visualAcuity.leftEye}
                  onChangeText={(text) => setHealthMetrics({
                    ...healthMetrics,
                    visualAcuity: { ...healthMetrics.visualAcuity, leftEye: text }
                  })}
                  keyboardType="numeric"
                  placeholder="20"
                />
              </View>
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs text-gray-500 mb-1">Right Eye (20/...)</Text>
              <View className="flex-row items-center border border-gray-200 rounded-lg px-3 py-3">
                <Text className="mr-2 text-gray-600">20/</Text>
                <TextInput
                  className="flex-1"
                  value={healthMetrics.visualAcuity.rightEye}
                  onChangeText={(text) => setHealthMetrics({
                    ...healthMetrics,
                    visualAcuity: { ...healthMetrics.visualAcuity, rightEye: text }
                  })}
                  keyboardType="numeric"
                  placeholder="20"
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        className="bg-primary py-4 rounded-xl mb-12 shadow-sm"
        onPress={handleSaveHealthMetrics}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View className="flex-row justify-center items-center">
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text className="text-white text-center font-sans-semibold ml-2 text-base">
              Save Health Metrics
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}