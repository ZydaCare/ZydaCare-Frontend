import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HealthMetricsTab from './HealthMetricsTab';
import MedicationsTab from './MedicationsTab';

type TabType = 'metrics' | 'medications';

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('metrics');

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ 
        backgroundColor: 'white', 
        paddingHorizontal: 16, 
        paddingTop: 48, 
        paddingBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2
      }}>
        <Text style={{ 
          fontSize: 24, 
          // fontWeight: '700', 
          color: '#111827',
          marginBottom: 4 
        }} className='font-sans-medium'>
          Health Profile
        </Text>
        <Text style={{ color: '#6b7280', marginBottom: 16 }} className='font-sans'>
          Manage your health information
        </Text>

        {/* Tab Navigation */}
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: '#f3f4f6', 
          borderRadius: 8, 
          padding: 4 
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              borderRadius: 6,
              backgroundColor: activeTab === 'metrics' ? 'white' : 'transparent',
              shadowColor: activeTab === 'metrics' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: activeTab === 'metrics' ? 1 : 0
            }}
            onPress={() => setActiveTab('metrics')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="fitness-outline" 
              size={20} 
              color={activeTab === 'metrics' ? '#67A9AF' : '#6b7280'} 
            />
            <Text
              style={{
                marginLeft: 8,
                fontWeight: '500',
                color: activeTab === 'metrics' ? '#67A9AF' : '#6b7280'
              }}
              className='font-sans-semibold'
            >
              Health Metrics
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              borderRadius: 6,
              backgroundColor: activeTab === 'medications' ? 'white' : 'transparent',
              shadowColor: activeTab === 'medications' ? '#000' : 'transparent',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: activeTab === 'medications' ? 1 : 0
            }}
            onPress={() => setActiveTab('medications')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="medical-outline" 
              size={20} 
              color={activeTab === 'medications' ? '#67A9AF' : '#6b7280'} 
            />
            <Text
              style={{
                marginLeft: 8,
                fontWeight: '500',
                color: activeTab === 'medications' ? '#67A9AF' : '#6b7280'
              }}
              className='font-sans-semibold'
            >
              Medications
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'metrics' ? <HealthMetricsTab /> : <MedicationsTab />}
      </View>
    </View>
  );
}