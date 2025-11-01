import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, TextInput, KeyboardAvoidingView, Platform, Animated, Modal, ScrollView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';

// Popular country codes
const countryCodes = [
    { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
    { code: '+1', country: 'United States', flag: '🇺🇸' },
    { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
    { code: '+233', country: 'Ghana', flag: '🇬🇭' },
    { code: '+254', country: 'Kenya', flag: '🇰🇪' },
    { code: '+27', country: 'South Africa', flag: '🇿🇦' },
    { code: '+91', country: 'India', flag: '🇮🇳' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
];

export default function EditPhoneScreen() {
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const [phone, setPhone] = useState(user?.phone || '');
    const [isSaving, setIsSaving] = useState(false);
    const [countryCode, setCountryCode] = useState('+234'); // Default to Nigeria
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(1));
    const [fadeAnim] = useState(new Animated.Value(1));

    const formatPhoneNumber = (text: string) => {
        // Remove all non-numeric characters
        const cleaned = text.replace(/\D/g, '');
        
        // Format as: XXX XXX XXXX for better readability
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
    };

    const handlePhoneChange = (text: string) => {
        const formatted = formatPhoneNumber(text);
        setPhone(formatted);
    };

    const handleSave = async () => {
        const cleanPhone = phone.replace(/\s/g, '');
        
        if (!cleanPhone.trim() || cleanPhone.length < 10) {
            showToast('Please enter a valid phone number', 'error');
            return;
        }

        try {
            setIsSaving(true);
            
            // Success animation
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

            const fullPhone = `${countryCode}${cleanPhone}`;
            await updateProfile({ phone: fullPhone });
            showToast('Phone number updated successfully', 'success');
            
            // Fade out before navigating back
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => router.back());
        } catch (error) {
            showToast('Failed to update phone number', 'error');
            setIsSaving(false);
        }
    };

    const selectCountryCode = (code: string) => {
        setCountryCode(code);
        setShowCountryPicker(false);
        
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

    const selectedCountry = countryCodes.find(c => c.code === countryCode);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />
            
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {/* Header */}
                <View className="flex-row items-center p-4 border-b border-gray-100 bg-white  pt-8">
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        className="p-2 -ml-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-sans-bold flex-1 text-center mr-6">Edit Phone Number</Text>
                </View>

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 p-6"
                >
                    {/* Icon and Description */}
                    <View className="items-center mb-8 mt-4">
                        <View className="bg-primary/10 rounded-full p-6 mb-4">
                            <Ionicons name="call-outline" size={48} color="#7C3AED" />
                        </View>
                        <Text className="text-gray-600 font-sans text-center text-base">
                            Enter your phone number for account{'\n'}verification and security
                        </Text>
                    </View>

                    {/* Country Code Selector */}
                    <TouchableOpacity
                        onPress={() => setShowCountryPicker(true)}
                        className="bg-white border-2 border-primary/20 rounded-2xl p-5 mb-3 shadow-sm"
                        activeOpacity={0.7}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                                <Text className="text-gray-500 font-sans text-sm mb-1">
                                    Country
                                </Text>
                                <View className="flex-row items-center">
                                    <Text className="text-3xl mr-3">{selectedCountry?.flag}</Text>
                                    <Text className="text-gray-900 font-sans-bold text-xl">
                                        {selectedCountry?.country}
                                    </Text>
                                </View>
                            </View>
                            <View className="bg-primary/10 rounded-full p-3">
                                <Feather name="chevron-down" size={20} color="#7C3AED" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Phone Input Card */}
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <View className="bg-white border-2 border-primary/20 rounded-2xl p-5 mb-4 shadow-sm">
                            <Text className="text-gray-500 font-sans text-sm mb-2">
                                Phone Number
                            </Text>
                            <View className="flex-row items-center">
                                <Text className="text-gray-900 font-sans-bold text-2xl mr-3">
                                    {countryCode}
                                </Text>
                                <TextInput
                                    value={phone}
                                    onChangeText={handlePhoneChange}
                                    placeholder="803 123 4567"
                                    keyboardType="phone-pad"
                                    className="flex-1 font-sans-bold text-gray-900 text-2xl"
                                    autoFocus
                                    maxLength={12}
                                    placeholderTextColor="#D1D5DB"
                                />
                            </View>
                        </View>
                    </Animated.View>

                    {/* Full Number Preview */}
                    {phone.length > 0 && (
                        <View className="bg-primary/5 rounded-xl p-4 mb-6">
                            <View className="flex-row items-center justify-center">
                                <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                                <Text className="text-primary font-sans-medium ml-2">
                                    {countryCode} {phone}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Info Card */}
                    <View className="flex-row items-start mb-6">
                        <Ionicons name="shield-checkmark-outline" size={20} color="#7C3AED" />
                        <Text className="text-gray-500 font-sans text-sm ml-2 flex-1">
                            Your phone number is kept private and used only for account security and verification
                        </Text>
                    </View>

                    {/* Save Button */}
                    <View className="mt-auto">
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving || !phone.trim() || phone.replace(/\s/g, '').length < 10}
                            activeOpacity={0.8}
                            className={`rounded-full py-4 items-center shadow-lg ${
                                !phone.trim() || phone.replace(/\s/g, '').length < 10
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
                                    <Text className={`font-sans-bold text-base ${
                                        !phone.trim() || phone.replace(/\s/g, '').length < 10 ? 'text-gray-500' : 'text-white'
                                    }`}>
                                        Save Changes
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
                </KeyboardAvoidingView>

                {/* Country Code Picker Modal */}
                <Modal
                    visible={showCountryPicker}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowCountryPicker(false)}
                >
                    <View className="flex-1 bg-black/50 justify-end">
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
                                {countryCodes.map((country) => (
                                    <TouchableOpacity
                                        key={country.code}
                                        onPress={() => selectCountryCode(country.code)}
                                        className={`flex-row items-center p-4 border-b border-gray-50 ${
                                            country.code === countryCode ? 'bg-primary/5' : ''
                                        }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text className="text-3xl mr-4">{country.flag}</Text>
                                        <View className="flex-1">
                                            <Text className="text-gray-900 font-sans-medium text-base">
                                                {country.country}
                                            </Text>
                                            <Text className="text-gray-500 font-sans text-sm">
                                                {country.code}
                                            </Text>
                                        </View>
                                        {country.code === countryCode && (
                                            <Ionicons name="checkmark-circle" size={24} color="#7C3AED" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </Animated.View>
        </SafeAreaView>
    );
}