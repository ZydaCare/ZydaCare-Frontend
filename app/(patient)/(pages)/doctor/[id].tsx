import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/authContext';
import { getDoctorDetails } from '@/api/patient/user';
import { getDoctorAvailability } from '@/utils/getDoctorUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RawDoctor = any;

type PatientDoctor = {
    _id: string;
    name: string;
    title: string;
    fullName: string;
    speciality: string;
    bio?: string;
    yearsOfExperience: number;
    profileImageUrl?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    email?: string;
    rating: number;
    totalReviews: number;
    consultationFees?: {
        inPerson?: number;
        video?: number;
        homeVisit?: number;
        currency?: string;
    };
    availability?: any;
    availabilityStatus: { isAvailable: boolean; status: string; nextSlot?: string };
    services?: Array<{ name: string; description?: string; price?: number; duration?: number }>;
    languages?: string[];
    specialties?: string[];
    gender?: string;
    isVerified?: boolean;
    status?: string;
    acceptedInsurances?: string[];
    mdcn?: { registrationType?: string; folioNumber?: string };
    educationDetails?: { medicalSchool?: string; degree?: string; graduationYear?: number };
    internship?: { hospitalName?: string; supervisor?: string; startDate?: any; endDate?: any };
};

export default function DoctorDetailsScreen() {
    const { id } = useLocalSearchParams();
    // const { token } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [doctorRaw, setDoctorRaw] = useState<RawDoctor | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const loadToken = async () => {
            try {
                const storedToken = await AsyncStorage.getItem('token');
                setToken(storedToken);
            } catch (error) {
                console.error('Error loading token:', error);
            }
        };

        loadToken();
    }, []);


    useEffect(() => {
        const fetchDoctorDetails = async () => {
            try {
                setLoading(true);
                const response = await getDoctorDetails(id as string, token as string);
                if (response.success) {
                    setDoctorRaw(response.data);
                } else {
                    setError('Failed to load doctor details');
                }
            } catch (err: any) {
                setError(err.message || 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (id && token) {
            fetchDoctorDetails();
        }
    }, [id, token]);

    const handleBookAppointment = () => {
        if (normalizedDoctor) {
            router.push({
                pathname: '/appointment/book',
                params: { doctorId: normalizedDoctor._id },
            });
        }
    };

    const renderStars = (rating: number) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(<Ionicons key={i} name="star" size={14} color="#FFD700" />);
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push(<Ionicons key={i} name="star-half" size={14} color="#FFD700" />);
            } else {
                stars.push(<Ionicons key={i} name="star-outline" size={14} color="#D1D5DB" />);
            }
        }
        return stars;
    };

    const normalizedDoctor: PatientDoctor | null = useMemo(() => {
        if (!doctorRaw) return null;
        const profile = doctorRaw.profile || {};
        const location = profile.location || {};
        const addressLine = [location.address].filter(Boolean).join(' ');
        const availabilityStatus = getDoctorAvailability(profile.availability);
        const imageUrl = profile.profileImage?.url || doctorRaw.profileImage?.url;

        return {
            _id: doctorRaw._id,
            name: `${profile.title || 'Dr.'} ${doctorRaw.fullName || ''}`.trim(),
            title: profile.title || 'Dr.',
            fullName: doctorRaw.fullName || '',
            speciality: profile.speciality || doctorRaw.speciality || '',
            bio: profile.professionalSummary || doctorRaw.bio,
            yearsOfExperience: profile.yearsOfExperience || doctorRaw.yearsOfExperience || 0,
            profileImageUrl: imageUrl,
            addressLine,
            city: location.city,
            state: location.state,
            country: location.country,
            phone: doctorRaw.phoneNumber || doctorRaw?.contact?.phone,
            email: doctorRaw.email || doctorRaw?.contact?.email,
            rating: profile.rating || doctorRaw.averageRating || 0,
            totalReviews: profile.totalReviews || doctorRaw.reviewCount || 0,
            consultationFees: profile.consultationFees,
            availability: profile.availability,
            availabilityStatus,
            services: profile.services || [],
            languages: profile.languages || [],
            specialties: profile.specialties || [],
            gender: profile.gender,
            isVerified: doctorRaw.isVerified,
            status: doctorRaw.status,
            acceptedInsurances: profile.acceptedInsurances || [],
            mdcn: {
                registrationType: doctorRaw.mdcnRegistration?.registrationType,
                folioNumber: doctorRaw.mdcnRegistration?.folioNumber,
            },
            educationDetails: {
                medicalSchool: doctorRaw.educationDetails?.medicalSchool,
                degree: doctorRaw.educationDetails?.degree,
                graduationYear: doctorRaw.educationDetails?.graduationYear,
            },
            internship: {
                hospitalName: doctorRaw.internship?.hospitalName,
                supervisor: doctorRaw.internship?.supervisor,
                startDate: doctorRaw.internship?.startDate,
                endDate: doctorRaw.internship?.endDate,
            },
        } as PatientDoctor;
    }, [doctorRaw]);

    // Date formatter that supports both ISO strings and Mongo-like objects with $date
    const formatDate = (value: any): string | undefined => {
        if (!value) return undefined;
        const dateStr = typeof value === 'string' ? value : (value.$date || value._date || value.date);
        if (!dateStr) return undefined;
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return undefined;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#67A9AF" />
            </SafeAreaView>
        );
    }

    if (error || !normalizedDoctor) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 p-5">
                <View className="items-center bg-white rounded-2xl p-8 shadow-sm">
                    <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
                        <MaterialIcons name="error-outline" size={32} color="#EF4444" />
                    </View>
                    <Text className="text-lg font-semibold text-gray-900 mb-2">Oops!</Text>
                    <Text className="text-sm text-gray-500 text-center mb-6">
                        {error || 'Failed to load doctor details'}
                    </Text>
                    <TouchableOpacity
                        className="px-8 py-3 rounded-xl shadow-sm"
                        style={{ backgroundColor: '#67A9AF' }}
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-semibold text-sm">Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white px-4 py-3 flex-row items-center justify-between shadow-sm">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-gray-50">
                    <Ionicons name="arrow-back" size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text className="text-base font-sans-semibold text-gray-900">Doctor Details</Text>
                <View className="w-10 h-10 items-center justify-center rounded-full bg-gray-50">
                    {/* <Ionicons name="share-outline" size={20} color="#1F2937" /> */}
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Profile Card */}
                <View className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
                    {/* Cover with gradient */}
                    <View className="h-24" style={{ backgroundColor: '#67A9AF' }}>
                        <View className="absolute inset-0 opacity-20">
                            <View className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ backgroundColor: '#fff' }} />
                            <View className="absolute bottom-0 left-0 w-24 h-24 rounded-full" style={{ backgroundColor: '#fff' }} />
                        </View>
                    </View>

                    {/* Profile info */}
                    <View className="px-5 pb-5 items-center -mt-16">
                        <View className="relative mb-3">
                            <Image
                                source={{
                                    uri: normalizedDoctor.profileImageUrl ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedDoctor.fullName || 'U')}&background=67A9AF&color=fff&size=200`
                                }}
                                className="w-28 h-28 rounded-full bg-white border-4 border-white"
                                resizeMode="cover"
                            />
                            {normalizedDoctor.availabilityStatus.isAvailable && (
                                <View className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-3 border-white" />
                            )}
                        </View>

                        <Text className="text-xl font-sans-bold text-gray-900 text-center mb-1">
                            {normalizedDoctor.name}
                        </Text>
                        <Text className="text-sm font-sans text-gray-600 mb-3">
                            {normalizedDoctor.speciality}
                        </Text>

                        {/* Stats Row */}
                        <View className="flex-row items-center justify-center w-full mb-4">
                            <View className="items-center px-4 border-r border-gray-200">
                                <Text className="text-lg font-sans-bold" style={{ color: '#67A9AF' }}>
                                    {normalizedDoctor.yearsOfExperience}+
                                </Text>
                                <Text className="text-xs font-sans text-gray-500 mt-0.5">Years Exp.</Text>
                            </View>
                            <View className="items-center px-4">
                                <View className="flex-row items-center">
                                    <Ionicons name="star" size={16} color="#FFD700" />
                                    <Text className="text-lg font-sans-semibold text-gray-900 ml-1">
                                        {normalizedDoctor.rating.toFixed(1)}
                                    </Text>
                                </View>
                                <Text className="text-xs font-sans text-gray-500 mt-0.5">
                                    {normalizedDoctor.totalReviews} reviews
                                </Text>
                            </View>
                        </View>

                        {/* Secondary Row: Gender and Verification */}
                        {/* <View className="flex-row items-center justify-center w-full mb-2">
                            {normalizedDoctor.gender ? (
                                <View className="px-3 py-1.5 rounded-full bg-gray-100 mr-2">
                                    <Text className="text-xs font-sans-medium text-gray-700">{normalizedDoctor.gender}</Text>
                                </View>
                            ) : null}
                            {typeof normalizedDoctor.isVerified === 'boolean' ? (
                                <View className={`px-3 py-1.5 rounded-full ${normalizedDoctor.isVerified ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                                    <Text className={`text-xs font-sans-medium ${normalizedDoctor.isVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                                        {normalizedDoctor.isVerified ? 'Verified' : 'Not Verified'}
                                    </Text>
                                </View>
                            ) : null}
                        </View> */}

                        {/* Quick Info Pills */}
                        <View className="flex-row flex-wrap justify-center gap-2 w-full">
                            {normalizedDoctor.availabilityStatus.isAvailable && (
                                <View className="px-3 py-1.5 rounded-full bg-emerald-50">
                                    <Text className="text-xs font-sans-medium text-emerald-700">Available Now</Text>
                                </View>
                            )}
                            {normalizedDoctor.availability?.isAvailableForOnlineConsultations && (
                                <View className="px-3 py-1.5 rounded-full bg-blue-50">
                                    <Text className="text-xs font-sans-medium text-blue-700">Video Call</Text>
                                </View>
                            )}
                            {normalizedDoctor.availability?.isAvailableForHomeVisits && (
                                <View className="px-3 py-1.5 rounded-full bg-purple-50">
                                    <Text className="text-xs font-sans-medium text-purple-700">Home Visit</Text>
                                </View>
                            )}
                            {normalizedDoctor.availability?.isAvailableForInPersonConsultations && (
                                <View className="px-3 py-1.5 rounded-full bg-purple-50">
                                    <Text className="text-xs font-sans-medium text-purple-700">In Person</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* About Section */}
                {normalizedDoctor.bio && (
                    <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                                    <Ionicons name="person-outline" size={16} color="#67A9AF" />
                                </View>
                                <Text className="text-base font-sans-semibold text-gray-900">About</Text>
                            </View>
                            {normalizedDoctor.gender ? (
                                <View className="px-4 py-1.5 rounded-full bg-primary/80 mr-2">
                                    <Text className="text-xs font-sans-medium text-white">{normalizedDoctor.gender}</Text>
                                </View>
                            ) : null}
                        </View>
                        <Text className="text-sm font-sans text-gray-600 leading-6">
                            {normalizedDoctor.bio}
                        </Text>
                    </View>
                )}

                {/* Specialties */}
                {normalizedDoctor.specialties && normalizedDoctor.specialties.length > 0 && (
                    <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                                <Ionicons name="ribbon-outline" size={16} color="#67A9AF" />
                            </View>
                            <Text className="text-base font-sans-semibold text-gray-900">Specialties</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                            {normalizedDoctor.specialties.map((sp, i) => (
                                <View key={`${sp}-${i}`} className="px-3 py-1.5 rounded-full bg-gray-100">
                                    <Text className="text-xs font-sans-medium text-gray-700">{sp}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Languages */}
                {normalizedDoctor.languages && normalizedDoctor.languages.length > 0 && (
                    <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#67A9AF" />
                            </View>
                            <Text className="text-base font-sans-semibold text-gray-900">Languages</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                            {normalizedDoctor.languages.map((lg, i) => (
                                <View key={`${lg}-${i}`} className="px-3 py-1.5 rounded-full bg-gray-100">
                                    <Text className="text-xs font-sans-medium text-gray-700">{lg}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Location & Contact */}
                <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                    <View className="flex-row items-center mb-4">
                        <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                            <Ionicons name="location-outline" size={16} color="#67A9AF" />
                        </View>
                        <Text className="text-base font-sans-semibold text-gray-900">Location & Contact</Text>
                    </View>
                    {(normalizedDoctor.addressLine || normalizedDoctor.city) && (
                        <View className="flex-row items-start mb-3">
                            <Ionicons name="navigate" size={18} color="#9CA3AF" style={{ marginTop: 2 }} />
                            <Text className="ml-3 text-sm font-sans text-gray-700 flex-1 leading-5">
                                {[normalizedDoctor.addressLine, normalizedDoctor.city, normalizedDoctor.state]
                                    .filter(Boolean)
                                    .join(', ')}
                            </Text>
                        </View>
                    )}

                    {normalizedDoctor.phone && (
                        <View className="flex-row items-center">
                            <Ionicons name="call-outline" size={18} color="#9CA3AF" />
                            <Text className="ml-3 text-sm font-sans text-gray-700">{normalizedDoctor.phone}</Text>
                        </View>
                    )}
                </View>

                {/* Consultation Fees */}
                {normalizedDoctor.consultationFees && (
                    <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                        <View className="flex-row items-center mb-4">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                                <Ionicons name="wallet-outline" size={16} color="#67A9AF" />
                            </View>
                            <Text className="text-base font-sans-semibold text-gray-900">Consultation Fees</Text>
                        </View>

                        <View className="space-y-3">
                            {normalizedDoctor.consultationFees.inPerson && (
                                <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-3">
                                            <Ionicons name="person" size={18} color="#3B82F6" />
                                        </View>
                                        <Text className="text-sm font-sans text-gray-700">In-Person Visit</Text>
                                    </View>
                                    <Text className="text-base font-sans-bold" style={{ color: '#67A9AF' }}>
                                        ₦{normalizedDoctor.consultationFees.inPerson.toLocaleString()}
                                    </Text>
                                </View>
                            )}

                            {normalizedDoctor.consultationFees.video && (
                                <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-10 rounded-xl bg-purple-50 items-center justify-center mr-3">
                                            <Ionicons name="videocam" size={18} color="#A855F7" />
                                        </View>
                                        <Text className="text-sm font-sans text-gray-700">Video Consultation</Text>
                                    </View>
                                    <Text className="text-base font-sans-bold" style={{ color: '#67A9AF' }}>
                                        ₦{normalizedDoctor.consultationFees.video.toLocaleString()}
                                    </Text>
                                </View>
                            )}

                            {normalizedDoctor.consultationFees.homeVisit && (
                                <View className="flex-row items-center justify-between py-3">
                                    <View className="flex-row items-center">
                                        <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center mr-3">
                                            <Ionicons name="home" size={18} color="#10B981" />
                                        </View>
                                        <Text className="text-sm font-sans text-gray-700">Home Visit</Text>
                                    </View>
                                    <Text className="text-base font-sans-bold" style={{ color: '#67A9AF' }}>
                                        ₦{normalizedDoctor.consultationFees.homeVisit.toLocaleString()}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Services */}
                {normalizedDoctor.services && normalizedDoctor.services.length > 0 && (
                    <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                        <View className="flex-row items-center mb-4">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                                <Ionicons name="medical-outline" size={16} color="#67A9AF" />
                            </View>
                            <Text className="text-base font-sans-semibold text-gray-900">Services Offered</Text>
                        </View>

                        {normalizedDoctor.services.map((svc, idx) => (
                            <View
                                key={idx}
                                className="bg-gray-50 rounded-xl p-4 mb-3"
                            >
                                <View className="flex-row justify-between items-start mb-2">
                                    <Text className="text-sm font-sans-semibold text-gray-900 flex-1">
                                        {svc.name}
                                    </Text>
                                    {typeof svc.price === 'number' && (
                                        <Text className="text-sm font-sans-bold ml-2" style={{ color: '#67A9AF' }}>
                                            ₦{svc.price.toLocaleString()}
                                        </Text>
                                    )}
                                </View>
                                {svc.description && (
                                    <Text className="text-xs text-gray-600 font-sans mb-2 leading-5">
                                        {svc.description}
                                    </Text>
                                )}
                                {typeof svc.duration === 'number' && (
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                                        <Text className="text-xs font-sans text-gray-500 ml-1">
                                            {svc.duration} minutes
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Availability Schedule */}
                {normalizedDoctor.availability?.workingDays?.length > 0 && (
                    <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                        <View className="flex-row items-center mb-4">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                                <Ionicons name="calendar-outline" size={16} color="#67A9AF" />
                            </View>
                            <Text className="text-base font-sans-semibold text-gray-900">Weekly Schedule</Text>
                        </View>

                        {normalizedDoctor.availability.workingDays.map((day: any, idx: number) => (
                            <View key={idx} className="mb-4 last:mb-0">
                                <Text className="text-sm font-sans-semibold text-gray-900 capitalize mb-2">
                                    {day.day}
                                </Text>
                                {day.slots?.map((slot: any, sIdx: number) => (
                                    <View
                                        key={sIdx}
                                        className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mb-2"
                                    >
                                        <View className="flex-row items-center">
                                            <Ionicons name="time" size={16} color="#67A9AF" />
                                            <Text className="text-sm font-sans text-gray-700 ml-2">
                                                {slot.startTime} - {slot.endTime}
                                            </Text>
                                        </View>
                                        <View
                                            className={`px-3 py-1 rounded-full ${slot.isAvailable ? 'bg-emerald-100' : 'bg-gray-200'
                                                }`}
                                        >
                                            <Text
                                                className={`text-xs font-sans-medium ${slot.isAvailable ? 'text-emerald-700' : 'text-gray-600'
                                                    }`}
                                            >
                                                {slot.isAvailable ? 'Open' : 'Booked'}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                )}

                {/* Education Details (text only) */}
                {(normalizedDoctor.educationDetails && (normalizedDoctor.educationDetails.degree || normalizedDoctor.educationDetails.medicalSchool || normalizedDoctor.educationDetails.graduationYear)) && (
                    <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                                <Ionicons name="school-outline" size={16} color="#67A9AF" />
                            </View>
                            <Text className="text-base font-sans-semibold text-gray-900">Education</Text>
                        </View>
                        {normalizedDoctor.educationDetails.degree && (
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="ribbon" size={16} color="#9CA3AF" />
                                <Text className="ml-2 text-sm font-sans text-gray-700">{normalizedDoctor.educationDetails.degree}</Text>
                            </View>
                        )}
                        {normalizedDoctor.educationDetails.medicalSchool && (
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="business-outline" size={16} color="#9CA3AF" />
                                <Text className="ml-2 text-sm font-sans text-gray-700">{normalizedDoctor.educationDetails.medicalSchool}</Text>
                            </View>
                        )}
                        {normalizedDoctor.educationDetails.graduationYear && (
                            <View className="flex-row items-center">
                                <Ionicons name="calendar-outline" size={16} color="#9CA3AF" />
                                <Text className="ml-2 text-sm font-sans text-gray-700">Graduated {normalizedDoctor.educationDetails.graduationYear}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Internship (text only) */}
                {(normalizedDoctor.internship && (normalizedDoctor.internship.hospitalName || normalizedDoctor.internship.supervisor || normalizedDoctor.internship.startDate || normalizedDoctor.internship.endDate)) && (
                    <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                        <View className="flex-row items-center mb-3">
                            <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                                <Ionicons name="briefcase-outline" size={16} color="#67A9AF" />
                            </View>
                            <Text className="text-base font-sans-semibold text-gray-900">Internship</Text>
                        </View>
                        {normalizedDoctor.internship.hospitalName && (
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="business" size={16} color="#9CA3AF" />
                                <Text className="ml-2 text-sm font-sans text-gray-700">{normalizedDoctor.internship.hospitalName}</Text>
                            </View>
                        )}
                        {normalizedDoctor.internship.supervisor && (
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="person" size={16} color="#9CA3AF" />
                                <Text className="ml-2 text-sm font-sans text-gray-700">Supervisor: {normalizedDoctor.internship.supervisor}</Text>
                            </View>
                        )}
                        {(normalizedDoctor.internship.startDate || normalizedDoctor.internship.endDate) && (
                            <View className="flex-row items-center">
                                <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                                <Text className="ml-2 text-sm font-sans text-gray-700">
                                    {formatDate(normalizedDoctor.internship.startDate)}
                                    {normalizedDoctor.internship.endDate ? ` - ${formatDate(normalizedDoctor.internship.endDate)}` : ''}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Reviews Section */}
                {doctorRaw?.reviews && doctorRaw.reviews.length > 0 && (
                    <View className="bg-white mx-4 mt-3 rounded-2xl p-5 shadow-sm">
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: '#E8F4F5' }}>
                                    <Ionicons name="star" size={16} color="#67A9AF" />
                                </View>
                                <Text className="text-base font-sans-semibold text-gray-900">
                                    Patient Reviews ({doctorRaw.reviews.length})
                                </Text>
                            </View>
                            <TouchableOpacity>
                                <Text className="text-xs font-sans-medium" style={{ color: '#67A9AF' }}>
                                    View All
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {doctorRaw.reviews.slice(0, 3).map((review: any, idx: number) => (
                            <View
                                key={review._id || idx}
                                className="bg-gray-50 rounded-xl p-4 mb-3 last:mb-0"
                            >
                                <View className="flex-row items-start mb-2">
                                    <Image
                                        source={{
                                            uri: review.patient?.avatar ||
                                                `https://ui-avatars.com/api/?name=${encodeURIComponent(review.patient?.name || 'U')}&background=67A9AF&color=fff`
                                        }}
                                        className="w-10 h-10 rounded-full mr-3 bg-gray-200"
                                    />
                                    <View className="flex-1">
                                        <Text className="text-sm font-sans-semibold text-gray-900 mb-1">
                                            {review.patient?.name || 'Anonymous'}
                                        </Text>
                                        <View className="flex-row items-center justify-between">
                                            <View className="flex-row">{renderStars(review.rating || 0)}</View>
                                            <Text className="text-xs font-sans text-gray-400">
                                                {new Date(review.date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                                <Text className="text-sm font-sans text-gray-600 leading-5">
                                    {review.comment}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <View className="h-32" />
            </ScrollView>

            {/* Fixed Bottom Action Bar */}
            <View className="absolute bottom-0 left-0 right-0 bg-white px-4 py-4 border-t border-gray-100 shadow-lg">
                <View className="flex-row gap-2">
                    {/* <TouchableOpacity 
                        className="flex-1 flex-row items-center justify-center py-3.5 rounded-xl border border-gray-200 bg-white"
                        onPress={() => {}}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#67A9AF" />
                        <Text className="ml-2 font-sans-semibold text-sm" style={{ color: '#67A9AF' }}>
                        Message
                        </Text>
                    </TouchableOpacity> */}

                    <TouchableOpacity
                        className="flex-1 flex-row items-center justify-center py-3.5 rounded-xl"
                        style={{ backgroundColor: '#67A9AF' }}
                        onPress={handleBookAppointment}
                    >
                        <Ionicons name="calendar" size={20} color="#fff" />
                        <Text className="ml-2 font-sans-semibold text-sm text-white">
                            Book Now
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView >
    );
}