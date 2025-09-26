import { View, Text, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import { Images } from '@/assets/Images'

export default function Navbar() {
    return (
        <View className='flex-row items-center justify-between px-4 py-3 bg-white shadow-lg'>
            <TouchableOpacity>
                <Ionicons name="menu" size={24} color="black" />
            </TouchableOpacity>

            <View className='flex-row items-center gap-4'>
                <TouchableOpacity>
                    <Image source={Images.doctor} className='w-10 h-10 rounded-full' />
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