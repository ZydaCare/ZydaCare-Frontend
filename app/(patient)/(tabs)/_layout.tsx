import { router, Tabs } from "expo-router";
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
                tabBarActiveTintColor: '#ff6b35',
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
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <View style={{
                                width: 50,
                                height: 50,
                                backgroundColor: focused ? '#67A9AF' : 'transparent',
                                borderRadius: 15,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 2,
                                shadowColor: focused ? '#67A9AF' : 'transparent',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: focused ? 8 : 0,
                            }}>
                                <Ionicons
                                    name={focused ? "home" : "home-outline"}
                                    size={24}
                                    color={focused ? 'white' : color}
                                />
                            </View>
                            {focused && (
                                <View style={{
                                    width: 6,
                                    height: 6,
                                    backgroundColor: '#67A9AF',
                                    borderRadius: 3,
                                    marginTop: 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="appointment"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <View style={{
                                width: 50,
                                height: 50,
                                backgroundColor: focused ? '#67A9AF' : 'transparent',
                                borderRadius: 15,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 2,
                                shadowColor: focused ? '#67A9AF' : 'transparent',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: focused ? 8 : 0,
                            }}>
                                <Ionicons
                                    name={focused ? "calendar" : "calendar-outline"}
                                    size={24}
                                    color={focused ? 'white' : color}
                                />
                            </View>
                            {focused && (
                                <View style={{
                                    width: 6,
                                    height: 6,
                                    backgroundColor: '#67A9AF',
                                    borderRadius: 3,
                                    marginTop: 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="health"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <View style={{
                                width: focused ? 55 : 50,
                                height: focused ? 55 : 50,
                                backgroundColor: focused ? '#67A9AF' : 'transparent',
                                borderRadius: focused ? 30 : 15,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 2,
                                shadowColor: focused ? '#67A9AF' : 'transparent',
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.4,
                                shadowRadius: 12,
                                elevation: focused ? 12 : 0,
                                marginTop: focused ? -10 : 0,
                            }}>
                                <Ionicons
                                    name={focused ? "heart" : "heart-outline"}
                                    size={focused ? 28 : 24}
                                    color={focused ? 'white' : color}
                                />
                            </View>
                            {focused && (
                                <View style={{
                                    width: 8,
                                    height: 8,
                                    backgroundColor: '#67A9AF',
                                    borderRadius: 4,
                                    marginTop: focused ? 6 : 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="support"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <View style={{
                                width: 50,
                                height: 50,
                                backgroundColor: focused ? '#67A9AF' : 'transparent',
                                borderRadius: 15,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 2,
                                shadowColor: focused ? '#67A9AF' : 'transparent',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: focused ? 8 : 0,
                            }}>
                                <Ionicons
                                    name={focused ? "chatbubble" : "chatbubble-outline"}
                                    size={24}
                                    color={focused ? 'white' : color}
                                />
                            </View>
                            {focused && (
                                <View style={{
                                    width: 6,
                                    height: 6,
                                    backgroundColor: '#67A9AF',
                                    borderRadius: 3,
                                    marginTop: 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <View style={{
                                width: 50,
                                height: 50,
                                backgroundColor: focused ? '#67A9AF' : 'transparent',
                                borderRadius: 15,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 2,
                                shadowColor: focused ? '#67A9AF' : 'transparent',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: focused ? 8 : 0,
                            }}>
                                <Ionicons
                                    name={focused ? "person" : "person-outline"}
                                    size={24}
                                    color={focused ? 'white' : color}
                                />
                            </View>
                            {focused && (
                                <View style={{
                                    width: 6,
                                    height: 6,
                                    backgroundColor: '#67A9AF',
                                    borderRadius: 3,
                                    marginTop: 2,
                                }} />
                            )}
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}