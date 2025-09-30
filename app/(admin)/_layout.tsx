import { Stack } from "expo-router";

export default function adminLayout() {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ title: 'Admin Tabs', headerShown: false }} />
            <Stack.Screen name="(pages)" options={{ title: 'Admin Pages', headerShown: false }} />
        </Stack>
    )
}