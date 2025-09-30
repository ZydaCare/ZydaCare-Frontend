import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Image,
  ActivityIndicator
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/authContext'
import { router } from 'expo-router'

const Profile = () => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)
  const { logout, user, isLoading, getMe } = useAuth()

  const [loadingProfile, setLoadingProfile] = useState(false)

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

  const menuItems = [
    { icon: 'person-outline', title: 'Security Settings', chevron: true, action: () => router.push('/(patient)/(pages)/security') },
    { icon: 'card-outline', title: 'Payment Method', chevron: true },
    { icon: 'moon-outline', title: 'Theme Settings', chevron: true },
    { icon: 'time-outline', title: 'Medical History', chevron: true },
    { icon: 'people-outline', title: 'Family Doctors', chevron: true },
    { icon: 'help-circle-outline', title: 'Help and Support', chevron: true },
    { icon: 'help-outline', title: 'Faq', chevron: true },
    {
      icon: 'log-out-outline',
      title: 'Log out',
      chevron: false,
      action: () => setLogoutModalVisible(true),
    },
  ]

  const handleLogout = () => {
    setLogoutModalVisible(false)
    logout()
  }

  if (isLoading || loadingProfile) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }
  
  if (!user) {
    return <Text>No user found</Text>;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View className="p-4 flex-row items-center">
        {/* <TouchableOpacity onPress={() => router.back()} className="bg-white rounded-full p-2 shadow-sm">
          <Ionicons name="chevron-back" size={20} color="#374151" />
        </TouchableOpacity> */}
        <Text className="text-xl flex-1 text-center mr-8 font-sans-semibold">My Profile</Text>
      </View>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* User Profile Section */}
        <View className="bg-white mx-4 mt-6 rounded-2xl px-5 py-6">
          <TouchableOpacity onPress={() => router.push('/(patient)/(pages)/profile')} className="flex-row items-center justify-between">
            <View className="flex-row items-center">
                <Image
                  source={{ uri: user.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'U')}&background=67A9AF&color=fff` }}
                  className="w-14 h-14 rounded-full"
                />
              {/* ) : (
                <View className="w-14 h-14 bg-primary rounded-full items-center justify-center">
                  <Text className="text-lg text-white font-sans-bold">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </Text>
                </View>
              )} */}
              <View className="ml-4 flex-1">
                <Text className="text-lg font-semibold font-sans text-gray-900">
                  {user ? `${user.firstName} ${user.lastName}` : "Guest"}
                </Text>
                <Text className="text-sm text-gray-500 mt-1 font-sans-medium">
                  {user?.email || "example@email.com"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View className="bg-white mx-4 mt-8 rounded-2xl">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center justify-between px-5 py-3 ${
                index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
              }`}
              onPress={item.action}
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-[#F8F8F8] rounded-full items-center justify-center">
                  <Ionicons name={item.icon} size={22} color="#374151" />
                </View>
                <Text className="text-base text-gray-900 ml-4 font-sans-medium">
                  {item.title}
                </Text>
              </View>
              {item.chevron && (
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        transparent={true}
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center">
          <View className="bg-white w-80 rounded-2xl p-6">
            <Text className="text-lg text-gray-900 mb-3 font-sans-semibold">
              Log Out
            </Text>
            <Text className="text-gray-600 mb-6 font-sans-medium">
              Are you sure you want to log out?
            </Text>
            <View className="flex-row justify-end gap-4">
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-sans">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                className="px-4 py-2 rounded-lg bg-[#ff6b35]"
              >
                <Text className="text-white font-sans">Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Profile
