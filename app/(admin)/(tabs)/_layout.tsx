import { Tabs } from "expo-router";

export default function AdminTabLayout() {
    return (
        <Tabs 
            screenOptions={{
                headerShown: false
            }}
        >
            <Tabs.Screen name="home" />
        </Tabs>
    )
}