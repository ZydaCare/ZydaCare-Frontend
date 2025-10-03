import Navbar from '@/components/Navbar'
import Button from '@/components/ui/Button'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { View, Text, StatusBar, TextInput, ScrollView, TouchableOpacity, Image as RNImage, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// Define the type for category items
interface CategoryItem {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const categories: CategoryItem[] = [
  { id: 1, name: 'General Doctor', icon: 'medkit-outline' },
  { id: 2, name: 'Dentist', icon: 'bandage-outline' },
  { id: 3, name: 'Child Care', icon: 'happy-outline' },
  { id: 4, name: 'Care Giver', icon: 'person-add-outline' },
  { id: 5, name: 'Psychiatrist', icon: 'people-outline' },
  { id: 6, name: 'Cardiologist', icon: 'heart-outline' },
  { id: 7, name: 'Ophthalmologist', icon: 'eye-outline' },
  { id: 8, name: 'Dermatologist', icon: 'sparkles-outline' },
  { id: 9, name: 'Neurologist', icon: 'fitness-outline' },
  { id: 10, name: 'Orthopedic', icon: 'body-outline' },
  { id: 11, name: 'ENT Specialist', icon: 'ear-outline' },
  { id: 12, name: 'Gynecologist', icon: 'woman-outline' },
  { id: 13, name: 'Urologist', icon: 'male-female-outline' },
  { id: 14, name: 'Nutritionist', icon: 'restaurant-outline' },
  { id: 15, name: 'Psychologist', icon: 'happy-outline' },
  { id: 16, name: 'Pediatrician', icon: 'medkit-outline' },
  { id: 17, name: 'Pulmonologist', icon: 'pulse-outline' },
  { id: 18, name: 'Radiologist', icon: 'radio-outline' },
  { id: 19, name: 'Oncologist', icon: 'flame-outline' },
  { id: 20, name: 'Nephrologist', icon: 'water-outline' },
]

const Home = () => {
  const [homeSearch, setHomeSearch] = useState('')

  // Mock data for upcoming appointment (replace with actual data from your state/API)
  const [upcomingAppointment, setUpcomingAppointment] = useState<{
    id: number;
    doctorName: string;
    speciality: string;
    date: string;
    timeRemaining: string;
    image: string;
  } | null>({
    id: 1,
    doctorName: 'Dr. Sarah Johnson',
    speciality: 'Cardiologist',
    date: 'Today, 2:30 PM',
    timeRemaining: 'in 2 hours',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face'
  });

  // const [upcomingAppointment, setUpcomingAppointment] = useState(null);

  const handleSearch = () => {
    if (homeSearch.trim() !== '') {
      router.push({
        pathname: '/search',
        params: { query: homeSearch }, // ✅ pass query to search screen
      })
    }
  }

  // Calculate screen width for responsive design
  const { width } = Dimensions.get('window');
  const cardWidth = (width - 48) / 2 - 8; // 48 = padding * 2, 8 = gap

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Navbar />

      <ScrollView showsVerticalScrollIndicator={false} className="pb-20">
        {/* Search Bar */}
        <View className="py-4 px-4 mt-3">
          <View className="flex-row items-center justify-between w-full h-14 px-3 bg-white rounded-full border border-gray-200">
            <TextInput
              className="flex-1 ml-2 font-sans text-gray-800"
              placeholder="Search doctors, specialists, hospitals....."
              placeholderTextColor="#B4B4B4"
              value={homeSearch}
              onChangeText={setHomeSearch}
              onSubmitEditing={handleSearch} // press Enter
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch}>
              <Ionicons name="search" size={20} color="#D65C1E" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories header */}
        {/* <View className="mt-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-sans-semibold text-gray-800">Categories</Text>
            <Text className="text-sm font-normal font-sans text-primary">view more</Text>
          </View>
        </View> */}

        {/* Horizontal 2-row pill slider */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}

          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          <View className="flex-col">
            {/* First row */}
            <View className="flex-row mb-3">
              {categories.slice(0, 10).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  className="bg-white rounded-full px-3 py-2 mr-3 flex-row items-center border border-gray-200"
                  style={{ minWidth: 160 }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: '#67A9AF' }}
                  >
                    <Ionicons name={item.icon} size={20} color="#fff" />
                  </View>
                  <Text className="text-gray-800 font-medium font-sans">{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Second row */}
            <View className="flex-row">
              {categories.slice(10, 20).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  className="bg-white rounded-full px-3 py-2 mr-3 flex-row items-center border border-gray-200"
                  style={{ minWidth: 160 }}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: '#67A9AF' }}
                  >
                    <Ionicons name={item.icon} size={20} color="#fff" />
                  </View>
                  <Text className="text-gray-800 font-medium font-sans">{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Doctor Application Prompt */}
        <View className="mx-4 mt-4 bg-white rounded-xl px-5 py-6 shadow-sm border border-gray-100">
          <View className="flex-row items-start">
            {/* Icon */}
            <View className="bg-primary/10 p-3 rounded-lg mr-4">
              <MaterialIcons name="medical-services" size={26} color="#67A9AF" />
            </View>

            {/* Content */}
            <View className="flex-1">
              <Text className="font-sans-semibold text-gray-800 text-base">
                Become a Doctor on ZydaCare
              </Text>

              <Text className="font-sans text-gray-600 text-sm mt-2 leading-relaxed">
                Start your medical practice and help patients online
              </Text>

              <View className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<MaterialIcons name="medical-services" size={20} color="#67A9AF" />}
                  onPress={() => router.push('/(patient)/(pages)/apply-doctor')}
                  textClassName="font-sans-semibold text-md"
                  className="border-primary"
                >
                  Apply Now
                </Button>
              </View>
            </View>
          </View>
        </View>


        {/* Quick Actions Section */}
        <View className="px-4 mt-6">
          <Text className="text-lg font-sans-semibold text-gray-800 mb-3">Quick Actions</Text>
          <View className="flex-row flex-wrap justify-between">
            {[
              { id: 1, title: 'Book Appointment', icon: 'calendar-outline' as const, color: '#67A9AF', route: '/(patient)/(tabs)/appointment' as const },
              { id: 2, title: 'Find Doctor', icon: 'search-outline' as const, color: '#D65C1E', route: '/(patient)/(pages)/search' as const },
              { id: 3, title: 'Health Check', icon: 'medkit-outline' as const, color: '#4CAF50', route: '/(patient)/(tabs)/health' as const },
              { id: 4, title: 'Lab Tests', icon: 'flask-outline' as const, color: '#9C27B0', route: '/(patient)/(pages)/lab-tests' as const },
            ].map((item) => ( 
              <TouchableOpacity
                key={item.id}
                className="w-[48%] bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 items-center"
                onPress={() => {
                  router.push(item.route);
                }}
              >
                <View className="w-12 h-12 rounded-full items-center justify-center mb-2" style={{ backgroundColor: `${item.color}15` }}>
                  <Ionicons name={item.icon} size={24} color={item.color} />
                </View>
                <Text className="font-sans-medium text-gray-800 text-center">{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Appointment Section */}
        {upcomingAppointment && (
          <View className="mx-4 mt-6">
            <Text className="text-lg font-sans-semibold text-gray-800 mb-3">Upcoming Appointment</Text>
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  <RNImage
                    source={{ uri: upcomingAppointment?.image }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <View>
                    <Text className="font-sans-semibold text-gray-800">{upcomingAppointment?.doctorName}</Text>
                    <Text className="font-sans text-gray-600 text-sm">{upcomingAppointment?.speciality}</Text>
                  </View>
                </View>
                <View className="bg-primary/10 px-3 py-1 rounded-full">
                  <Text className="text-primary font-sans-medium text-xs">{upcomingAppointment?.timeRemaining}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={18} color="#67A9AF" />
                  <Text className="font-sans text-gray-700 ml-2">{upcomingAppointment?.date}</Text>
                </View>
                <TouchableOpacity
                  className="bg-primary px-4 py-2 rounded-full"
                  onPress={() => router.push({
                    pathname: '/(patient)/(tabs)/appointment',
                    params: { id: upcomingAppointment?.id }
                  })}
                >
                  <Text className="text-white font-sans-medium text-sm">View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Health Tips Section */}
        <View className="px-4 mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-sans-semibold text-gray-800">Health Tips</Text>
            <Text className="text-sm font-sans text-primary">See All</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {[1, 2, 3].map((item) => (
              <View key={item} className="w-64 bg-white rounded-xl p-4 mr-3 shadow-sm border border-gray-100">
                <View className="w-full h-32 bg-gray-200 rounded-lg mb-3" />
                <Text className="font-sans-semibold text-gray-800 mb-1">Stay Hydrated Daily</Text>
                <Text className="font-sans text-gray-600 text-xs" numberOfLines={2}>
                  Drinking enough water is essential for your body to function properly.
                </Text>
              </View>
            ))}
          </ScrollView>

          <View className="h-28" />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Home
