import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, TextInput, ScrollView, Platform, KeyboardAvoidingView, Animated } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';

const COUNTRIES = [
    { code: 'NG', name: 'Nigeria' }
];

type AddressFormData = {
    country: string;
    state: string;
    city: string;
    address: string;
    zipCode: string;
};

export default function EditAddressScreen() {
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();

    const [formData, setFormData] = useState<AddressFormData>({
        country: 'NG', // Default to Nigeria
        state: user?.state || '',
        city: user?.city || '',
        address: user?.address || '',
        zipCode: user?.zipCode || ''
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(1));
    const [fadeAnim] = useState(new Animated.Value(1));

    const handleInputChange = (field: keyof AddressFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!formData.country || !formData.state || !formData.city || !formData.address) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            setIsSaving(true);
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                })
            ]).start();

            // Only include the fields that are being updated
            const updateData = {
                country: formData.country,
                state: formData.state,
                city: formData.city,
                address: formData.address,
                zipCode: formData.zipCode
            };

            await updateProfile(updateData);
            showToast('Address updated successfully', 'success');

            // Fade out before navigating back
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => router.back());

        } catch (error) {
            console.error('Update address error:', error);
            showToast('Failed to update address', 'error');
            setIsSaving(false);
        }
    };

    const selectCountry = () => {
        // Country is fixed to Nigeria
        handleInputChange('country', 'NG');

        // Subtle animation
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.02,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />

            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {/* Header */}
                <View className="flex-row items-center p-4 border-b border-gray-100 bg-white pt-8">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-sans-bold flex-1 text-center mr-6">Edit Address</Text>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                    keyboardVerticalOffset={90}
                >
                    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
                        {/* Icon and Description */}
                        <View className="items-center mb-6 pt-6 px-6">
                            <View className="bg-primary/10 rounded-full p-5 mb-4">
                                <Ionicons name="location-outline" size={40} color="#7C3AED" />
                            </View>
                            <Text className="text-gray-600 font-sans text-center text-base">
                                Update your address information for better service
                            </Text>
                        </View>

                        <View className="px-6 pb-6">
                            {/* Country Picker */}
                            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                <View className="bg-white border-2 border-primary/20 rounded-2xl p-5 mb-4 shadow-sm">
                                    <Text className="text-gray-500 font-sans text-sm mb-1">
                                        Country <Text className="text-red-500">*</Text>
                                    </Text>
                                    <View className="flex-row items-center justify-between p-3 bg-gray-100 border border-gray-200 rounded-lg">
                                        <Text className="text-gray-700">
                                            {`${getCountryFlag('NG')} Nigeria`}
                                        </Text>
                                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                    </View>
                                </View>
                            </Animated.View>

                            {/* State/Province */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-sans-medium mb-2">
                                    State/Province <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    value={formData.state}
                                    onChangeText={(text) => handleInputChange('state', text)}
                                    placeholder="Enter state or province"
                                    className="bg-white border-2 border-gray-200 rounded-2xl px-3 py-4 font-sans text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            {/* City */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-sans-medium mb-2">
                                    City <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    value={formData.city}
                                    onChangeText={(text) => handleInputChange('city', text)}
                                    placeholder="Enter your city"
                                    className="bg-white border-2 border-gray-200 rounded-2xl px-3 py-4 font-sans text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            {/* Address */}
                            <View className="mb-4">
                                <Text className="text-gray-700 font-sans-medium mb-2">
                                    Street Address <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    value={formData.address}
                                    onChangeText={(text) => handleInputChange('address', text)}
                                    placeholder="Enter your street address"
                                    multiline
                                    numberOfLines={3}
                                    className="bg-white border-2 border-gray-200 rounded-2xl px-3 py-4 font-sans text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* ZIP/Postal Code */}
                            <View className="mb-6">
                                <Text className="text-gray-700 font-sans-medium mb-2">
                                    ZIP/Postal Code
                                </Text>
                                <TextInput
                                    value={formData.zipCode}
                                    onChangeText={(text) => handleInputChange('zipCode', text)}
                                    placeholder="Enter ZIP or postal code"
                                    keyboardType="number-pad"
                                    className="bg-white border-2 border-gray-200 rounded-2xl px-3 py-4 font-sans text-gray-900"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            {/* Save Button */}
                            <TouchableOpacity
                                onPress={handleSave}
                                disabled={isSaving || !formData.country || !formData.state || !formData.city || !formData.address}
                                activeOpacity={0.8}
                                className={`rounded-full py-4 items-center shadow-lg ${!formData.country || !formData.state || !formData.city || !formData.address
                                        ? 'bg-gray-300'
                                        : isSaving
                                            ? 'bg-secondary/70'
                                            : 'bg-secondary'
                                    }`}
                            >
                                <View className="flex-row items-center">
                                    {isSaving ? (
                                        <>
                                            <Ionicons name="checkmark-circle" size={20} color="white" />
                                            <Text className="text-white font-sans-bold ml-2 text-base">
                                                Saving...
                                            </Text>
                                        </>
                                    ) : (
                                        <Text className="text-white font-sans-bold text-base">
                                            Save Address
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>

                            {/* Cancel Button */}
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="py-4 items-center mt-3"
                                disabled={isSaving}
                            >
                                <Text className="text-gray-500 font-sans-medium">Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Country Picker Modal */}
                {showCountryPicker && (
                    <View className="absolute inset-0 bg-black/50 justify-end">
                        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '70%' }}>
                            {/* Modal Header */}
                            <View className="flex-row items-center justify-between p-6 border-b border-gray-100">
                                <Text className="text-xl font-sans-bold">Select Country</Text>
                                <TouchableOpacity
                                    onPress={() => setShowCountryPicker(false)}
                                    className="p-2 bg-gray-100 rounded-full"
                                >
                                    <Ionicons name="close" size={20} color="#374151" />
                                </TouchableOpacity>
                            </View>

                            {/* Country List */}
                            <ScrollView className="flex-1">
                                {COUNTRIES.map((country) => (
                                    <TouchableOpacity
                                        key={country.code}
                                        onPress={selectCountry}
                                        className={`flex-row items-center p-4 border-b border-gray-50 ${formData.country === country.code ? 'bg-primary/5' : ''
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text className="text-2xl mr-4">
                                            {getCountryFlag(country.code)}
                                        </Text>
                                        <Text className="text-gray-900 font-sans-medium text-base">
                                            {country.name}
                                        </Text>
                                        {formData.country === country.code && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={24}
                                                color="#7C3AED"
                                                style={{ marginLeft: 'auto' }}
                                            />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                )}
            </Animated.View>
        </SafeAreaView>
    );
}

// Helper function to get country flag emoji
function getCountryFlag(countryCode: string): string {
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
}
