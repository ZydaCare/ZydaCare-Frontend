import { Stack } from "expo-router";
import { useAuth } from "@/context/authContext";
import CompleteDoctorProfile from "@/components/CompleteDoctorProfile";
import MandatoryBankDetails from "@/components/MandatoryBankDetails";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const { 
    isDoctorProfileComplete, 
    doctorProfile, 
    isDoctor 
  } = useAuth();

  // For doctors, check profile completion and bank verification
  if (isDoctor) {
    // Show profile completion if not complete
    if (!isDoctorProfileComplete) {
      return <CompleteDoctorProfile />;
    }

    // Show bank details if not verified
    if (!doctorProfile?.bankVerified) {
      return <MandatoryBankDetails />;
    }
  }

  // Show main app
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ title: 'Doctor Tabs', headerShown: false }} />
      <Stack.Screen name="(pages)" options={{ title: 'Doctor Pages', headerShown: false }} />
    </Stack>
  );
}
