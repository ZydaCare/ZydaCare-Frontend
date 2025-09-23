import { Text, View, Image, TouchableOpacity } from "react-native";
import { Images } from "../assets/Images";
import Button from "@/components/ui/Button";
import { useRouter } from "expo-router";

export default function App() {
    const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Image source={Images.LogoIcon} className="w-[200px] h-[200px] mt-[-40%]" />
      <View className="bg-[#D9D9D9] w-[250px] h-[200px] rounded-[10px] mt-[20%]"></View>

      <Button
        variant="secondary"
        size="lg"
        radius="full"
        onPress={() => router.push("/(auth)/login")}
        className="absolute bottom-6 w-full"
        textClassName="text-[16px] text-[#fff] font-sans font-semibold"
      >
        Get Started
      </Button>
    </View>
  );
}