import { Stack } from "expo-router";

export default function Layout() {
    return (
        <Stack>
            <Stack.Screen name="search" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="security" options={{ headerShown: false }} />
            <Stack.Screen name="edit-birthday" options={{ headerShown: false }} />
            <Stack.Screen name="edit-phone" options={{ headerShown: false }} />
            <Stack.Screen name="edit-country" options={{ headerShown: false }} />
            <Stack.Screen name="kyc-verification" options={{ headerShown: false }} />
            <Stack.Screen name="change-password" options={{ headerShown: false }} />
            <Stack.Screen name="supportChat" options={{ headerShown: false }} />
            <Stack.Screen name="help" options={{ headerShown: false }} />
        </Stack>
    );
}
