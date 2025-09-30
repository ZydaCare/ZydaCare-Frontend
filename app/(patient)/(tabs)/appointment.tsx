import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Navbar from '@/components/Navbar'
import { Images } from '@/assets/Images'
import { router } from 'expo-router'

export default function Appointment() {
  const [isAppointment, setIsAppointment] = useState(true) // Set to true to show appointments
  const [selectedTab, setSelectedTab] = useState('Ongoing') // Track selected tab

  const appointments = [
    {
      id: 1,
      doctorName: 'Dr Kunmi Tayo',
      speciality: 'Medical Doctor',
      date: 'Thursday May 1st 2025',
      status: 'Pending', // upcoming
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 2,
      doctorName: 'Dr Kunmi Tayo',
      speciality: 'Medical Doctor',
      date: 'Thursday May 1st 2025',
      status: 'Ongoing', // in-progress
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 3,
      doctorName: 'Dr Kunmi Tayo',
      speciality: 'Medical Doctor',
      date: 'Thursday May 1st 2025',
      status: 'Cancelled',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'
    },
    {
      id: 4,
      doctorName: 'Dr Kunmi Tayo',
      speciality: 'Medical Doctor',
      date: 'Thursday May 1st 2025',
      status: 'Completed',
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face'
    }
  ]

  const tabs = ['Upcoming', 'Ongoing', 'All']

  const getStatusColor = (status: any) => {
    switch (status) {
      case 'Pending':
        return 'text-secondary'
      case 'Ongoing':
        return 'text-primary'
      case 'Completed':
        return 'text-green-500'
      case 'Cancelled':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getFilteredAppointments = () => {
    if (selectedTab === 'All') return appointments
    if (selectedTab === 'Upcoming') return appointments.filter(apt => apt.status === 'Pending')
    if (selectedTab === 'Ongoing') return appointments.filter(apt => apt.status === 'Ongoing')
    return appointments
  }

  const AppointmentCard = ({ appointment }: any) => (
    <View className="bg-white rounded-2xl p-4 mb-4 mx-4 shadow-sm">
      <View className="flex-row items-center">
        <Image
          source={{ uri: appointment.image }}
          className="w-[100px] h-[100px] rounded-xl"
          resizeMode="cover"
        />
        
        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-base font-semibold text-gray-900">{appointment.doctorName}</Text>
            <Text className={`text-sm font-medium ${getStatusColor(appointment.status)}`}>
              {appointment.status}
            </Text>
          </View>
          
          <Text className="text-gray-600 text-sm mb-1">{appointment.speciality}</Text>
          <Text className="text-gray-500 text-xs mb-3">{appointment.date}</Text>
          
          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="bg-teal-100 px-3 py-3 rounded-lg flex-1">
              <Text className="text-teal-600 font-medium text-sm text-center">View Details</Text>
            </TouchableOpacity>
            
            {appointment.status === 'Pending' || appointment.status === 'Ongoing' ? (
              <TouchableOpacity className="bg-teal-500 px-3 py-3 rounded-lg flex-1 flex-row items-center justify-center">
                <Ionicons name="chatbubble-outline" size={16} color="white" />
                <Text className="text-white font-medium text-sm ml-2">Chat</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity className="bg-teal-500 px-2 py-3 rounded-lg flex-1">
                <Text className="text-white font-medium text-sm text-center">Consult Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  )

  const TabButton = ({ title, isSelected, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-10 py-3 rounded-[10px] ${
        isSelected ? 'bg-secondary' : 'bg-gray-200'
      }`}
    >
      <Text className={`font-medium ${
        isSelected ? 'text-white' : 'text-gray-600'
      }`}>
        {title}
      </Text>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <Navbar />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
      >
        {!isAppointment ? (
          <View className="flex-1 items-center justify-center px-6">
            <Image source={Images.vector} className="w-[300px] h-[300px]" />

            <TouchableOpacity
              onPress={() => router.push('/(patient)/(pages)/search')}
              className="bg-primary rounded-[10px] w-[300px] px-4 py-3 mt-5"
            >
              <Text className="text-white text-lg text-center font-sans-semibold">
                Consult a doctor
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            {/* Tab Navigation */}
            <View className="flex-row flex-wrap justify-center gap-5 py-6 px-4">
              {tabs.map((tab) => (
                <TabButton
                  key={tab}
                  title={tab}
                  isSelected={selectedTab === tab}
                  onPress={() => setSelectedTab(tab)}
                />
              ))}
            </View>

            {/* Appointments List / Empty State */}
            <View className="flex-1">
              {getFilteredAppointments().length === 0 ? (
                <View className="flex-1 items-center justify-center px-6 mt-10">
                  <Image source={Images.vector} className="w-[250px] h-[250px]" />
                  <Text className="text-secondary text-[16px] mt-4">
                    No {selectedTab.toLowerCase()} appointments
                  </Text>

                  {selectedTab !== 'All' && (
                    <TouchableOpacity
                      onPress={() => router.push('/(patient)/(pages)/search')}
                      className="bg-primary rounded-[10px] w-[250px] px-4 py-3 mt-5"
                    >
                      <Text className="text-white text-lg text-center font-sans-semibold">
                        Consult a doctor
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                getFilteredAppointments().map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              )}
            </View>

            {/* Bottom spacing */}
            <View className="h-8" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
