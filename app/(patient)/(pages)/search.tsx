import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Animated,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { getAllDoctors } from '@/api/patient/user';
import * as Location from 'expo-location';
import {
    transformDoctorData,
    filterDoctors,
    sortDoctorsByDistance,
    sortDoctorsByAvailability,
    TransformedDoctor,
} from '@/utils/getDoctorUtils';

const { height } = Dimensions.get('window');

export default function Search() {
    const { user, token } = useAuth();
    const { showToast } = useToast();
    const params = useLocalSearchParams();

    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [searchQuery, setSearchQuery] = useState<string>(params.query as string || '');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedDoctor, setSelectedDoctor] = useState<TransformedDoctor | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [rawDoctors, setRawDoctors] = useState<any[]>([]);
    const [transformedDoctors, setTransformedDoctors] = useState<TransformedDoctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState({
        latitude: 6.5244,
        longitude: 3.3792,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });
    const [locationPermission, setLocationPermission] = useState(false);

    const bottomSheetAnim = useRef(new Animated.Value(height)).current;
    const scanningAnim = useRef(new Animated.Value(0)).current;
    const mapRef = useRef<MapView>(null);

    // Request location permission and get user's current location
    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showToast('Location permission is required to find nearby doctors', 'error');
                setLocationPermission(false);
                return;
            }

            setLocationPermission(true);
            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            });
        } catch (error) {
            console.error('Error getting location:', error);
            showToast('Failed to get your location', 'error');
        }
    };

    // Fetch doctors
    useEffect(() => {
        fetchDoctors();
    }, []);

    // Transform doctors when raw data or location changes
    useEffect(() => {
        if (rawDoctors.length > 0) {
            const transformed = rawDoctors.map(doctor =>
                transformDoctorData(
                    doctor,
                    userLocation.latitude,
                    userLocation.longitude,
                    doctor?.profileImage?.url
                )
            );
            // Sort by distance by default
            setTransformedDoctors(sortDoctorsByDistance(transformed));
        }
    }, [rawDoctors, userLocation]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllDoctors(token as string);

            if (response.success) {
                setRawDoctors(response.data);
            } else {
                setError('Failed to fetch doctors');
                showToast('Failed to fetch doctors', 'error');
            }
        } catch (err: any) {
            console.error('Error fetching doctors:', err);
            setError(err.message || 'An error occurred while fetching doctors');
            showToast(err.message || 'Failed to fetch doctors', 'error');
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 0, title: 'All', icon: 'apps' },
        { id: 1, title: 'General', icon: 'person' },
        { id: 2, title: 'Dentist', icon: 'medkit' },
        { id: 3, title: 'Surgeon', icon: 'cut' },
        { id: 4, title: 'Pediatrician', icon: 'heart' },
        { id: 5, title: 'Dermatologist', icon: 'body' },
        { id: 6, title: 'Cardiologist', icon: 'heart-circle' },
        { id: 7, title: 'Gynecologist', icon: 'female' },
        { id: 8, title: 'Neurologist', icon: 'fitness' },
    ];

    const renderStars = (rating: number) => (
        <View className="flex-row items-center">
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text className="text-xs font-sans text-gray-600 ml-1">{rating.toFixed(1)}</Text>
        </View>
    );

    const filteredDoctors = React.useMemo(() => {
        return filterDoctors(transformedDoctors, searchQuery, selectedCategory, viewMode);
    }, [searchQuery, selectedCategory, viewMode, transformedDoctors]);

    // Scanning animation
    useEffect(() => {
        if (isScanning) {
            Animated.loop(
                Animated.timing(scanningAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            scanningAnim.setValue(0);
        }
    }, [isScanning]);

    // Bottom sheet animation
    const showBottomSheet = () => {
        Animated.spring(bottomSheetAnim, {
            toValue: height * 0.5,
            useNativeDriver: false,
            tension: 50,
            friction: 8,
        }).start();
    };

    const hideBottomSheet = () => {
        Animated.spring(bottomSheetAnim, {
            toValue: height,
            useNativeDriver: false,
        }).start();
    };

    // Handle map search and recommendation
    useEffect(() => {
        if (viewMode === 'map') {
            if (searchQuery.trim() !== '') {
                setIsScanning(true);
                setSelectedDoctor(null);
                hideBottomSheet();

                const timer = setTimeout(() => {
                    setIsScanning(false);
                    const matchingDoctors = filteredDoctors;

                    if (matchingDoctors.length > 0) {
                        // Sort by availability, then distance
                        const sortedDoctors = sortDoctorsByAvailability(matchingDoctors);
                        const recommendedDoctor = sortedDoctors[0];
                        setSelectedDoctor(recommendedDoctor);
                        showBottomSheet();

                        // Animate to doctor location
                        mapRef.current?.animateToRegion({
                            latitude: recommendedDoctor.latitude,
                            longitude: recommendedDoctor.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }, 1000);
                    }
                }, 2000);

                return () => clearTimeout(timer);
            } else {
                setSelectedDoctor(null);
                hideBottomSheet();
            }
        }
    }, [searchQuery, viewMode, filteredDoctors]);

    const handleDoctorMarkerPress = (doctor: TransformedDoctor) => {
        setSelectedDoctor(doctor);
        showBottomSheet();
        mapRef.current?.animateToRegion({
            latitude: doctor.latitude,
            longitude: doctor.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        }, 500);
    };

    const DoctorCard = ({ doctor }: { doctor: TransformedDoctor }) => (
        <TouchableOpacity
            onPress={() => {
                // Navigate to doctor details
                // router.push(`/doctor/${doctor._id}`);
            }}
            className="bg-white rounded-2xl p-4 mb-4 shadow-sm mx-2"
        >
            <View className="flex-row">
                <Image
                    source={{ uri: doctor.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName || 'U')}&background=67A9AF&color=fff` }}
                    className="w-28 h-28 rounded-xl"
                    resizeMode="cover"
                />
                <View className="flex-1 ml-4">
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-lg font-sans-semibold text-gray-900" numberOfLines={1}>
                            {doctor.title} {doctor.fullName}
                        </Text>
                        {renderStars(doctor.rating)}
                    </View>
                    <Text className="text-gray-600 font-sans text-sm mb-1">{doctor.speciality}</Text>
                    {doctor.workHospitalName && (
                        <Text className="text-gray-500 font-sans text-xs mb-1" numberOfLines={1}>
                            {doctor.workHospitalName}
                        </Text>
                    )}
                    <Text className="text-gray-400 font-sans text-xs mb-1">{doctor.yearsOfExperience} years experience</Text>

                    {/* Distance and Availability */}
                    <View className="flex-row items-center gap-3 mb-2">
                        <View className="flex-row items-center gap-1">
                            <Ionicons name="location" size={12} color="#6B7280" />
                            <Text className="text-xs font-sans text-gray-500">{doctor.distance}</Text>
                        </View>
                        <View className={`px-2 py-0.5 rounded-full ${doctor.availabilityStatus.isAvailable ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                            <Text className={`text-xs font-sans-medium ${doctor.availabilityStatus.isAvailable ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                {doctor.availability}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-secondary font-sans-bold text-base">₦{doctor.consultationFee}</Text>
                            <Text className="text-gray-500 font-sans text-xs">Per Consultation</Text>
                        </View>
                        <TouchableOpacity className="bg-primary px-6 py-2 rounded-lg">
                            <Text className="text-white font-sans-medium text-sm">Consult now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#67A9AF" />
                <Text className="text-gray-600 font-sans-medium mt-4">Loading doctors...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View className="bg-white px-4 py-3">
                <View className="flex-row items-center gap-3 mb-3">
                    <TouchableOpacity onPress={() => router.back()} className="bg-white rounded-full p-2 shadow-sm">
                        <Ionicons name="chevron-back" size={20} color="#374151" />
                    </TouchableOpacity>
                    <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
                        <TextInput
                            className="flex-1 text-gray-800 text-sm font-sans-medium"
                            placeholder="Search doctors, specialists, hospitals..."
                            placeholderTextColor="#9CA3AF"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <Ionicons name="search" size={18} color="#D65C1E" />
                    </View>
                </View>

                {/* View Mode Toggle */}
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={() => setViewMode('list')}
                        className={`flex-1 py-2 px-4 rounded-full flex-row items-center justify-center gap-2 ${viewMode === 'list' ? 'bg-primary' : 'bg-gray-100'
                            }`}
                    >
                        <Ionicons name="list" size={16} color={viewMode === 'list' ? '#fff' : '#6B7280'} />
                        <Text className={`text-sm font-sans-medium ${viewMode === 'list' ? 'text-white' : 'text-gray-600'}`}>
                            List View
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setViewMode('map')}
                        className={`flex-1 py-2 px-4 rounded-full flex-row items-center justify-center gap-2 ${viewMode === 'map' ? 'bg-primary' : 'bg-gray-100'
                            }`}
                    >
                        <Ionicons name="map" size={16} color={viewMode === 'map' ? '#fff' : '#6B7280'} />
                        <Text className={`text-sm font-sans-medium ${viewMode === 'map' ? 'text-white' : 'text-gray-600'}`}>
                            Map View
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {viewMode === 'list' ? (
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingTop: 16 }}
                >
                    {/* Categories */}
                    <Text className="text-lg font-sans-semibold text-gray-900 mb-4 px-4">Categories</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-6"
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                    >
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                onPress={() => {
                                    setSelectedCategory(category.title);
                                    setSearchQuery('');
                                }}
                                className={`flex-row items-center px-6 py-3 rounded-xl mr-3 ${selectedCategory === category.title
                                    ? 'bg-[#67A9AF33]/20 border border-[#67A9AF33]/20'
                                    : 'bg-white border border-gray-200'
                                    }`}
                            >
                                <Ionicons
                                    name={category.icon as any}
                                    size={16}
                                    color={selectedCategory === category.title ? '#67A9AF' : '#6B7280'}
                                />
                                <Text
                                    className={`ml-2 text-sm font-sans-medium ${selectedCategory === category.title ? 'text-[#67A9AF]' : 'text-gray-600'
                                        }`}
                                >
                                    {category.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Doctor Cards */}
                    {filteredDoctors.length > 0 ? (
                        filteredDoctors.map((doctor) => <DoctorCard key={doctor._id} doctor={doctor} />)
                    ) : (
                        <View className="items-center justify-center mt-20">
                            <Ionicons name="search-outline" size={50} color="#9CA3AF" />
                            <Text className="text-gray-500 font-sans-medium mt-4 text-base">
                                No results found
                            </Text>
                        </View>
                    )}
                    <View className="h-8" />
                </ScrollView>
            ) : (
                <View className="flex-1 relative">
                    {/* Map View with Custom Styling */}
                    <MapView
                        ref={mapRef}
                        style={{ flex: 1 }}
                        initialRegion={userLocation}
                        showsUserLocation
                        showsMyLocationButton={false}
                        showsCompass={false}
                        showsScale={false}
                        customMapStyle={[
                            { featureType: "all", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                            { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9e6ea" }] },
                            { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#67a9af" }] },
                            { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
                            { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#e0e0e0" }] },
                            { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
                            { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5f5e0" }] }
                        ]}
                    >

                        {/* Doctor Markers */}
                        {filteredDoctors.map((doctor) => (
                            <Marker
                                key={doctor._id}
                                coordinate={{
                                    latitude: doctor.latitude,
                                    longitude: doctor.longitude,
                                }}
                                onPress={() => handleDoctorMarkerPress(doctor)}
                            >
                                <View className="items-center">
                                    <View
                                        className={`w-12 h-12 rounded-full items-center justify-center ${selectedDoctor?._id === doctor._id ? 'bg-secondary' : 'bg-primary'
                                            }`}
                                        style={{ borderWidth: 3, borderColor: '#fff' }}
                                    >
                                        <Image
                                            source={{ uri: doctor.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(doctor.fullName || 'U')}&background=67A9AF&color=fff` }}
                                            className="w-full h-full rounded-full"
                                            resizeMode="cover"
                                        />
                                    </View>
                                    <View className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                </View>
                            </Marker>
                        ))}
                    </MapView>

                    {/* Scanning Overlay */}
                    {isScanning && (
                        <View className="absolute inset-0 items-center justify-center bg-black/20">
                            <View className="bg-white px-6 py-4 rounded-2xl shadow-xl items-center">
                                <Animated.View
                                    style={{
                                        transform: [
                                            {
                                                rotate: scanningAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0deg', '360deg'],
                                                }),
                                            },
                                        ],
                                    }}
                                >
                                    <Ionicons name="scan" size={40} color="#67A9AF" />
                                </Animated.View>
                                <Text className="font-sans-semibold text-gray-800 mt-3">Scanning for doctors...</Text>
                                <Text className="font-sans text-sm text-gray-500 mt-1">Finding the best match for you</Text>
                            </View>
                        </View>
                    )}

                    {/* Empty State - No Search */}
                    {/* {!isScanning && searchQuery.trim() === '' && (
                        <View className="absolute inset-0 items-center justify-center bg-white/95">
                            <View className="items-center px-6">
                                <View className="bg-primary/10 p-6 rounded-full mb-4">
                                    <Ionicons name="search" size={60} color="#67A9AF" />
                                </View>
                                <Text className="font-sans-bold text-xl text-gray-800 mb-2">Find Doctors Near You</Text>
                                <Text className="font-sans text-gray-500 text-center mb-6">
                                    Search for doctors by name, specialty, or hospital to see them on the map
                                </Text>
                                <View className="flex-row flex-wrap justify-center gap-2">
                                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                                        <Text className="text-primary font-sans-medium text-xs">Cardiologist</Text>
                                    </View>
                                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                                        <Text className="text-primary font-sans-medium text-xs">Dentist</Text>
                                    </View>
                                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                                        <Text className="text-primary font-sans-medium text-xs">Pediatrician</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )} */}

                    {/* No Results State */}
                    {!isScanning && searchQuery.trim() !== '' && filteredDoctors.length === 0 && (
                        <View className="absolute inset-0 items-center justify-center bg-white/95">
                            <View className="items-center px-6">
                                <View className="bg-gray-100 p-6 rounded-full mb-4">
                                    <Ionicons name="sad-outline" size={60} color="#9CA3AF" />
                                </View>
                                <Text className="font-sans-bold text-xl text-gray-800 mb-2">No Doctors Found</Text>
                                <Text className="font-sans text-gray-500 text-center mb-4">
                                    We couldn't find any doctors matching "{searchQuery}"
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setSearchQuery('')}
                                    className="bg-primary px-6 py-3 rounded-full"
                                >
                                    <Text className="text-white font-sans-semibold">Clear Search</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Results Count */}
                    {!isScanning && filteredDoctors.length > 0 && (
                        <View className="absolute top-4 left-4 bg-white px-4 py-2 rounded-full shadow-lg flex-row items-center">
                            <View className="w-2 h-2 bg-primary rounded-full mr-2" />
                            <Text className="text-sm font-sans-medium">
                                <Text className="text-primary font-sans-bold">{filteredDoctors.length}</Text> {filteredDoctors.length === 1 ? 'doctor' : 'doctors'} nearby
                            </Text>
                        </View>
                    )}

                    {/* My Location Button */}
                    <TouchableOpacity
                        className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-lg"
                        onPress={() => {
                            mapRef.current?.animateToRegion(userLocation, 1000);
                        }}
                    >
                        <Ionicons name="navigate" size={20} color="#67A9AF" />
                    </TouchableOpacity>

                    {/* Bottom Sheet */}
                    {selectedDoctor && (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: bottomSheetAnim.interpolate({
                                    inputRange: [0, height],
                                    outputRange: [height, 0],
                                }),
                            }}
                            className="bg-white rounded-t-3xl shadow-2xl"
                        >
                            {/* Handle */}
                            <View className="items-center pt-3 pb-2">
                                <View className="w-12 h-1 bg-gray-300 rounded-full" />
                            </View>

                            <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                                {/* Recommended Badge */}
                                <View className="items-center mb-3">
                                    <View className="bg-secondary px-4 py-1 rounded-full">
                                        <Text className="text-white text-xs font-sans-semibold">🎯 Recommended for you</Text>
                                    </View>
                                </View>

                                {/* Doctor Info */}
                                <View className="flex-row gap-4 mb-4">
                                    <Image
                                        source={{ uri: selectedDoctor.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedDoctor.fullName || 'U')}&background=67A9AF&color=fff` }}
                                        className="w-20 h-20 rounded-xl"
                                        resizeMode="cover"
                                    />
                                    <View className="flex-1">
                                        <Text className="font-sans-bold text-lg">{selectedDoctor.title}{selectedDoctor.fullName}</Text>
                                        <Text className="text-gray-600 font-sans text-sm">{selectedDoctor.speciality}</Text>
                                        <Text className="text-gray-500 font-sans text-xs">{selectedDoctor.workHospitalName}</Text>
                                        <View className="flex-row items-center gap-3 mt-2">
                                            {renderStars(selectedDoctor.rating || 0)}
                                            <View className="flex-row items-center gap-1">
                                                <Ionicons name="location" size={12} color="#6B7280" />
                                                <Text className="text-xs font-sans text-gray-500">{selectedDoctor.distance}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Info Cards */}
                                <View className="flex-row gap-3 mb-4">
                                    <View className="flex-1 bg-blue-50 p-3 rounded-xl">
                                        <Text className="text-gray-600 font-sans text-xs mb-1">Experience</Text>
                                        <Text className="font-sans-semibold text-sm">{selectedDoctor.yearsOfExperience} years Experience</Text>
                                    </View>
                                    <View className="flex-1 bg-green-50 p-3 rounded-xl">
                                        <Text className="text-gray-600 font-sans text-xs mb-1">Availability</Text>
                                        <Text className="font-sans-semibold text-sm text-green-600">{selectedDoctor.availability}</Text>
                                    </View>
                                </View>

                                {/* Consultation Fee */}
                                <View className="bg-orange-50 p-4 rounded-xl mb-4">
                                    <View className="flex-row items-center justify-between">
                                        <View>
                                            <Text className="text-gray-600 font-sans text-xs mb-1">Consultation Fee</Text>
                                            <Text className="font-sans-bold text-2xl text-secondary">{selectedDoctor.consultationFee}</Text>
                                        </View>
                                        <View>
                                            <Text className="text-xs font-sans text-gray-500 text-right">Per Session</Text>
                                            <Text className="text-xs font-sans-medium text-green-600 mt-1">✓ Insurance accepted</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Action Buttons */}
                                <View className="flex-row gap-3 mb-3">
                                    <TouchableOpacity className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2">
                                        <Ionicons name="calendar" size={20} color="#fff" />
                                        <Text className="text-white font-sans-semibold">Book Appointment</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedDoctor(null);
                                        hideBottomSheet();
                                    }}
                                    className="bg-gray-100 py-3 rounded-xl mb-4"
                                >
                                    <Text className="text-gray-600 font-sans-medium text-center">View Other Doctors</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        </Animated.View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}