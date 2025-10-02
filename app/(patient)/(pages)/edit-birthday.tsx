import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, Animated, Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';

export default function EditBirthdayScreen() {
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const [birthday, setBirthday] = useState<Date>(
        user?.dob ? new Date(user.dob) : new Date(2000, 0, 1)
    );
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [scaleAnim] = useState(new Animated.Value(1));
    const [fadeAnim] = useState(new Animated.Value(1));

    const handleSave = async () => {
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

            await updateProfile({ dob: birthday.toISOString() });
            showToast('Birthday updated successfully', 'success');
            
            // Fade out before navigating back
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start(() => router.back());
        } catch (error) {
            showToast('Failed to update birthday', 'error');
            setIsSaving(false);
        }
    };

    const onChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || birthday;
        setShowDatePicker(false);
        setBirthday(currentDate);
        
        // Subtle animation when date changes
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

    const calculateAge = (birthDate: Date) => {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Calculate maximum date (18 years ago from today)
    const getMaximumDate = () => {
        const today = new Date();
        const maxDate = new Date(
            today.getFullYear() - 18,
            today.getMonth(),
            today.getDate()
        );
        return maxDate;
    };

    const age = calculateAge(birthday);

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />
            
            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                {/* Header */}
                <View className="flex-row items-center p-4 border-b border-gray-100 bg-white">
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        className="p-2 -ml-2"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text className="text-xl font-sans-bold flex-1 text-center mr-6">Edit Birthday</Text>
                </View>

                <View className="flex-1 p-6">
                    {/* Icon and Description */}
                    <View className="items-center mb-8 mt-4">
                        <View className="bg-primary/10 rounded-full p-6 mb-4">
                            <Ionicons name="calendar-outline" size={48} color="#7C3AED" />
                        </View>
                        <Text className="text-gray-600 font-sans text-center text-base">
                            Select your date of birth to personalize{'\n'}your experience
                        </Text>
                    </View>

                    {/* Date Display Card */}
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            activeOpacity={0.7}
                            className="bg-white border-2 border-primary/20 rounded-2xl p-6 mb-4 shadow-sm"
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text className="text-gray-500 font-sans text-sm mb-1">
                                        Your Birthday
                                    </Text>
                                    <Text className="text-gray-900 font-sans-bold text-2xl">
                                        {format(birthday, 'MMMM d, yyyy')}
                                    </Text>
                                </View>
                                <View className="bg-primary/10 rounded-full p-3">
                                    <Ionicons name="calendar" size={24} color="#7C3AED" />
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Age Display */}
                    <View className="bg-primary/5 rounded-xl p-4 mb-6">
                        <View className="flex-row items-center justify-center">
                            <Ionicons name="gift-outline" size={20} color="#7C3AED" />
                            <Text className="text-primary font-sans-medium ml-2">
                                You're {age} years old
                            </Text>
                        </View>
                    </View>

                    {/* Date Picker */}
                    {showDatePicker && (
                        <View className="bg-white rounded-2xl overflow-hidden shadow-lg mb-6">
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={birthday}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={onChange}
                                maximumDate={getMaximumDate()}
                                themeVariant="light"
                            />
                            {Platform.OS === 'ios' && (
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(false)}
                                    className="bg-primary/10 py-3 items-center border-t border-gray-100"
                                >
                                    <Text className="text-primary font-sans-medium">Done</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Helper Text */}
                    <View className="flex-row items-start mb-6">
                        <Ionicons name="information-circle-outline" size={20} color="#9CA3AF" />
                        <Text className="text-gray-500 font-sans text-sm ml-2 flex-1">
                            You must be at least 18 years old to use this service
                        </Text>
                    </View>

                    {/* Save Button */}
                    <View className="mt-auto">
                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={isSaving}
                            activeOpacity={0.8}
                            className={`rounded-full py-4 items-center shadow-lg ${
                                isSaving ? 'bg-secondary/70' : 'bg-secondary'
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
                                    <>
                                        <Text className="text-white font-sans-bold text-base">
                                            Save Changes
                                        </Text>
                                    </>
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
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}