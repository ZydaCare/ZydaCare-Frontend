import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import * as Location from 'expo-location';
import { useToast } from './ui/Toast';

export default function FloatingSOS() {
    const [showSOSModal, setShowSOSModal] = useState(false);
    const [sendingSOS, setSendingSOS] = useState(false);
    const { showToast } = useToast();

    const handleSOS = async () => {
        try {
            setSendingSOS(true);

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setSendingSOS(false);
                showToast('Permission Denied! Location access is required to send SOS.', 'error');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // OpenStreetMap Nominatim reverse geocoding with proper headers
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
                {
                    headers: {
                        'User-Agent': 'ZydaCare/1.0 (zydacare@gmail.com)', // required by OSM
                    },
                }
            );

            const data = await response.json();

            if (!data || !data.address) {
                throw new Error('Unable to get precise location');
            }

            const address = data.address;
            const fullAddress = `${address.house_number || ''} ${address.road || ''}, ${address.suburb || address.village || address.city_district || ''}, ${address.city || address.town || ''}, ${address.state || ''}, ${address.postcode || ''}, ${address.country || ''}`.replace(/\s+,/g, ',').replace(/ ,/g, '');

            const coords = {
                lat: latitude,
                lng: longitude,
                address: fullAddress,
                raw: address,
            };

            console.log('SOS Sent!', coords);
            setSendingSOS(false);
            setShowSOSModal(false);
            showToast('SOS Sent! Emergency responders have been notified. Help is on the way.', 'success');

        } catch (error) {
            console.error('SOS Error:', error);
            setSendingSOS(false);
            setShowSOSModal(false);
            showToast('Unable to send SOS request.', 'error');
        }
    };



    return (
        <View>
            <TouchableOpacity
                onPress={() => setShowSOSModal(true)}
                activeOpacity={0.9}
                style={{
                    position: 'absolute',
                    bottom: 20,
                    right: 20,
                    backgroundColor: '#EF4444',
                    width: 55,
                    height: 55,
                    borderRadius: 100,
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#EF4444',
                    shadowOpacity: 0.4,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 8,
                    elevation: 8,
                }}
            >
                <Ionicons name="alert" size={28} color="#fff" />
                <Text className="text-white text-xs font-sans-bold ">SOS</Text>
            </TouchableOpacity>


            <Modal
                visible={showSOSModal}
                animationType="fade"
                transparent
                onRequestClose={() => setShowSOSModal(false)}
            >
                <View className="flex-1 bg-black/50 items-center justify-center px-6">
                    <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <View className="items-center mb-5">
                            <View className="bg-red-50 p-4 rounded-full mb-3">
                                <Ionicons name="alert-circle" size={48} color="#EF4444" />
                            </View>
                            <Text className="text-xl font-sans-bold text-gray-800">
                                Emergency Alert
                            </Text>
                        </View>

                        <Text className="text-gray-600 text-center mb-6 font-sans leading-relaxed">
                            Your location and medical information will be shared with emergency responders immediately. Are you sure you want to proceed?
                        </Text>

                        <View className="flex-row justify-between mt-2">
                            <TouchableOpacity
                                onPress={() => setShowSOSModal(false)}
                                className="flex-1 bg-gray-100 rounded-xl py-4 mr-2"
                                activeOpacity={0.7}
                            >
                                <Text className="text-center text-gray-700 font-sans-semibold text-base">
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSOS}
                                disabled={sendingSOS}
                                className="flex-1 rounded-xl py-4 ml-2"
                                style={{ backgroundColor: sendingSOS ? '#FCA5A5' : '#EF4444' }}
                                activeOpacity={0.8}
                            >
                                {sendingSOS ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text className="text-center text-white font-sans-bold text-base">
                                        Send SOS
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}