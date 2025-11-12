import { Stack } from "expo-router";

export default function PatientPageLayout() {
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
            <Stack.Screen name="support" options={{ headerShown: false }} />
            <Stack.Screen name="apply-doctor" options={{ headerShown: false }} />
            <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="appointment/book" options={{ headerShown: false }} />
            <Stack.Screen name="appointment/pay" options={{ headerShown: false }} />
            <Stack.Screen name="appointment/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="appointment/pay-success" options={{ headerShown: false }} />
            <Stack.Screen name="faq/index" options={{ headerShown: false }} />
            <Stack.Screen name="faq/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="medical-history/records" options={{ headerShown: false }} />
            <Stack.Screen name="medical-history/add" options={{ headerShown: false }} />
            <Stack.Screen name="medical-history/edit/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="health-profile/healthProfile" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="insurance/link" options={{ headerShown: false }} />
            <Stack.Screen name="insurance/details" options={{ headerShown: false }} />
            <Stack.Screen name="insurance/claims" options={{ headerShown: false }} />
        </Stack>
    );
}
