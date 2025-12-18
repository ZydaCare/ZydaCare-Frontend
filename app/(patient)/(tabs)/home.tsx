import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Dimensions, StatusBar, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { format, parseISO, isToday, isAfter, isBefore, addMinutes } from 'date-fns';
import Button from '@/components/ui/Button';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/authContext';
import { getMyAppointments } from '@/api/patient/appointments';
import UpcomingAppointmentCard from '@/components/UpcomingAppointmentCard';
import HealthTipsSection from '@/components/HealthTipsSection';
import { ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useToast } from '@/components/ui/Toast';

interface CategoryItem {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const categories: CategoryItem[] = [
  { id: 1, name: 'General Doctor', icon: 'medkit-outline' },
  { id: 2, name: 'Surgeon', icon: 'cut-outline' },
  { id: 3, name: 'Dentist', icon: 'bandage-outline' },
  { id: 4, name: 'Child Care', icon: 'happy-outline' },
  { id: 5, name: 'Care Giver', icon: 'person-add-outline' },
  { id: 6, name: 'Psychiatrist', icon: 'people-outline' },
  { id: 7, name: 'Cardiologist', icon: 'heart-outline' },
  { id: 8, name: 'Ophthalmologist', icon: 'eye-outline' },
  { id: 9, name: 'Dermatologist', icon: 'sparkles-outline' },
  { id: 10, name: 'Neurologist', icon: 'fitness-outline' },
  { id: 11, name: 'Orthopedic', icon: 'body-outline' },
  { id: 12, name: 'ENT Specialist', icon: 'ear-outline' },
  { id: 13, name: 'Gynecologist', icon: 'woman-outline' },
  { id: 14, name: 'Urologist', icon: 'male-female-outline' },
  { id: 15, name: 'Nutritionist', icon: 'restaurant-outline' },
  { id: 16, name: 'Psychologist', icon: 'happy-outline' },
  { id: 17, name: 'Pediatrician', icon: 'medkit-outline' },
  { id: 18, name: 'Pulmonologist', icon: 'pulse-outline' },
  { id: 19, name: 'Radiologist', icon: 'radio-outline' },
  { id: 20, name: 'Oncologist', icon: 'flame-outline' },
  { id: 21, name: 'Nephrologist', icon: 'water-outline' },
]

const Home = () => {
  const [homeSearch, setHomeSearch] = useState('');
  const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isLoading, isAuthenticated, user, getMe } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sendingSOS, setSendingSOS] = useState(false);
  const { showToast } = useToast();
  const [greeting, setGreeting] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoadingProfile(true)
        try {
          await getMe()
        } finally {
          setLoadingProfile(false)
        }
      }
    }
    fetchProfile()
  }, [user])

  // Get personalized greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };

    loadToken();
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await getMyAppointments(token);
      const now = new Date();

      const upcoming = (res.data || res || [])
        .map((appt: any) => {
          const apptDate = new Date(appt.appointmentDate);
          const endTime = addMinutes(apptDate, 30);

          const status = String(appt.status || '').toLowerCase();
          const sameDay = isToday(apptDate);
          const startedOrNow = now >= apptDate;

          const isCancelled = status === 'cancelled';
          const isCompleted = status === 'paid';
          const isAccepted = status === 'accepted';
          const isPending = status === 'pending';
          const isAwaitingPayment = status === 'awaiting_payment';
          const isUpcoming = !!apptDate && apptDate > now && status === 'pending';
          const isOngoing = (!isCancelled && !isCompleted) && (isAccepted || isAwaitingPayment || (sameDay && startedOrNow))
          const isPast = apptDate && apptDate < now;

          let displayStatus: 'pending' | 'upcoming' | 'accepted' | 'awaiting_payment' | 'cancelled' | 'paid' | 'past' = 'upcoming';
          if (isOngoing) {
            displayStatus = 'accepted';
          } else if (isCompleted || isCancelled || (apptDate && apptDate < now)) {
            displayStatus = 'paid';
          } else if (isPending) {
            displayStatus = 'pending';
          } else if (isAwaitingPayment) {
            displayStatus = 'awaiting_payment';
          }

          const title = appt.doctor?.profile?.title || '';
          const first = appt.doctor?.user?.firstName || '';
          const last = appt.doctor?.user?.lastName || '';
          const constructedName = `${title ? title + ' ' : ''}${first} ${last}`.trim();

          return {
            ...appt,
            _id: appt._id || appt.id,
            doctorName: constructedName || 'Doctor',
            speciality: appt.doctor?.speciality || 'General Practice',
            dateISO: appt.appointmentDate,
            status: displayStatus,
            originalStatus: status,
            endTime,
            isCancelled,
            isCompleted,
            isAwaitingPayment
          };
        })
        .filter((appt: any) =>
          appt.status === 'upcoming' ||
          (appt.status === 'ongoing' && isBefore(now, appt.endTime))
        )
        .sort((a: any, b: any) => new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime())[0];

      setUpcomingAppointment(upcoming || null);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  const handleSearch = () => {
    if (homeSearch.trim() !== '') {
      router.push({
        pathname: '/(patient)/(pages)/search',
        params: { query: homeSearch },
      })
    }
  }

  const handleCategoryPress = (categoryName: string) => {
    router.push({
      pathname: '/(patient)/(pages)/search',
      params: { category: categoryName },
    });
  };

  const { width } = Dimensions.get('window');
  const cardWidth = (width - 48) / 2 - 8;

  const handleSOS = async () => {
    try {
      setSendingSOS(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSendingSOS(false);
        showToast('Permission Denied! Location access is required to send SOS.', 'error');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      // Send data to your backend or emergency API
      // await fetch('https://api.zydacare.com/sos', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     location: coords,
      //     timestamp: new Date().toISOString(),
      //   }),
      // });

      setSendingSOS(false);
      setShowSOSModal(false);
      showToast('SOS Sent! Emergency responders have been notified. Help are on the way', 'success');
    } catch (error) {
      console.error('SOS Error:', error);
      setSendingSOS(false);
      setShowSOSModal(false);
      showToast('Unable to send SOS request.', 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFB" />
      {/* <Navbar /> */}

      <ScrollView showsVerticalScrollIndicator={false} className="">
        {/* Warm Welcome Header */}
        <View className="px-5 pt-4 pb-3">
          <Text className="text-2xl font-sans-bold text-gray-800">
            {greeting}{user?.firstName ? `, ${user.firstName}` : ''}! 👋
          </Text>
          <Text className="text-base font-sans text-gray-500 mt-1">
            How are you feeling today?
          </Text>
        </View>

        {/* Enhanced Search Bar with softer design */}
        <View className="px-5 mt-2 mb-4">
          <View className="flex-row items-center w-full h-14 px-4 bg-white rounded-2xl shadow-sm" style={{ shadowColor: '#67A9AF', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
            <Ionicons name="search" size={20} color="#67A9AF" />
            <TextInput
              className="flex-1 ml-3 font-sans text-gray-800 text-base"
              placeholder="Search for doctors, specialists..."
              placeholderTextColor="#B4B4B4"
              value={homeSearch}
              onChangeText={setHomeSearch}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Upcoming Appointment - Priority Section */}
        {!loading && upcomingAppointment && (
          <View className="px-5 mb-5">
            <UpcomingAppointmentCard appointment={upcomingAppointment} />
          </View>
        )}

        {/* Quick Actions with Card Design */}
        <View className="px-5 mb-5">
          <Text className="text-lg font-sans-semibold text-gray-800 mb-3">
            What would you like to do?
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {[
              { id: 1, title: 'Book Appointment', icon: 'calendar' as const, color: '#67A9AF', route: '/(patient)/(pages)/search' as const, bgColor: '#E8F4F5' },
              { id: 2, title: 'My Appointments', icon: 'time' as const, color: '#5B8DEF', route: '/(patient)/(tabs)/appointment' as const, bgColor: '#EBF2FE' },
              { id: 3, title: 'Health Records', icon: 'folder-outline' as const, color: '#EF5B8D', route: '/(patient)/(pages)/medical-history/records' as const, bgColor: '#FEEBF2' },
              { id: 4, title: 'Get Support', icon: 'chatbubble-ellipses' as const, color: '#9B6BEF', route: '/(patient)/(pages)/support' as const, bgColor: '#F3EDFE' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                className="w-[48%] bg-white rounded-2xl p-5 mb-3 shadow-sm"
                style={{ shadowColor: item.color, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 }}
                onPress={() => router.push(item.route)}
                activeOpacity={0.7}
              >
                <View className="w-14 h-14 rounded-2xl items-center justify-center mb-3" style={{ backgroundColor: item.bgColor }}>
                  <Ionicons name={item.icon} size={26} color={item.color} />
                </View>
                <Text className="font-sans-semibold text-gray-800 text-sm leading-snug">
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Browse Specialists - Horizontal scroll with better spacing */}
        <View className="mb-5">
          <View className="px-5 mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-sans-semibold text-gray-800">
              Browse Specialists
            </Text>
            <TouchableOpacity onPress={() => router.push('/(patient)/(pages)/search')}>
              <Text className="text-sm font-sans-medium text-primary">See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {categories.slice(0, 12).map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handleCategoryPress(item.name)}
                className="bg-white rounded-2xl px-4 py-4 mr-3 items-center shadow-sm"
                style={{ width: 120, shadowColor: '#67A9AF', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}
              >
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mb-2"
                  style={{ backgroundColor: '#E8F4F5' }}
                >
                  <Ionicons name={item.icon} size={26} color="#67A9AF" />
                </View>
                <Text className="text-gray-800 font-sans-medium text-xs text-center leading-tight" numberOfLines={2}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Doctor Application - Softer card */}
        <View className="mx-5 mb-5 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl px-5 py-6 shadow-sm border border-primary/20" style={{ backgroundColor: '#E8F4F5' }}>
          <View className="flex-row items-start">
            <View className="bg-white p-3 rounded-xl mr-4 shadow-sm">
              <MaterialIcons name="medical-services" size={28} color="#67A9AF" />
            </View>

            <View className="flex-1">
              <Text className="font-sans-bold text-gray-800 text-base leading-snug">
                Are you a healthcare professional?
              </Text>

              <Text className="font-sans text-gray-600 text-sm mt-2 leading-relaxed">
                Join ZydaCare and start providing care to patients online
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/(patient)/(pages)/apply-doctor')}
                className="mt-4 bg-primary rounded-xl py-3 px-4 flex-row items-center justify-center"
                activeOpacity={0.8}
              >
                <MaterialIcons name="medical-services" size={18} color="#fff" />
                <Text className="font-sans-semibold text-white ml-2">Apply as Doctor</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Health Tips Section */}
        <HealthTipsSection />

        {/* Reassurance Message */}
        <View className="mx-5 mb-8 bg-white rounded-2xl px-5 py-5 shadow-sm mt-5" style={{ shadowColor: '#67A9AF', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 }}>
          <View className="flex-row items-center mb-2">
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text className="font-sans-semibold text-gray-800 text-base ml-2">
              Your Health, Our Priority
            </Text>
          </View>
          <Text className="font-sans text-gray-600 text-sm leading-relaxed">
            We're here 24/7 to support your healthcare journey. All consultations are private and secure.
          </Text>
        </View>

      </ScrollView>

      {/* Floating SOS Button - Slightly larger and more accessible */}
      <TouchableOpacity
        onPress={() => setShowSOSModal(true)}
        activeOpacity={0.9}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          backgroundColor: '#EF4444',
          width: 55,
          height: 55,
          borderRadius: 100,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#EF4444',
          shadowOpacity: 0.4,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="alert" size={28} color="#fff" />
        <Text className="text-white text-xs font-sans-bold ">SOS</Text>
      </TouchableOpacity>

      {/* Bottom spacing */}
      <View className='h-20' />

      {/* Enhanced SOS Modal with calmer design */}
      <Modal
        visible={showSOSModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowSOSModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <View className="items-center mb-5">
              <View className="bg-red-50 p-4 rounded-full mb-3">
                <Ionicons name="alert-circle" size={48} color="#EF4444" />
              </View>
              <Text className="text-xl font-sans-bold text-gray-800">
                Emergency Alert
              </Text>
            </View>

            <Text className="text-gray-600 text-center mb-6 font-sans leading-relaxed">
              Your location and medical information will be shared with emergency responders immediately. Are you sure you want to proceed?
            </Text>

            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                onPress={() => setShowSOSModal(false)}
                className="flex-1 bg-gray-100 rounded-xl py-4 mr-2"
                activeOpacity={0.7}
              >
                <Text className="text-center text-gray-700 font-sans-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSOS}
                disabled={sendingSOS}
                className="flex-1 rounded-xl py-4 ml-2"
                style={{ backgroundColor: sendingSOS ? '#FCA5A5' : '#EF4444' }}
                activeOpacity={0.8}
              >
                {sendingSOS ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-center text-white font-sans-bold text-base">
                    Send SOS
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Home