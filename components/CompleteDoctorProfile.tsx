import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { Image as RNImage } from 'react-native';
import { useAuth } from '@/context/authContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
// File system operations removed to simplify image handling
import { useToast } from './ui/Toast';

const DAYS_OF_WEEK = [
    { id: 1, day: 'monday', label: 'Mon' },
    { id: 2, day: 'tuesday', label: 'Tue' },
    { id: 3, day: 'wednesday', label: 'Wed' },
    { id: 4, day: 'thursday', label: 'Thu' },
    { id: 5, day: 'friday', label: 'Fri' },
    { id: 6, day: 'saturday', label: 'Sat' },
    { id: 7, day: 'sunday', label: 'Sun' },
];

const SPECIALTIES = [
    'General Practice',
    'Family Medicine',
    'Pediatrics',
    'Surgery',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'Neurology',
    'Psychiatry',
    'Obstetrics & Gynecology',
];

const CONSULTATION_TYPES = [
    { id: 'online', label: 'Video Consultation', icon: 'videocam-outline' },
    { id: 'inPerson', label: 'In-Person', icon: 'person-outline' },
    { id: 'homeVisit', label: 'Home Visit', icon: 'home-outline' },
];

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
    return (
        <View className="flex-row justify-center mb-3">
            {Array.from({ length: totalSteps }).map((_, index) => (
                <View key={index} className="flex-row items-center">
                    <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${index + 1 <= currentStep ? 'bg-[#67A9AF]' : 'bg-gray-200'
                            }`}
                    >
                        <Text className={`font-sans-medium text-white`}>
                            {index + 1}
                        </Text>
                    </View>
                    {index < totalSteps - 1 && (
                        <View className="h-0.5 w-8 bg-gray-200 mx-1" />
                    )}
                </View>
            ))}
        </View>
    );
};

export default function CompleteDoctorProfile() {
    const { completeDoctorProfile, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    // Form state
    // Define the form data type
    type ServiceType = {
        name: string;
        description: string;
        price: string;
        duration: string;
        type: string;
    };

    type FormData = {
        title: string;
        gender: string;
        professionalSummary: string;
        specialties: string[];
        yearsOfExperience: string;
        services: Array<{
            name: string;
            description: string;
            price: string;
            duration: string;
            type: string;
        }>;
        consultationFees: {
            inPerson: string;
            video: string;
            homeVisit: string;
            currency: string;
        };
        location: {
            address: string;
            city: string;
            state: string;
            country: string;
            postalCode: string;
            coordinates: [number, number];
          
        };
        workingDays: string[];
        isAvailableForOnlineConsultations: boolean;
        isAvailableForInPersonConsultations: boolean;
        isAvailableForHomeVisits: boolean;
        profileImage: {
            public_id: string;
            url: string;
        };
    };

    const [formData, setFormData] = useState<FormData>({
        title: 'Dr.',
        gender: '',
        professionalSummary: '',
        specialties: [],
        yearsOfExperience: '',
        services: [{
            name: '',
            description: '',
            price: '',
            duration: '30',
            type: 'consultation'
        }],
        consultationFees: {
            inPerson: '',
            video: '',
            homeVisit: '',
            currency: 'NGN',
        },
        location: {
            address: '',
            city: '',
            state: '',
            country: 'Nigeria',
            postalCode: '',
            coordinates: [0, 0],
        },
        workingDays: [],
        isAvailableForOnlineConsultations: false,
        isAvailableForInPersonConsultations: false,
        isAvailableForHomeVisits: false,
        profileImage: {
            public_id: '',
            url: ''
        },
    });

    const requiredFields = [
        'title',
        'gender',
        'professionalSummary',
        'specialties',
        'yearsOfExperience',
        'services',
        'consultationFees',
        'location',
        'workingDays',
        'isAvailableForOnlineConsultations',
        'isAvailableForInPersonConsultations',
        'isAvailableForHomeVisits',
        'profileImage',
    ];

    const handleNext = () => {
        const isFormValid = requiredFields.every((field) => formData[field]);
        if (!isFormValid) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        
        if (step < totalSteps) {
            setStep(step + 1);
            // Scroll to top when changing steps
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            // Scroll to top when changing steps
            if (scrollViewRef.current) {
                scrollViewRef.current.scrollTo({ y: 0, animated: true });
            }
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Prepare the data to match the backend structure
            const submissionData = {
                title: formData.title,
                gender: formData.gender,
                professionalSummary: formData.professionalSummary,
                specialties: formData.specialties,
                yearsOfExperience: Number(formData.yearsOfExperience) || 0,
                services: formData.services.map(service => ({
                    name: service.name,
                    description: service.description,
                    price: Number(service.price) || 0,
                    duration: Number(service.duration) || 30,
                    type: service.type || 'consultation'
                })),
                consultationFees: {
                    inPerson: Number(formData.consultationFees.inPerson) || 0,
                    video: Number(formData.consultationFees.video) || 0,
                    homeVisit: Number(formData.consultationFees.homeVisit) || 0,
                    currency: 'NGN',
                },
                location: {
                    address: formData.location.address,
                    city: formData.location.city,
                    state: formData.location.state,
                    country: formData.location.country,
                    postalCode: formData.location.postalCode,
                    coordinates: formData.location.coordinates,
                   
                },
                workingDays: formData.workingDays,
                isAvailableForOnlineConsultations: formData.isAvailableForOnlineConsultations,
                isAvailableForInPersonConsultations: formData.isAvailableForInPersonConsultations,
                isAvailableForHomeVisits: formData.isAvailableForHomeVisits,
                profileImage: formData.profileImage.url ? formData.profileImage : undefined
            };

            if (!token) {
                throw new Error('No authentication token found');
            }
            await completeDoctorProfile(submissionData, token);
            router.replace('/(doctor)/(tabs)/home');
        } catch (error: any) {
            console.error('Profile submission error:', error);
            showToast(error.response?.data?.message || error.message || 'Failed to update profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const scrollViewRef = React.useRef<ScrollView>(null);

    const handleImageUpload = async () => {
        try {
            // Request permissions
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showToast('Permission Denied: Sorry, we need camera roll permissions to upload images.', 'error');
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.[0]?.uri) {
                return; // User cancelled the picker
            }

            const selectedAsset = result.assets[0];
            const fileUri = selectedAsset.uri;
            
            // Get file extension and type
            const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
            const filename = `profile_${Date.now()}.${fileExt}`;
            const fileType = `image/${fileExt}`;
            
            // Update form data with the selected image
            setFormData(prev => ({
                ...prev,
                profileImage: {
                    public_id: `profile_${Date.now()}`,
                    url: fileUri,
                    type: fileType,
                    name: filename
                }
            }));
            
        } catch (error) {
            console.error('Error picking image:', error);
            showToast('Failed to select image. Please try again.', 'error');
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View className="pb-32">
                        <Text className="text-xl font-sans-bold text-[#1A1A1A] mb-6">Basic Information</Text>

                        {/* Title */}
                        <View className="mb-5">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-2">Title</Text>
                            <View className="flex-row flex-wrap gap-3">
                                {['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'].map((title) => (
                                    <TouchableOpacity
                                        key={title}
                                        className={`flex-1 py-3 rounded-xl items-center ${formData.title === title ? 'bg-[#67A9AF]' : 'bg-white border border-gray-200'
                                            }`}
                                        onPress={() => setFormData({ ...formData, title })}
                                    >
                                        <Text
                                            className={`font-sans-medium ${formData.title === title ? 'text-white' : 'text-gray-700'
                                                }`}
                                        >
                                            {title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Gender */}
                        <View className="mb-5">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-2">Gender</Text>
                            <View className="flex-row gap-4">
                                {['Male', 'Female'].map((gender) => (
                                    <TouchableOpacity
                                        key={gender}
                                        className={`flex-1 py-3 rounded-xl items-center ${formData.gender === gender ? 'bg-[#67A9AF]' : 'bg-white border border-gray-200'
                                            }`}
                                        onPress={() => setFormData({ ...formData, gender })}
                                    >
                                        <Text
                                            className={`font-sans-medium ${formData.gender === gender ? 'text-white' : 'text-gray-700'
                                                }`}
                                        >
                                            {gender}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>


                        {/* Years of Experience */}
                        <View className="mb-5">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-2">
                                Years of Experience
                            </Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-sans"
                                placeholder="e.g., 5"
                                value={formData.yearsOfExperience}
                                onChangeText={(text) => setFormData({ ...formData, yearsOfExperience: text })}
                                keyboardType="numeric"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Professional Summary */}
                        <View className="mb-5">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-2">
                                Professional Summary
                            </Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-sans"
                                style={{ minHeight: 120, textAlignVertical: 'top' }}
                                multiline
                                placeholder="Tell us about your experience and expertise..."
                                value={formData.professionalSummary}
                                onChangeText={(text) =>
                                    setFormData({ ...formData, professionalSummary: text })
                                }
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Specialties */}
                        <View className="mb-5">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-2">
                                Specialties (Select up to 3)
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {SPECIALTIES.map((specialty) => (
                                    <TouchableOpacity
                                        key={specialty}
                                        className={`px-4 py-2 rounded-full ${formData.specialties.includes(specialty)
                                            ? 'bg-primary'
                                            : 'bg-white border border-gray-200'
                                            }`}
                                        onPress={() => {
                                            if (formData.specialties.includes(specialty)) {
                                                setFormData({
                                                    ...formData,
                                                    specialties: formData.specialties.filter((s) => s !== specialty),
                                                });
                                            } else if (formData.specialties.length < 3) {
                                                setFormData({
                                                    ...formData,
                                                    specialties: [...formData.specialties, specialty],
                                                });
                                            }
                                        }}
                                    >
                                        <Text
                                            className={`text-xs font-sans-medium ${formData.specialties.includes(specialty)
                                                ? 'text-white'
                                                : 'text-gray-700'
                                                }`}
                                        >
                                            {specialty}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View className="mb-6">
                        <Text className="text-xl font-sans-bold text-[#1A1A1A] mb-6">Services & Availability</Text>

                        {/* Services */}
                        <View className="mb-6">
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-sm font-sans-medium text-[#374151]">Services</Text>
                                <TouchableOpacity
                                    onPress={() =>
                                        setFormData({
                                            ...formData,
                                            services: [
                                                ...formData.services,
                                                { name: '', description: '', price: '', duration: '', type: 'consultation' },
                                            ],
                                        })
                                    }
                                    className="p-1"
                                >
                                    <Ionicons name="add-circle" size={24} color="#D65C1E" />
                                </TouchableOpacity>
                            </View>

                            {formData.services.map((service, index) => (
                                <View key={index} className="bg-white p-4 rounded-xl mb-3 border border-gray-100">
                                    <View className="flex-row justify-between items-center mb-2">
                                        <Text className="text-sm font-sans-medium text-[#374151]">Service {index + 1}</Text>
                                        {formData.services.length > 1 && (
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const newServices = [...formData.services];
                                                    newServices.splice(index, 1);
                                                    setFormData({ ...formData, services: newServices });
                                                }}
                                                className="p-1"
                                            >
                                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    <TextInput
                                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] font-sans mb-2"
                                        placeholder="Service name"
                                        value={service.name}
                                        onChangeText={(text) => {
                                            const newServices = [...formData.services];
                                            newServices[index].name = text;
                                            setFormData({ ...formData, services: newServices });
                                        }}
                                        placeholderTextColor="#9CA3AF"
                                    />

                                    <TextInput
                                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#1A1A1A] font-sans mb-2"
                                        style={{ minHeight: 100, textAlignVertical: 'top' }}
                                        multiline
                                        placeholder="Service description"
                                        value={service.description}
                                        onChangeText={(text) => {
                                            const newServices = [...formData.services];
                                            newServices[index].description = text;
                                            setFormData({ ...formData, services: newServices });
                                        }}
                                        placeholderTextColor="#9CA3AF"
                                    />

                                    <View className="flex-row gap-3">
                                        <View className="flex-1">
                                            <TextInput
                                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans text-[#1A1A1A]"
                                                placeholder="Price (₦)"
                                                value={service.price}
                                                onChangeText={(text) => {
                                                    const newServices = [...formData.services];
                                                    newServices[index].price = text;
                                                    setFormData({ ...formData, services: newServices });
                                                }}
                                                keyboardType="numeric"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                        <View className="flex-1">
                                            <TextInput
                                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans text-[#1A1A1A]"
                                                placeholder="Duration (mins)"
                                                value={service.duration}
                                                onChangeText={(text) => {
                                                    const newServices = [...formData.services];
                                                    newServices[index].duration = text;
                                                    setFormData({ ...formData, services: newServices });
                                                }}
                                                keyboardType="numeric"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* Consultation Fees */}
                        <View className="mb-6">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-3">
                                Consultation Fees (₦)
                            </Text>

                            <View className="space-y-3">
                                {CONSULTATION_TYPES.map((type) => (
                                    <View key={type.id} className="flex-row items-center bg-white p-4 rounded-xl border border-gray-100">
                                        <View className="w-10 h-10 rounded-lg bg-[#E8F5F1] items-center justify-center mr-3">
                                            <Ionicons name={type.icon as any} size={20} color="#00D9A5" />
                                        </View>
                                        <Text className="flex-1 text-sm font-sans text-gray-700">{type.label}</Text>
                                        <TextInput
                                            className="w-24 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans text-[#1A1A1A] text-right"
                                            placeholder="0"
                                            value={formData.consultationFees[type.id as keyof typeof formData.consultationFees] as string}
                                            onChangeText={(text) =>
                                                setFormData({
                                                    ...formData,
                                                    consultationFees: {
                                                        ...formData.consultationFees,
                                                        [type.id]: text,
                                                    },
                                                })
                                            }
                                            keyboardType="numeric"
                                            placeholderTextColor="#9CA3AF"
                                        />
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Working Days */}
                        <View className="mb-6">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-3">
                                Working Days
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {DAYS_OF_WEEK.map((day) => (
                                    <TouchableOpacity
                                        key={day.id}
                                        className={`w-14 h-14 rounded-xl items-center justify-center ${formData.workingDays.includes(day.day)
                                            ? 'bg-[#00D9A5]'
                                            : 'bg-white border border-gray-200'
                                            }`}
                                        onPress={() => {
                                            if (formData.workingDays.includes(day.day)) {
                                                setFormData({
                                                    ...formData,
                                                    workingDays: formData.workingDays.filter((d) => d !== day.day),
                                                });
                                            } else {
                                                setFormData({
                                                    ...formData,
                                                    workingDays: [...formData.workingDays, day.day],
                                                });
                                            }
                                        }}
                                    >
                                        <Text
                                            className={`text-sm font-sans-medium ${formData.workingDays.includes(day.day) ? 'text-white' : 'text-gray-700'
                                                }`}
                                        >
                                            {day.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View className="mb-6">
                        <Text className="text-xl font-sans-bold text-[#1A1A1A] mb-6">Location & Contact</Text>

                        {/* Practice Name */}
                        {/* <View className="mb-5">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-2">
                                Practice/Hospital Name
                            </Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-sans"
                                placeholder="Enter practice or hospital name"
                                value={formData.location.practiceName}
                                onChangeText={(text) =>
                                    setFormData({
                                        ...formData,
                                        location: { ...formData.location, practiceName: text },
                                    })
                                }
                                placeholderTextColor="#9CA3AF"
                            />
                        </View> */}

                        {/* Address */}
                        <View className="mb-5">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-2">
                                Address
                            </Text>
                            <TextInput
                                className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-sans"
                                placeholder="Full address"
                                value={formData.location.address}
                                onChangeText={(text) =>
                                    setFormData({
                                        ...formData,
                                        location: { ...formData.location, address: text },
                                    })
                                }
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* City and State */}
                        <View className="flex-row gap-3 mb-5">
                            <View className="flex-1">
                                <Text className="text-sm font-sans-medium text-[#374151] mb-2">City</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-sans"
                                    placeholder="City"
                                    value={formData.location.city}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            location: { ...formData.location, city: text },
                                        })
                                    }
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-sans-medium text-[#374151] mb-2">State</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-sans"
                                    placeholder="State"
                                    value={formData.location.state}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            location: { ...formData.location, state: text },
                                        })
                                    }
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>

                        {/* Country and Postal Code */}
                        <View className="flex-row gap-3 mb-5">
                            <View className="flex-1">
                                <Text className="text-sm font-sans-medium text-[#374151] mb-2">Country</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-sans"
                                    placeholder="Country"
                                    value={formData.location.country}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            location: { ...formData.location, country: text },
                                        })
                                    }
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-sm font-sans-medium text-[#374151] mb-2">Postal Code</Text>
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#1A1A1A] font-sans"
                                    placeholder="Postal code"
                                    value={formData.location.postalCode}
                                    onChangeText={(text) =>
                                        setFormData({
                                            ...formData,
                                            location: { ...formData.location, postalCode: text },
                                        })
                                    }
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                        </View>


                        {/* Profile Photo */}
                        <View className="mb-6">
                            <Text className="text-sm font-sans-medium text-[#374151] mb-3">
                                Profile Photo
                            </Text>
                            <View className="flex-row items-center">
                                <View className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center mr-4">
                                    {formData.profileImage ? (
                                        <RNImage
                                            source={{ uri: formData.profileImage.url }}
                                            className="w-24 h-24 rounded-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Ionicons name="person" size={32} color="#9CA3AF" />
                                    )}
                                </View>
                                <View className="flex-1">
                                    <TouchableOpacity
                                        className="bg-white border border-[#67A9AF] py-2 px-4 rounded-lg items-center"
                                        onPress={handleImageUpload}
                                    >
                                        <Text className="text-[#67A9AF] font-sans-medium">{formData.profileImage ? 'Change Photo' : 'Upload Photo'}</Text>
                                    </TouchableOpacity>
                                    <Text className="text-xs font-sans text-gray-500 mt-1 text-center">
                                        JPG, PNG (Max 5MB)
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FA]">
            {/* Header */}
            <View className="bg-white px-6 pt-10 pb-3">
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className="text-2xl font-sans-bold text-[#1A1A1A]">Complete Profile</Text>
                        <Text className="text-sm font-sans text-gray-500">Step {step} of {totalSteps}</Text>
                    </View>
                    {step > 1 && (
                        <TouchableOpacity onPress={handleBack} className="p-2">
                            <Ionicons name="arrow-back" size={24} color="#4B5563" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Step Indicator */}
                <StepIndicator currentStep={step} totalSteps={totalSteps} />
            </View>

            {/* Content */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView
                        ref={scrollViewRef}
                        className="flex-1 px-6 pt-4"
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ paddingBottom: 40 }}
                    >
                        {renderStepContent()}
                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
            {/* Navigation Buttons */}
            <View className="py-6 px-6">
                <TouchableOpacity
                    className="bg-[#67A9AF] py-4 rounded-xl items-center justify-center flex-row shadow-md"
                    onPress={handleNext}
                    disabled={loading}
                    style={{
                        shadowColor: '#67A9AF',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 5,
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text className="text-white font-sans-medium text-base">
                            {step === totalSteps ? 'Complete Profile' : 'Next'}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* {step < totalSteps && (
                    <TouchableOpacity
                        className="mt-3 py-4 rounded-xl items-center"
                        onPress={handleNext}
                    >
                        <Text className="text-secondary font-sans-medium">
                            Skip for now
                        </Text>
                    </TouchableOpacity>
                )} */}
            </View>
        </SafeAreaView>
    );
}