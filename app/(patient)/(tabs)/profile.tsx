import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal
} from 'react-native'
import React, { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/context/authContext'

const Profile = () => {
  const [logoutModalVisible, setLogoutModalVisible] = useState(false)
  const { logout } = useAuth()  // ✅ pull user from context

  const menuItems: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    chevron: boolean;
    action?: () => void;
  }> = [
    { icon: 'person-outline', title: 'Profile Settings', chevron: true },
    { icon: 'card-outline', title: 'Payment Method', chevron: true },
    { icon: 'moon-outline', title: 'Dark Mode', chevron: true },
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="text-[20px] font-sans-bold text-gray-900">Profile</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View className="bg-white mx-4 mt-6 rounded-2xl px-5 py-6">
          <TouchableOpacity className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-14 h-14 bg-gray-300 rounded-full items-center justify-center">
                <Ionicons name="person" size={28} color="#9ca3af" />
              </View>
              <View className="ml-4">
                <Text className="text-lg font-semibold text-gray-900">
                  Jephthah Ndukwe
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  jephthahndukwe@gmail.com
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
                <Text className="text-base text-gray-900 ml-4 font-medium">
                  {item.title}
                </Text>
              </View>
              {item.chevron && (
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom padding for tab bar */}
        <View className="h-24" />
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        transparent={true}
        visible={logoutModalVisible}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center">
          <View className="bg-white w-80 rounded-2xl p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">
              Log Out
            </Text>
            <Text className="text-gray-600 mb-6">
              Are you sure you want to log out?
            </Text>
            <View className="flex-row justify-end gap-4">
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleLogout}
                className="px-4 py-2 rounded-lg bg-[#ff6b35]"
              >
                <Text className="text-white font-medium">Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

export default Profile
