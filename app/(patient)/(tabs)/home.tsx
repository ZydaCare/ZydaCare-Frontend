import { View, Text, StatusBar, TextInput, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Navbar from '@/components/Navbar'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'

const categories = [
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
  { id: 16, name: 'Pediatrician', icon: 'happy-outline' },
  { id: 17, name: 'Pulmonologist', icon: 'pulse-outline' },
  { id: 18, name: 'Radiologist', icon: 'radio-outline' },
  { id: 19, name: 'Oncologist', icon: 'flame-outline' },
  { id: 20, name: 'Nephrologist', icon: 'water-outline' },
]

const Home = () => {
  const [homeSearch, setHomeSearch] = useState('')

  const handleSearch = () => {
    if (homeSearch.trim() !== '') {
      router.push({
        pathname: '/search',
        params: { query: homeSearch }, // ✅ pass query to search screen
      })
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Navbar />

      <ScrollView showsVerticalScrollIndicator={false}>
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
                  className="bg-white rounded-full px-3 py-3 mr-3 flex-row items-center border border-gray-200"
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
                  className="bg-white rounded-full px-3 py-3 mr-3 flex-row items-center border border-gray-200"
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
      </ScrollView>
    </SafeAreaView>
  )
}

export default Home
