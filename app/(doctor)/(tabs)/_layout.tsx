import { Tabs } from "expo-router";

export default function RootLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="home" options={{ title: 'Welcome', headerShown: false }} />
        </Tabs>
    );
}
