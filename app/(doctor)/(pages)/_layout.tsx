import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name='prescriptions' />
            <Stack.Screen name="appointment/[id]" />
            <Stack.Screen name="patient/[id]" />
            <Stack.Screen name="bank-account" />
            <Stack.Screen name="profile-settings" />
            <Stack.Screen name="security" />
            <Stack.Screen name="schedule-availability" />
        </Stack>
    );
}
