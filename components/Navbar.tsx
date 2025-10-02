import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { useAuth } from '@/context/authContext'
import { User } from '@/types/User';
import { router } from 'expo-router';

export default function Navbar() {
    const { user, getMe } = useAuth();
    const [profile, setProfile] = useState<User | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false)

    useEffect(() => {
            const fetchProfile = async () => {
                if (!user) {
                    setLoadingProfile(true);
                    try {
                        await getMe();
                    } finally {
                        setLoadingProfile(false);
                    }
                } else {
                    setLoadingProfile(false);
                    setProfile(user as unknown as User);
                }
            };
            fetchProfile();
        }, [user, getMe]);

        const fullName = `${profile?.firstName} ${profile?.lastName}`.trim();

    return (
        <View className='flex-row items-center justify-between px-4 py-3 bg-white shadow-lg'>
            <TouchableOpacity>
                <Ionicons name="menu" size={24} color="black" />
            </TouchableOpacity>

            <View className='flex-row items-center gap-4'>
                <TouchableOpacity onPress={() => router.push('/(patient)/(pages)/profile')}>
                    <Image source={{ uri: profile?.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'U')}&background=67A9AF&color=fff&font-family=Inter-Regular` }} className='w-10 h-10 rounded-full' />
                </TouchableOpacity>
                <TouchableOpacity>
                    <View className='bg-white rounded-full p-1 z-10 w-10 h-10 items-center justify-center' style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}>
                        <FontAwesome5 name="bell" size={20} color="#D65C1E" />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    )
}