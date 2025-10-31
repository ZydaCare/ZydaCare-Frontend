import { Stack } from "expo-router";

export default function adminPagesLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
           <Stack.Screen name="doctor/[id]" />
           <Stack.Screen name="patient/[id]" />
           <Stack.Screen name='appointment/[id]' />
           <Stack.Screen name='analytics' />
           <Stack.Screen name='payments' />
           <Stack.Screen name='transactions/[id]' />
           <Stack.Screen name='faqs' />
           <Stack.Screen name='faqs/index' />
           <Stack.Screen name='faqs/[id]' />
           <Stack.Screen name='faqs/create' />
           <Stack.Screen name='settings/index' />
           <Stack.Screen name='notifications/index' />
           <Stack.Screen name='notifications/[id]' />
           <Stack.Screen name='notifications/new' />
        </Stack>
    )
}