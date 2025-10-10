import { Stack } from "expo-router";

export default function PatientRootLayout() {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ title: 'Patient Tabs', headerShown: false }} />
            <Stack.Screen name="(pages)" options={{ title: 'Patient Pages', headerShown: false }} />
        </Stack>
    );
}