import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export default function RootLayout() {
    return (
        <Tabs 
            screenOptions={{ 
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#f8fafc',
                    borderTopWidth: 0,
                    elevation: 20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 15,
                    height: 70,
                    paddingBottom: 20,
                    paddingTop: 10,
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    position: 'absolute',
                },
                tabBarActiveTintColor: '#67A9AF',
                tabBarInactiveTintColor: '#64748b',
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    paddingTop: 8,
                },
            }}
        >
            <Tabs.Screen 
                name="dashboard" 
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className="items-center justify-center">
                            <View className={`w-[50px] h-[50px] ${focused ? 'bg-[#67A9AF]' : 'bg-transparent'} rounded-2xl items-center justify-center mb-0.5 ${focused ? 'shadow-lg shadow-[#67A9AF]/30' : ''}`}
                                style={{
                                    elevation: focused ? 8 : 0,
                                }}
                            >
                                <Ionicons 
                                    name={focused ? "home" : "home-outline"} 
                                    size={24} 
                                    color={focused ? 'white' : color} 
                                />
                            </View>
                            {focused && (
                                <View className="w-1.5 h-1.5 bg-[#67A9AF] rounded-full mt-0.5" />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen 
                name="patients" 
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className="items-center justify-center">
                            <View className={`w-[50px] h-[50px] ${focused ? 'bg-[#67A9AF]' : 'bg-transparent'} rounded-2xl items-center justify-center mb-0.5 ${focused ? 'shadow-lg shadow-[#67A9AF]/30' : ''}`}
                                style={{
                                    elevation: focused ? 8 : 0,
                                }}
                            >
                                <Ionicons 
                                    name={focused ? "people" : "people-outline"} 
                                    size={24} 
                                    color={focused ? 'white' : color} 
                                />
                            </View>
                            {focused && (
                                <View className="w-1.5 h-1.5 bg-[#67A9AF] rounded-full mt-0.5" />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen 
                name="doctors" 
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className="items-center justify-center">
                            <View className={`w-[50px] h-[50px] ${focused ? 'bg-[#67A9AF]' : 'bg-transparent'} rounded-2xl items-center justify-center mb-0.5 ${focused ? 'shadow-lg shadow-[#67A9AF]/30' : ''}`}
                                style={{
                                    elevation: focused ? 8 : 0,
                                }}
                            >
                                <Ionicons 
                                    name={focused ? "people" : "people-outline"} 
                                    size={24} 
                                    color={focused ? 'white' : color} 
                                />
                            </View>
                            {focused && (
                                <View className="w-1.5 h-1.5 bg-[#67A9AF] rounded-full mt-0.5" />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen 
                name="appointments" 
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className="items-center justify-center">
                            <View className={`w-[50px] h-[50px] ${focused ? 'bg-[#67A9AF]' : 'bg-transparent'} rounded-2xl items-center justify-center mb-0.5 ${focused ? 'shadow-lg shadow-[#67A9AF]/30' : ''}`}
                                style={{
                                    elevation: focused ? 8 : 0,
                                }}
                            >
                                <Ionicons 
                                    name={focused ? "calendar" : "calendar-outline"} 
                                    size={24} 
                                    color={focused ? 'white' : color} 
                                />
                            </View>
                            {focused && (
                                <View className="w-1.5 h-1.5 bg-[#67A9AF] rounded-full mt-0.5" />
                            )}
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}