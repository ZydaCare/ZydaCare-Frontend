import { AuthProvider } from "@/context/authContext";
import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <AuthProvider>
            <Stack>
                <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
                <Stack.Screen name="signup" options={{ title: 'Sign Up', headerShown: false }} />
                <Stack.Screen name="forgotPassword" options={{ title: 'Forgot Password', headerShown: false }} />
                <Stack.Screen name="otp" options={{ title: 'OTP', headerShown: false }} />
                <Stack.Screen name="newPassword" options={{ title: 'New Password', headerShown: false }} />
            </Stack>
        </AuthProvider>
    );
}
