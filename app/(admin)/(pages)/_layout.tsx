import { Stack } from "expo-router";

export default function adminPagesLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
           <Stack.Screen name="doctor/[id]" />
           <Stack.Screen name="patient/[id]" />
           <Stack.Screen name='appointment/[id]' />
           <Stack.Screen name='analytics' />
        </Stack>
    )
}