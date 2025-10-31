import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, TouchableOpacity, View, Text, Image, Animated, Pressable } from 'react-native';
import { useEffect, useRef } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface MenuItem {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    route?: string;
    action?: () => void;
    color?: string;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user, logout } = useAuth();
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        if (isOpen) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 65,
                friction: 11,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [isOpen]);

    const menuItems: MenuItem[] = [
        {
            icon: 'help-circle',
            label: 'FAQs',
            route: '/(admin)/(pages)/faqs',
        },
        {
            icon: 'notifications',
            label: 'Notifications',
            route: '/(admin)/(pages)/notifications',
        },
        {
            icon: 'settings',
            label: 'Settings',
            route: '/(admin)/(pages)/settings',
        },
    ];

    const handleMenuPress = (item: MenuItem) => {
        if (item.action) {
            item.action();
        } else if (item.route) {
            router.push(item.route as any);
        }
        onClose();
    };

    const handleLogout = async () => {
        try {
            await logout();
            onClose();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View className="flex-1 flex-row">
                {/* Overlay */}
                <Pressable
                    onPress={onClose}
                    className="flex-1 bg-black/50"
                />

                {/* Sidebar */}
                <Animated.View
                    style={{ transform: [{ translateX: slideAnim }] }}
                    className="w-[280px] h-full bg-white shadow-2xl"
                >
                    {/* Header */}
                    <View className="bg-[#67A9AF] pt-14 pb-6 px-6">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-white text-xl font-sans-medium">Menu</Text>
                            <TouchableOpacity
                                onPress={onClose}
                                className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* User Profile */}
                        <View className="flex-row items-center mt-2">
                            <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mr-3">
                                {user?.profileImage.url ? (
                                    <Image
                                        source={{ uri: user.profileImage.url }}
                                        className="w-full h-full rounded-full"
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Ionicons name="person" size={32} color="#FFFFFF" />
                                )}
                            </View>
                            <View className="flex-1">
                                <Text className="text-white text-lg font-sans-medium" numberOfLines={1}>
                                    {user?.firstName} {user?.lastName}
                                </Text>
                                <Text className="text-white/80 text-sm font-sans" numberOfLines={1}>
                                    {user?.email}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Menu Items */}
                    <View className="flex-1 py-4">
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleMenuPress(item)}
                                className="flex-row items-center px-6 py-4 active:bg-gray-50"
                                activeOpacity={0.7}
                            >
                                <View className="w-10 h-10 rounded-full bg-[#F0F9FA] items-center justify-center mr-4">
                                    <Ionicons
                                        name={item.icon}
                                        size={20}
                                        color={item.color || '#67A9AF'}
                                    />
                                </View>
                                <Text className="text-gray-800 text-base font-sans-medium flex-1">
                                    {item.label}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                        ))}

                        {/* Divider */}
                        <View className="h-[1px] bg-gray-200 mx-6 my-4" />

                        {/* Logout */}
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="flex-row items-center px-6 py-4 active:bg-red-50"
                            activeOpacity={0.7}
                        >
                            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
                                <Ionicons name="log-out" size={20} color="#DC2626" />
                            </View>
                            <Text className="text-red-600 text-base font-sans-medium flex-1">
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View className="px-6 py-4 border-t border-gray-200">
                        <Text className="text-gray-500 text-xs font-sans text-center">
                            ZydaCare Support Dashboard
                        </Text>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}