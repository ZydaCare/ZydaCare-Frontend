import { View, Image, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Button from '@/components/ui/Button';
import { Images } from '@/assets/Images';
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View className="pt-20 px-6 pb-10 items-center">
          <View
            className="w-[110px] h-[110px] rounded-[28px] bg-[#67A9AF] items-center justify-center mb-8 shadow-lg shadow-[#67A9AF]/40"
          >
            <Image
              source={Images.LogoIcon}
              className="w-[100px] h-[100px]"
              resizeMode="contain"
            />
          </View>

          <Text className="text-[38px] leading-[46px] text-gray-900 text-center mb-4 font-sans-semibold">
            Your Health,{'\n'}Our Priority
          </Text>
          <Text className="text-[17px] text-gray-500 text-center leading-[26px] px-5 font-sans">
            Experience seamless healthcare management with ZydaCare
          </Text>
        </View>

        {/* Info Cards */}
        <View className="px-6">
          <View className="flex-row items-center bg-primary/10 border border-[#67A9AF] p-5 rounded-[20px] mb-6">
            <View className="w-[56px] h-[56px] rounded-[16px] bg-primary/20 items-center justify-center mr-4">
              <Ionicons name="people" size={28} color="#67A9AF" />
            </View>
            <View className="flex-1">
              <Text className="text-[17px] text-gray-900 mb-1 font-sans-semibold">
                Expert Doctors
              </Text>
              <Text className="text-[14px] text-gray-500 leading-[20px] font-sans">
                Connect with qualified professionals
              </Text>
            </View>
          </View>

          <View className="flex-row items-center bg-primary/10 border border-[#67A9AF] p-5 rounded-[20px] mb-6">
            <View className="w-[56px] h-[56px] rounded-[16px] bg-primary/20 items-center justify-center mr-4">
              <Ionicons name="calendar-sharp" size={28} color="#67A9AF" />
            </View>
            <View className="flex-1">
              <Text className="text-[17px] text-gray-900 mb-1 font-sans-semibold">
                Easy Scheduling
              </Text>
              <Text className="text-[14px] text-gray-500 leading-[20px] font-sans">
                Book appointments in seconds
              </Text>
            </View>
          </View>

          <View className="flex-row items-center bg-primary/10 border border-[#67A9AF] p-5 rounded-[20px] mb-4">
            <View className="w-[56px] h-[56px] rounded-[16px] bg-primary/20 items-center justify-center mr-4">
              <Ionicons name="shield-checkmark" size={28} color="#67A9AF" />
            </View>
            <View className="flex-1">
              <Text className="text-[17px] text-gray-900 mb-1 font-sans-semibold">
                Secure & Private
              </Text>
              <Text className="text-[14px] text-gray-500 leading-[20px] font-sans">
                Your health data is protected
              </Text>
            </View>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>

      {/* Bottom Section */}
      <View className="px-6 pt-5 pb-8 bg-white border-t border-gray-100">
        <Button
          variant="secondary"
          size="lg"
          radius="full"
          onPress={() => router.push("/(auth)/signup")}
          className="w-full mb-4"
          textClassName="text-base font-sans-semibold"
        >
          Get Started
        </Button>

        <View className="flex-row justify-center items-center">
          <Text className="text-[14px] text-gray-500 font-sans">
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text className="text-[14px] text-[#67A9AF] font-sans-semibold">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
