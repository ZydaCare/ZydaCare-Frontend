import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name='prescriptions' />
            <Stack.Screen name="appointment/[id]" />
            <Stack.Screen name="patient/[id]" />
        </Stack>
    );
}
