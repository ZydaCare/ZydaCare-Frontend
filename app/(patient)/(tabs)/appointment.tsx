import { View, Text, ScrollView, Image, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Navbar from '@/components/Navbar'
import { Images } from '@/assets/Images'
import { router, useFocusEffect } from 'expo-router'
import { format as formatDate } from 'date-fns'
import axios from 'axios'
import { BASE_URL } from '@/config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getMyAppointments } from '@/api/patient/appointments'
import { useToast } from '@/components/ui/Toast'

export default function Appointment() {
  const [isAppointment, setIsAppointment] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'Upcoming' | 'Ongoing' | 'Cancelled' | 'All'>('Ongoing')
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useToast();

  const tabs: Array<'Upcoming' | 'Ongoing' | 'Cancelled' | 'All'> = ['Upcoming', 'Ongoing', 'Cancelled', 'All']

  const fetchAppointments = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    console.log('User token', token);
    if (!token) return
    try {
      setLoading(true)
      setError(null)
      const res = await getMyAppointments(token)
      const appointmentArray = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      const items = appointmentArray.map((b: any) => ({
        ...b,
        date: b.appointmentDate ? formatDate(new Date(b.appointmentDate), 'd MMMM yyyy h:mma') : '',
        speciality: b.doctor?.speciality || b.medicalContext?.preferredDoctorOrSpecialty || 'General Practice',
        image: b.doctor?.profile?.profileImage?.url || b.doctor?.profile?.profileImageUrl,
      }))
      setAppointments(items)
      setIsAppointment(items.length > 0)
    } catch (e: any) {
      setError(e?.message || 'Failed to load appointments')
      console.log(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  useFocusEffect(
    useCallback(() => {
      fetchAppointments()
    }, [fetchAppointments])
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-amber-600'
      case 'accepted':
        return 'text-primary'
      case 'awaiting_payment':
        return 'text-amber-600'
      case 'paid':
        return 'text-green-600'
      case 'cancelled':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50'
      case 'accepted':
        return 'bg-primary/20'
      case 'awaiting_payment':
        return 'bg-amber-50'
      case 'paid':
        return 'bg-green-50'
      case 'cancelled':
        return 'bg-red-50'
      default:
        return 'bg-gray-50'
    }
  }

  const getFilteredAppointments = useMemo(() => {
    const now = new Date()
    const items = appointments.map(a => {
      const start = a.dateISO ? new Date(a.dateISO) : null
      const status = String(a.status || '').toLowerCase()
      const sameDay = start ? start.toDateString() === now.toDateString() : false
      const startedOrNow = start ? now >= start : false

      // Derive flags per spec
      const isCancelled = status === 'cancelled'
      const isCompleted = status === 'paid'
      const isAccepted = status === 'accepted'
      const isAwaitingPayment = status === 'awaiting_payment'
      const isUpcoming = !!start && start > now && status === 'pending'
      const isOngoing = (!isCancelled && !isCompleted) && (isAccepted || isAwaitingPayment || (sameDay && startedOrNow))

      return {
        ...a,
        status,
        date: a.dateISO ? formatDate(new Date(a.dateISO), 'd MMMM yyyy h:mma') : '',
        isUpcoming,
        isOngoing,
        isCancelled
      }
    })

    if (selectedTab === 'All') return items
    if (selectedTab === 'Cancelled') return items.filter(apt => apt.isCancelled)
    if (selectedTab === 'Upcoming') return items.filter(apt => apt.isUpcoming)
    if (selectedTab === 'Ongoing') return items.filter(apt => apt.isOngoing)
    return items
  }, [appointments, selectedTab])

  const handleBookAgain = (appointment: any) => {
    router.push({
      pathname: '/appointment/book',
      params: { doctorId: appointment.doctor._id },
    });
  } 

  const AppointmentCard = ({ appointment }: any) => (
    <View className="bg-white rounded-2xl p-4 mb-4 mx-4 shadow-sm border border-gray-100">
      <View className="flex-row">
        {appointment.doctor?.profile?.profileImage?.url ? (
          <Image
            source={{ uri: appointment.doctor.profile.profileImage.url }}
            className="w-[90px] h-[90px] rounded-xl"
            resizeMode="cover"
          />
        ) : (
          <View className="w-[90px] h-[90px] rounded-xl items-center justify-center bg-primary/10">
            <Ionicons name="person" size={40} color='#67A9AF' />
          </View>
        )}

        <View className="flex-1 ml-4">
          <View className="flex-row items-start justify-between mb-2">
            <Text className="text-base font-sans-bold text-gray-900 flex-1 pr-2">
              {appointment.doctor?.profile?.title} {appointment.doctor?.fullName}
            </Text>
            <View className={`px-3 py-1 rounded-full ${getStatusBgColor(appointment.status)}`}>
              <Text className={`text-xs font-sans-semibold ${getStatusColor(appointment.status)} capitalize`}>
                {appointment.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mb-2">
            <Ionicons name="medical-outline" size={14} color="#6B7280" />
            <Text className="text-gray-600 font-sans text-sm ml-1.5">{appointment.speciality}</Text>
          </View>

          <View className="flex-row items-center mb-3">
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text className="text-gray-500 font-sans text-xs ml-1.5">
              {appointment.date || (appointment.appointmentDate ? formatDate(new Date(appointment.appointmentDate), 'd MMMM yyyy h:mma') : '')}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/(patient)/(pages)/appointment/[id]', params: { id: appointment._id } })}
              className="bg-primary/10 px-3 py-2.5 rounded-lg flex-1"
            >
              <Text className="text-primary font-sans-semibold text-sm text-center">View Details</Text>
            </TouchableOpacity>

            {(appointment.isOngoing || appointment.awaiting_payment) ? (
              <TouchableOpacity
                onPress={() => {
                  if (!appointment.chatRoom?._id) {
                    showToast('Chat room not available yet', 'error');
                    return;
                  }
                  router.push({
                    pathname: `/(patient)/(pages)/chat/${appointment.chatRoom._id}`,
                    params: {
                      doctorId: appointment.doctor._id,
                      doctorName: `${appointment.doctor.fullName}`,
                      doctorTitle: appointment.doctor.profile?.title,
                      doctorAvatar: appointment.doctor.profile?.profileImage?.url
                    }
                  });
                }}
                className="bg-primary px-3 py-2.5 rounded-lg flex-1 flex-row items-center justify-center"
              >
                <Ionicons name="chatbubble-outline" size={16} color="white" />
                <Text className="text-white font-sans-semibold text-sm ml-1.5">Chat</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => handleBookAgain(appointment)} className="bg-primary px-3 py-2.5 rounded-lg flex-1">
                <Text className="text-white font-sans-semibold text-sm text-center">Book Again</Text>
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
      className={`px-4 py-3 rounded-xl ${isSelected ? 'bg-primary shadow-sm' : 'bg-white border border-gray-200'}`}
    >
      <Text className={`font-sans-semibold ${isSelected ? 'text-white' : 'text-gray-600'}`}>
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
          <View className="flex-1 items-center justify-center px-6 pt-10">
            <View className="w-24 h-24 bg-primary/10 rounded-full items-center justify-center mb-6">
              <Ionicons name="calendar-outline" size={48} color="#67A9AF" />
            </View>

            <Text className="text-2xl font-sans-bold text-gray-900 mb-3">No Appointments Yet</Text>
            <Text className="text-base text-gray-600 font-sans text-center mb-8 px-4">
              Book your first appointment with a qualified doctor
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/(patient)/(pages)/search')}
              className="bg-primary rounded-xl px-8 py-4 shadow-sm"
            >
              <Text className="text-white text-base font-sans-bold">
                Find a Doctor
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1">
            {/* Tab Navigation */}
            <View className="flex-row flex-wrap justify-center gap-3 py-6 px-4">
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
              {loading && (
                <View className="items-center justify-center py-10">
                  <ActivityIndicator size="large" color="#67A9AF" />
                  <Text className="text-gray-600 font-sans mt-3">Loading appointments...</Text>
                </View>
              )}
              {!!error && (
                <View className="items-center justify-center py-4 mx-4">
                  <View className="bg-red-50 border border-red-100 rounded-xl p-4 w-full">
                    <Text className="text-red-700 font-sans text-center">{error}</Text>
                  </View>
                </View>
              )}
              {!loading && getFilteredAppointments.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6 mt-10">
                  <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                  </View>
                  <Text className="text-lg font-sans-bold text-gray-900 mb-2">
                    No {selectedTab.toLowerCase()} appointments
                  </Text>
                  <Text className="text-sm text-gray-500 font-sans text-center mb-6">
                    {selectedTab === 'All'
                      ? 'You have no appointments yet'
                      : `You have no ${selectedTab.toLowerCase()} appointments at the moment`}
                  </Text>

                  {selectedTab !== 'All' && (
                    <TouchableOpacity
                      onPress={() => router.push('/(patient)/(pages)/search')}
                      className="bg-primary rounded-xl px-6 py-3 shadow-sm"
                    >
                      <Text className="text-white text-base font-sans-bold">
                        Book Appointment
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                getFilteredAppointments.map((appointment) => (
                  <AppointmentCard key={appointment._id} appointment={appointment} />
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