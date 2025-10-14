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
                name="home" 
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
            <Tabs.Screen 
                name="patients" 
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className="items-center justify-center">
                            <View className={`${focused ? 'w-[55px] h-[55px] -mt-2.5' : 'w-[50px] h-[50px]'} ${focused ? 'bg-[#67A9AF]' : 'bg-transparent'} ${focused ? 'rounded-full' : 'rounded-2xl'} items-center justify-center mb-0.5`}
                                style={{
                                    shadowColor: focused ? '#67A9AF' : 'transparent',
                                    shadowOffset: { width: 0, height: 6 },
                                    shadowOpacity: 0.4,
                                    shadowRadius: 12,
                                    elevation: focused ? 12 : 0,
                                }}
                            >
                                <Ionicons 
                                    name={focused ? "people" : "people-outline"} 
                                    size={focused ? 28 : 24} 
                                    color={focused ? 'white' : color} 
                                />
                            </View>
                            {focused && (
                                <View className="w-2 h-2 bg-[#67A9AF] rounded-full mt-1.5" />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen 
                name="earnings" 
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className="items-center justify-center">
                            <View className={`w-[50px] h-[50px] ${focused ? 'bg-[#67A9AF]' : 'bg-transparent'} rounded-2xl items-center justify-center mb-0.5 ${focused ? 'shadow-lg shadow-[#67A9AF]/30' : ''}`}
                                style={{
                                    elevation: focused ? 8 : 0,
                                }}
                            >
                                <Ionicons 
                                    name={focused ? "cash" : "cash-outline"} 
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
                name="profile" 
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View className="items-center justify-center">
                            <View className={`w-[50px] h-[50px] ${focused ? 'bg-[#67A9AF]' : 'bg-transparent'} rounded-2xl items-center justify-center mb-0.5 ${focused ? 'shadow-lg shadow-[#67A9AF]/30' : ''}`}
                                style={{
                                    elevation: focused ? 8 : 0,
                                }}
                            >
                                <Ionicons 
                                    name={focused ? "person" : "person-outline"} 
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