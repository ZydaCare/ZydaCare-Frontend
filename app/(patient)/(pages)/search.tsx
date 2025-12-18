import { getAllDoctors } from '@/api/patient/user';
import { useToast } from '@/components/ui/Toast';
import { BASE_URL } from '@/config';
import {
    filterDoctors,
    sortDoctorsByAvailability,
    transformDoctorData,
    TransformedDoctor
} from '@/utils/getDoctorUtils';
import { useLocationTracking } from '@/utils/useLocationTracking';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Image,
    PanResponder,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

const { height } = Dimensions.get('window');

export default function Search() {
    // const { user, token } = useAuth();
    const { showToast } = useToast();
    const params = useLocalSearchParams();
    const [searchQuery, setSearchQuery] = useState<string>(params.query as string || '');
    const [selectedCategory, setSelectedCategory] = useState<string>(params.category as string || 'All');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
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
    const [mapReady, setMapReady] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    const bottomSheetAnim = useRef(new Animated.Value(height)).current;
    const scanningAnim = useRef(new Animated.Value(0)).current;
    const webViewRef = useRef<WebView>(null);
    const {
        isConnected: trackingConnected,
        activeDoctors: liveActiveDoctors,
        requestDoctorLocations: requestLiveDoctors,
        subscribeToDoctor,
        unsubscribeFromDoctor,
    } = useLocationTracking(`${BASE_URL}`, true); // Replace with your server URL

    const [showLiveDoctors, setShowLiveDoctors] = useState(false);
    const [subscribedDoctors, setSubscribedDoctors] = useState<Set<string>>(new Set());
    const [nearestDoctorsRadius, setNearestDoctorsRadius] = useState(10); // km
    const [mapDoctors, setMapDoctors] = useState<TransformedDoctor[]>([]);

    // const [token, setToken] = useState<string | null>(null);

    // useEffect(() => {
    //     const loadToken = async () => {
    //         try {
    //             const storedToken = await AsyncStorage.getItem('token');
    //             setToken(storedToken);
    //         } catch (error) {
    //             console.error('Error loading token:', error);
    //         }
    //     };

    //     loadToken();
    // }, []);

    useEffect(() => {
        if (viewMode === 'map' && transformedDoctors.length > 0) {
            // Get only nearest doctors within radius
            const nearest = getNearestDoctors(
                transformedDoctors,
                nearestDoctorsRadius,
                showLiveDoctors ? liveActiveDoctors : []
            );
            setMapDoctors(nearest);
            console.log(`Showing ${nearest.length} nearest doctors within ${nearestDoctorsRadius}km`);
        }
    }, [viewMode, transformedDoctors, nearestDoctorsRadius, showLiveDoctors, liveActiveDoctors]);

    const getNearestDoctors = (
        doctors: TransformedDoctor[],
        radiusKm: number,
        liveDoctors: any[]
    ): TransformedDoctor[] => {
        // Filter doctors with valid coordinates
        const validDoctors = doctors.filter(d =>
            d.latitude !== 0 &&
            d.longitude !== 0 &&
            !isNaN(d.latitude) &&
            !isNaN(d.longitude)
        );

        // If showing live doctors, prioritize them
        if (showLiveDoctors && liveDoctors.length > 0) {
            const liveDoctorIds = new Set(liveDoctors.map(d => d.doctorId));
            const live = validDoctors.filter(d => liveDoctorIds.has(d._id));
            const others = validDoctors
                .filter(d => !liveDoctorIds.has(d._id) && d.distanceKm <= radiusKm)
                .sort((a, b) => a.distanceKm - b.distanceKm)
                .slice(0, 5); // Only show 5 nearest non-live doctors

            return [...live, ...others];
        }

        // Otherwise, show doctors within radius, sorted by distance
        return validDoctors
            .filter(d => d.distanceKm <= radiusKm)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 10); // Limit to 10 nearest doctors
    };

    // 4. Add effect to update map with live doctors
    useEffect(() => {
        if (mapReady && viewMode === 'map' && showLiveDoctors && liveActiveDoctors.length > 0) {
            updateMapWithLiveDoctors();
        }
    }, [liveActiveDoctors, mapReady, viewMode, showLiveDoctors]);

    const updateMapWithNearestDoctors = (doctors: TransformedDoctor[], userLoc: { latitude: number; longitude: number }) => {
    // Create markers for each doctor
    const doctorMarkers = doctors.map(doc => ({
      id: doc._id,
      lat: doc.latitude,
      lng: doc.longitude,
      name: doc.fullName,
      title: doc.title,
      specialty: doc.speciality,
      image: doc.profileImage?.url || null,
      rating: doc.rating,
      distance: formatDistance(doc.distanceKm * 1000), // Convert km to meters for formatting
      available: doc.availabilityStatus?.isAvailable || false,
      isLive: false,
    }));

    const data = {
      userLat: userLoc.latitude,
      userLng: userLoc.longitude,
      doctors: doctorMarkers,
      userLocation: {
        lat: userLoc.latitude,
        lng: userLoc.longitude,
        name: 'Your Location',
        isUser: true,
      },
    };

    webViewRef.current?.postMessage(JSON.stringify({
      type: 'updateMarkers',
      data
    }));
  };

  const updateMapWithLiveDoctors = () => {
        const liveDoctorMarkers = liveActiveDoctors.map(doc => ({
            id: doc.doctorId,
            lat: doc.latitude,
            lng: doc.longitude,
            name: doc.doctorInfo.fullName,
            specialty: doc.doctorInfo.speciality,
            image: doc.doctorInfo.profileImage,
            isLive: true,
            lastUpdate: doc.timestamp,
            distance: doc.distance ? formatDistance(doc.distance) : 'N/A',
            available: true,
        }));

        // Add nearby non-live doctors
        const nearbyDoctors = mapDoctors
            .filter(doc => !liveActiveDoctors.some(d => d.doctorId === doc._id))
            .slice(0, 5)
            .map(doc => ({
                id: doc._id,
                lat: doc.latitude,
                lng: doc.longitude,
                name: doc.fullName,
                title: doc.title,
                specialty: doc.speciality,
                image: doc.profileImage?.url || null,
                rating: doc.rating,
                distance: doc.distance,
                available: doc.availabilityStatus?.isAvailable || false,
                isLive: false,
            }));

        const allDoctors = showLiveDoctors
            ? [...liveDoctorMarkers, ...nearbyDoctors]
            : nearbyDoctors;

        const data = {
            userLat: userLocation.latitude,
            userLng: userLocation.longitude,
            doctors: allDoctors,
            userLocation: {
                lat: userLocation.latitude,
                lng: userLocation.longitude,
                name: 'Your Location',
                isUser: true,
            },
        };

        webViewRef.current?.postMessage(JSON.stringify({
            type: 'updateMarkers',
            data
        }));
    };

    const toggleLiveTracking = async () => {
        setShowLiveDoctors(!showLiveDoctors);
        if (!showLiveDoctors && trackingConnected) {
            await requestLiveDoctors(50);
        }
    };

    // 7. Add function to subscribe to doctor
    const handleSubscribeToDoctor = async (doctorId: string) => {
        const success = await subscribeToDoctor(doctorId);
        if (success) {
            setSubscribedDoctors(prev => new Set([...prev, doctorId]));
        }
    };

    // 8. Add function to unsubscribe from doctor
    const handleUnsubscribeFromDoctor = async (doctorId: string) => {
        const success = await unsubscribeFromDoctor(doctorId);
        if (success) {
            setSubscribedDoctors(prev => {
                const newSet = new Set(prev);
                newSet.delete(doctorId);
                return newSet;
            });
        }
    };


    // Request location permission and get user's current location
    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            setLocationLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showToast('Location permission is required to find nearby doctors', 'error');
                setLocationPermission(false);
                return;
            }

            setLocationPermission(true);
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            const newLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };

            setUserLocation(newLocation);

            // If we're in map view, center on new location
            if (viewMode === 'map' && mapReady) {
                webViewRef.current?.postMessage(JSON.stringify({
                    type: 'flyTo',
                    data: {
                        lat: newLocation.latitude,
                        lng: newLocation.longitude,
                        zoom: 14
                    }
                }));
            }
        } catch (error) {
            console.error('Error getting location:', error);
            showToast('Failed to get your location', 'error');
        } finally {
            setLocationLoading(false);
        }
    };

    useEffect(() => {
        if (params.category) {
            setSelectedCategory(params.category as string);
            setSearchQuery(''); // Clear search when category is selected
        }
        if (params.query) {
            setSearchQuery(params.query as string);
            setSelectedCategory('All'); // Reset category when searching
        }
    }, [params.category, params.query]);

    // Fetch doctors
    useEffect(() => {
        fetchDoctors();
    }, []);

    // Transform doctors when raw data or location changes
    useEffect(() => {
        if (rawDoctors.length > 0) {
            const transformed = rawDoctors
                .map(doctor => {
                    const result = transformDoctorData(
                        doctor,
                        userLocation.latitude,
                        userLocation.longitude
                    );
                    return result;
                })
                // Filter out doctors without valid location
                .filter(doctor =>
                    doctor.latitude &&
                    doctor.longitude &&
                    !isNaN(doctor.latitude) &&
                    !isNaN(doctor.longitude)
                )
                // Sort by distance
                .sort((a, b) => {
                    const distA = a.distance?.value || Number.MAX_SAFE_INTEGER;
                    const distB = b.distance?.value || Number.MAX_SAFE_INTEGER;
                    return distA - distB;
                });

            console.log(`Found ${transformed.length} doctors with valid locations`);
            setTransformedDoctors(transformed);
        }
    }, [rawDoctors, userLocation]);

    const fetchDoctors = async () => {
        const token = await AsyncStorage.getItem('token');
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
        { id: 0, title: 'All', icon: 'medical' },
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
            toValue: height * 0.46,
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

    const panY = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    panY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                    setSelectedDoctor(null);
                    hideBottomSheet();
                    panY.setValue(0);
                } else {
                    Animated.spring(panY, {
                        toValue: 0,
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    // Update map when doctors or user location changes
    useEffect(() => {
        if (mapReady && viewMode === 'map' && filteredDoctors.length > 0) {
            console.log('Updating map with doctors:', filteredDoctors.length);
            updateMapMarkers();
        }
    }, [filteredDoctors, userLocation, mapReady, viewMode]);

    const updateMapMarkers = () => {
        if (!userLocation.latitude || !userLocation.longitude) return;

        const doctors = mapDoctors.map(doc => {
            // Check if doctor is live
            const isLive = liveActiveDoctors.some(d => d.doctorId === doc._id);
            const liveDoc = liveActiveDoctors.find(d => d.doctorId === doc._id);

            return {
                id: doc._id,
                lat: isLive && liveDoc ? liveDoc.latitude : doc.latitude,
                lng: isLive && liveDoc ? liveDoc.longitude : doc.longitude,
                name: doc.fullName,
                title: doc.title,
                specialty: doc.speciality,
                image: doc.profileImage?.url || null,
                rating: doc.rating,
                distance: doc.distance,
                available: doc.availabilityStatus?.isAvailable || false,
                isLive: isLive
            };
        });

        const data = {
            userLat: userLocation.latitude,
            userLng: userLocation.longitude,
            doctors: doctors,
            userLocation: {
                lat: userLocation.latitude,
                lng: userLocation.longitude,
                name: 'Your Location',
                isUser: true
            }
        };

        console.log('Updating map with', doctors.length, 'doctors');
        webViewRef.current?.postMessage(JSON.stringify({
            type: 'updateMarkers',
            data
        }));
    };

    // Handle map search and recommendation
    useEffect(() => {
        if (viewMode === 'map' && searchQuery.trim() !== '') {
            setIsScanning(true);
            setSelectedDoctor(null);
            hideBottomSheet();

            const timer = setTimeout(() => {
                setIsScanning(false);

                // Search in all doctors, not just map doctors
                const matchingDoctors = filterDoctors(
                    transformedDoctors,
                    searchQuery,
                    selectedCategory,
                    viewMode
                );

                if (matchingDoctors.length > 0) {
                    // Sort by availability and distance
                    const sortedDoctors = sortDoctorsByAvailability(matchingDoctors);
                    const recommendedDoctor = sortedDoctors[0];

                    // Check if doctor is live
                    const liveDoctor = liveActiveDoctors.find(d => d.doctorId === recommendedDoctor._id);

                    setSelectedDoctor(recommendedDoctor);
                    showBottomSheet();

                    // Navigate to doctor's location (use live location if available)
                    const targetLat = liveDoctor ? liveDoctor.latitude : recommendedDoctor.latitude;
                    const targetLng = liveDoctor ? liveDoctor.longitude : recommendedDoctor.longitude;

                    webViewRef.current?.postMessage(JSON.stringify({
                        type: 'flyTo',
                        data: {
                            lat: targetLat,
                            lng: targetLng,
                            zoom: 15
                        }
                    }));

                    // Temporarily add this doctor to the map if not already there
                    if (!mapDoctors.find(d => d._id === recommendedDoctor._id)) {
                        setMapDoctors(prev => [...prev, recommendedDoctor]);
                    }
                } else {
                    showToast('No doctors found matching your search', 'info');
                }
            }, 2000);

            return () => clearTimeout(timer);
        } else if (viewMode === 'map' && searchQuery.trim() === '') {
            setSelectedDoctor(null);
            hideBottomSheet();
        }
    }, [searchQuery, viewMode, transformedDoctors]);

    const handleDoctorMarkerPress = (doctorId: string) => {
        // Check if it's a live doctor first
        const liveDoctor = liveActiveDoctors.find(d => d.doctorId === doctorId);

        let doctor: TransformedDoctor | undefined;

        if (liveDoctor) {
            // Find the doctor profile
            doctor = transformedDoctors.find(d => d._id === doctorId);
            if (doctor) {
                // Update with live location
                doctor = {
                    ...doctor,
                    latitude: liveDoctor.latitude,
                    longitude: liveDoctor.longitude,
                    distance: liveDoctor.distance
                        ? formatDistance(liveDoctor.distance)
                        : doctor.distance
                };
            }
        } else {
            doctor = mapDoctors.find(d => d._id === doctorId);
        }

        if (doctor) {
            setSelectedDoctor(doctor);
            showBottomSheet();
            webViewRef.current?.postMessage(JSON.stringify({
                type: 'flyTo',
                data: {
                    lat: doctor.latitude,
                    lng: doctor.longitude,
                    zoom: 15
                }
            }));
        }
    };

    const formatDistance = (km: number): string => {
        if (km < 1) {
            return `${Math.round(km * 1000)}m`;
        }
        return `${km.toFixed(1)}km`;
    };

    const ViewDoctorProfile = () => {
        if (selectedDoctor) {
            router.push({
                pathname: '/doctor/[id]',
                params: { id: selectedDoctor._id }
            });
        }
    };

    const centerMapOnUser = async () => {
        try {
            setLocationLoading(true);
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High
            });

            const newLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            };

            setUserLocation(newLocation);

            webViewRef.current?.postMessage(JSON.stringify({
                type: 'flyTo',
                data: {
                    lat: newLocation.latitude,
                    lng: newLocation.longitude,
                    zoom: 14
                }
            }));
        } catch (error) {
            console.error('Error centering on user location:', error);
            showToast('Failed to get your current location', 'error');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleBookAppointment = () => {
        if (selectedDoctor) {
            router.push({
                pathname: '/appointment/book',
                params: { doctorId: selectedDoctor._id },
            });
        }
    };

    const DoctorCard = ({ doctor }: { doctor: TransformedDoctor }) => (
        <TouchableOpacity
            onPress={() => {
                ViewDoctorProfile();
                router.push(`/(patient)/(pages)/doctor/${doctor._id}`);
            }}
            className="bg-white rounded-2xl p-4 mb-4 shadow-sm mx-2"
        >
            <View className="flex-row">
                {doctor.profileImage ? (
                    <Image
                        source={{ uri: doctor.profileImage?.url }}
                        className="w-28 h-28 rounded-xl"
                        resizeMode="cover"
                    />
                ) : (
                    <View className="w-28 h-28 rounded-xl items-center justify-center bg-primary/10">
                        <Ionicons name="person" size={40} color='#67A9AF' />
                    </View>
                )}
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
                            <Text className="text-secondary font-sans-bold text-base">{doctor.consultationFee}</Text>
                            <Text className="text-gray-500 font-sans text-xs">Per Consultation</Text>
                        </View>
                        <TouchableOpacity className="bg-primary px-6 py-2 rounded-lg" onPress={handleBookAppointment}>
                            <Text className="text-white font-sans-medium text-sm">Consult now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // HTML content for the map
    const mapHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
            
            /* Doctor marker with profile image */
            .custom-marker {
                width: 38px;
                height: 38px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 4px 12px rgba(0,0,0,0.25);
                overflow: hidden;
                position: relative;
                background: #67A9AF;
            }
            
            /* Profile image styling */
            .marker-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            
            /* Default icon when no image */
            .marker-icon {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #67A9AF 0%, #5a969c 100%);
                color: white;
                font-size: 24px;
            }
            
            /* Availability status indicator */
            .status-indicator {
                position: absolute;
                top: -3px;
                right: -3px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                z-index: 10;
            }
            
            .available { 
                background: #10b981;
                animation: pulse 2s infinite;
            }
            
            .unavailable { 
                background: #f59e0b;
            }
            
            /* Pulse animation for available doctors */
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.6; }
            }
            
            /* User location marker */
            .custom-user-marker {
                animation: userPulse 2s infinite;
            }
            
            @keyframes userPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            let map;
            let userMarker = null;
            let doctorMarkers = [];
            let isMapReady = false;

            // Initialize map
            function initMap() {
                console.log('Initializing map...');
                map = L.map('map', {
                    zoomControl: false,
                    attributionControl: false
                }).setView([6.5244, 3.3792], 13);

                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                // Wait for tiles to load
                map.whenReady(function() {
                    console.log('Map is ready!');
                    isMapReady = true;
                    sendMessageToRN({ type: 'mapReady' });
                });
            }

            // Send message to React Native
            function sendMessageToRN(message) {
                const msgString = JSON.stringify(message);
                console.log('Sending to RN:', msgString);
                
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(msgString);
                }
            }

            // Handle messages from React Native
            function handleMessage(data) {
                console.log('Received message:', data);
                
                try {
                    const message = typeof data === 'string' ? JSON.parse(data) : data;
                    console.log('Parsed message:', message.type);
                    
                    if (message.type === 'updateMarkers') {
                        console.log('Updating markers with data:', message.data);
                        updateMarkers(message.data);
                    } else if (message.type === 'flyTo') {
                        console.log('Flying to:', message.data);
                        map.flyTo([message.data.lat, message.data.lng], message.data.zoom || 13, {
                            duration: 1
                        });
                    }
                } catch (e) {
                    console.error('Error handling message:', e);
                }
            }

            // Listen for messages
            window.addEventListener('message', function(event) {
                handleMessage(event.data);
            });

            document.addEventListener('message', function(event) {
                handleMessage(event.data);
            });

            function updateMarkers(data) {
                console.log('updateMarkers called with:', data);
                console.log('Doctors count:', data.doctors ? data.doctors.length : 0);
                
                if (!isMapReady) {
                    console.log('Map not ready yet, skipping marker update');
                    return;
                }

                // Update user location
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                
                const userIcon = L.divIcon({
                    className: 'custom-user-marker',
                    html: '<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });
                
                userMarker = L.marker([data.userLat, data.userLng], { icon: userIcon }).addTo(map);
                console.log('User marker added at:', data.userLat, data.userLng);
                
                // Clear existing doctor markers
                doctorMarkers.forEach(marker => {
                    map.removeLayer(marker);
                });
                doctorMarkers = [];
                
                // Add doctor markers
                if (data.doctors && data.doctors.length > 0) {
                    console.log('Adding', data.doctors.length, 'doctor markers');
                    
                    data.doctors.forEach((doctor, index) => {
                        console.log(\`Adding doctor \${index + 1}:\`, doctor.name, 'at', doctor.lat, doctor.lng);
                        
                        const markerHTML = doctor.image 
                            ? \`<div class="custom-marker">
                                 <img src="\${doctor.image}" class="marker-image" onerror="this.parentElement.innerHTML='<div class=\\"marker-icon\\">👨‍⚕️</div>
                                 <div class="status-indicator \${doctor.available ? 'available' : 'unavailable'}"></div>
                               </div>\`
                            : \`<div class="custom-marker">
                                 <div class="marker-icon">👨‍⚕️</div>
                                 <div class="status-indicator \${doctor.available ? 'available' : 'unavailable'}"></div>
                               </div>\`;
                        
                        const icon = L.divIcon({
                            className: 'custom-doctor-marker',
                            html: markerHTML,
                            iconSize: [48, 48],
                            iconAnchor: [24, 24]
                        });
                        
                        const marker = L.marker([doctor.lat, doctor.lng], { icon })
                            .addTo(map)
                            .on('click', function() {
                                console.log('Marker clicked:', doctor.id);
                                sendMessageToRN({
                                    type: 'markerClick',
                                    doctorId: doctor.id
                                });
                            });
                        
                        doctorMarkers.push(marker);
                    });
                    
                    console.log('Total markers added:', doctorMarkers.length);
                    
                    // Fit bounds to show all markers
                    const bounds = L.latLngBounds(
                        data.doctors.map(d => [d.lat, d.lng])
                    );
                    bounds.extend([data.userLat, data.userLng]);
                    map.fitBounds(bounds, { padding: [50, 50] });
                    console.log('Map bounds fitted');
                } else {
                    console.log('No doctors to display');
                    // Just center on user
                    map.setView([data.userLat, data.userLng], 13);
                }
            }

            // Initialize when page loads
            initMap();
            console.log('Map initialization started');
        </script>
    </body>
    </html>
    `;

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
                <ActivityIndicator size="large" color="#67A9AF" />
                <Text className="text-gray-600 font-sans-medium mt-4">Searching for doctors...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View className="bg-white px-4 py-3 pt-12">
                <View className="flex-row items-center gap-1 mb-3">
                    <TouchableOpacity onPress={() => router.back()} className="bg-white rounded-full p-2 shadow-sm">
                        <Ionicons name="chevron-back" size={20} color="#374151" />
                    </TouchableOpacity>
                    <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-1">
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

                    {/* Live Doctors Section */}
                    {/* {trackingConnected && liveActiveDoctors.length > 0 && (
                        <View className="bg-green-50 border-l-4 border-green-500 p-4 mx-4 mb-4 rounded-lg">
                            <View className="flex-row items-center justify-between mb-2">
                                <View className="flex-row items-center">
                                    <View className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                                    <Text className="text-green-700 font-sans-semibold">
                                        {liveActiveDoctors.length} Doctors Live Nearby
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setViewMode('map')}
                                    className="bg-green-500 px-3 py-1 rounded-full"
                                >
                                    <Text className="text-white text-xs font-sans-medium">View Map</Text>
                                </TouchableOpacity>
                            </View>
                            <Text className="text-green-600 text-xs font-sans">
                                These doctors are currently active and can respond instantly
                            </Text>
                        </View>
                    )} */}

                    {/* Doctor Cards */}
                    {filteredDoctors.length > 0 ? (
                        filteredDoctors.map((doctor) => {
                            const isLive = liveActiveDoctors.some(d => d.doctorId === doctor._id);
                            return (
                                <View key={doctor._id}>
                                    {isLive && (
                                        <View className="absolute left-2 top-2 z-10">
                                            <View className="bg-green-500 px-2 py-0.5 rounded-full flex-row items-center">
                                                <View className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                                                <Text className="text-white text-[10px] font-sans-semibold">LIVE</Text>
                                            </View>
                                        </View>
                                    )}
                                    <DoctorCard doctor={doctor} />
                                </View>
                            );
                        })
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
                    {/* OpenStreetMap View */}
                    <WebView
                        ref={webViewRef}
                        source={{ html: mapHTML }}
                        style={{ flex: 1 }}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        startInLoadingState={true}
                        renderLoading={() => (
                            <View className="flex-1 items-center justify-center bg-gray-100">
                                <ActivityIndicator size="large" color="#67A9AF" />
                                <Text className="text-gray-600 font-sans-medium mt-4">Loading map...</Text>
                            </View>
                        )}
                        onMessage={(event) => {
                            try {
                                const message = JSON.parse(event.nativeEvent.data);
                                console.log('Message from WebView:', message);

                                if (message.type === 'markerClick') {
                                    handleDoctorMarkerPress(message.doctorId);
                                } else if (message.type === 'mapReady') {
                                    console.log('Map is ready, updating markers...');
                                    setMapReady(true);
                                }
                            } catch (e) {
                                console.error('Error parsing message from WebView:', e);
                            }
                        }}
                        onError={(syntheticEvent) => {
                            const { nativeEvent } = syntheticEvent;
                            console.error('WebView error:', nativeEvent);
                        }}
                        onLoad={() => {
                            console.log('WebView loaded');
                        }}
                    />

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

                    {/* Live Tracking Toggle */}
                    <TouchableOpacity
                        className={`absolute top-4 left-4 px-4 py-2 rounded-full shadow-lg flex-row items-center ${showLiveDoctors ? 'bg-green-500' : 'bg-white'
                            }`}
                        onPress={toggleLiveTracking}
                    >
                        <View className={`w-2 h-2 rounded-full mr-2 ${showLiveDoctors ? 'bg-white' : 'bg-green-500'
                            }`} />
                        <Text className={`text-sm font-sans-medium ${showLiveDoctors ? 'text-white' : 'text-gray-700'
                            }`}>
                            {showLiveDoctors ? `${liveActiveDoctors.length} Live` : 'Show Live Doctors'}
                        </Text>
                    </TouchableOpacity>

                    {/* Connection Status */}
                    {!trackingConnected && (
                        <View className="absolute top-16 left-4 bg-yellow-500 px-4 py-2 rounded-full shadow-lg">
                            <Text className="text-white text-xs font-sans-medium">
                                ⚠️ Live tracking unavailable
                            </Text>
                        </View>
                    )}

                    {/* My Location Button */}
                    <TouchableOpacity
                        className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-lg"
                        onPress={centerMapOnUser}
                    >
                        <Ionicons name="navigate" size={20} color="#67A9AF" />
                    </TouchableOpacity>

                    {/* Debug Button - Remove after testing */}
                    {/* {__DEV__ && (
                        <TouchableOpacity
                            className="absolute top-16 right-4 bg-red-500 p-3 rounded-full shadow-lg"
                            onPress={() => {
                                console.log('=== DEBUG INFO ===');
                                console.log('Map Ready:', mapReady);
                                console.log('View Mode:', viewMode);
                                console.log('Filtered Doctors:', filteredDoctors.length);
                                console.log('First Doctor:', filteredDoctors[0]);
                                console.log('User Location:', userLocation);
                                console.log('==================');
                                
                                // Force update markers
                                if (mapReady) {
                                    updateMapMarkers();
                                }
                                
                                showToast(`Doctors: ${filteredDoctors.length}, Map Ready: ${mapReady}`, 'info');
                            }}
                        >
                            <Ionicons name="bug" size={20} color="#fff" />
                        </TouchableOpacity>
                    )} */}

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
                                transform: [{ translateY: panY }],
                            }}
                            className="bg-white rounded-t-3xl shadow-2xl"
                        >
                            {/* Top Handle */}
                            <View className="items-center pt-3 pb-2" {...panResponder.panHandlers}>
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
                                    {selectedDoctor.profileImage ? (
                                        <Image
                                            source={{ uri: selectedDoctor.profileImage?.url }}
                                            className="w-20 h-20 rounded-xl"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View className="w-32 h-32 rounded-xl items-center justify-center bg-primary/10">
                                            <Ionicons name="person" size={65} color='#67A9AF' />
                                        </View>
                                    )}
                                    <View className="flex-1">
                                        <View className="flex-row items-center">
                                            <Text className="font-sans-bold text-lg">{selectedDoctor.title}{selectedDoctor.fullName}</Text>
                                            {liveActiveDoctors.some(d => d.doctorId === selectedDoctor._id) && (
                                                <View className="ml-2 bg-green-500 px-2 py-0.5 rounded-full flex-row items-center">
                                                    <View className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
                                                    <Text className="text-white text-[10px] font-sans-semibold">LIVE</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className='flex-row items-center justify-between'>
                                            <Text className="text-gray-600 font-sans text-sm">{selectedDoctor.speciality}</Text>
                                            <View className='bg-primary/80 px-3 py-1 w-[60px] rounded-full'>
                                                <Text className="text-white text-sm font-sans text-center text-sm">{selectedDoctor.gender}</Text>
                                            </View>
                                        </View>
                                        {selectedDoctor.workHospitalName && (
                                            <Text className="text-gray-500 font-sans text-xs mb-2">{selectedDoctor.workHospitalName}</Text>
                                        )}
                                        <View className="flex-row items-center gap-3">
                                            {renderStars(selectedDoctor.rating || 0)}
                                            <View className="flex-row items-center gap-1">
                                                <Ionicons name="location" size={12} color="#6B7280" />
                                                <Text className="text-xs font-sans text-gray-500">{selectedDoctor.distance}</Text>
                                            </View>
                                        </View>

                                        <View className="flex-row mt-4 justify-start gap-2 w-full">
                                            {selectedDoctor.isAvailableForOnlineConsultations && (
                                                <View className="px-3 py-1.5 rounded-full bg-blue-50">
                                                    <Text className="text-xs font-sans-medium text-blue-700">Video Call</Text>
                                                </View>
                                            )}
                                            {selectedDoctor.isAvailableForHomeVisits && (
                                                <View className="px-3 py-1.5 rounded-full bg-purple-50">
                                                    <Text className="text-xs font-sans-medium text-purple-700">Home Visit</Text>
                                                </View>
                                            )}
                                            {selectedDoctor?.isAvailableForInPersonConsultations && (
                                                <View className="px-3 py-1.5 rounded-full bg-purple-50">
                                                    <Text className="text-xs font-sans-medium text-purple-700">In Person</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </View>

                                {/* Info Cards */}
                                <View className="flex-row gap-3 mb-4">
                                    <View className="flex-1 bg-blue-50 p-3 rounded-xl">
                                        <Text className="text-gray-600 font-sans text-xs mb-1">Experience</Text>
                                        <Text className="font-sans-semibold text-sm">{selectedDoctor.yearsOfExperience} years Experience</Text>
                                    </View>
                                    <View className={`flex-1 bg-green-50 p-3 rounded-xl ${selectedDoctor.availability === 'Available' ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <Text className="text-gray-600 font-sans text-xs mb-1">Availability</Text>
                                        <Text className={`font-sans-semibold text-sm ${selectedDoctor.availability === 'Available' ? 'text-green-600' : 'text-red-600'}`}>{selectedDoctor.availability}</Text>
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

                                {/* Subscription Button */}
                                {/* <TouchableOpacity
                                    onPress={() => {
                                        if (subscribedDoctors.has(selectedDoctor._id)) {
                                            handleUnsubscribeFromDoctor(selectedDoctor._id);
                                        } else {
                                            handleSubscribeToDoctor(selectedDoctor._id);
                                        }
                                    }}
                                    className={`py-3 rounded-xl mb-3 ${subscribedDoctors.has(selectedDoctor._id)
                                        ? 'bg-gray-200'
                                        : 'border border-primary'
                                        }`}
                                >
                                    <Text className={`font-sans-medium text-center ${subscribedDoctors.has(selectedDoctor._id)
                                        ? 'text-gray-600'
                                        : 'text-primary'
                                        }`}>
                                        {subscribedDoctors.has(selectedDoctor._id)
                                            ? '✓ Following Location'
                                            : '+ Track This Doctor'}
                                    </Text>
                                </TouchableOpacity> */}

                                {/* Action Buttons */}
                                <View className="flex-row gap-3 mb-3">
                                    <TouchableOpacity onPress={handleBookAppointment} className="flex-1 bg-primary py-3 rounded-xl flex-row items-center justify-center gap-2">
                                        <Ionicons name="calendar" size={20} color="#fff" />
                                        <Text className="text-white font-sans-semibold">Book Appointment</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={ViewDoctorProfile} className="flex-1 border border-primary py-3 rounded-xl flex-row items-center justify-center gap-2">
                                        <Ionicons name="person" size={20} color="#67A9AF" />
                                        <Text className="text-primary font-sans-semibold">View Profile</Text>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedDoctor(null);
                                        hideBottomSheet();
                                    }}
                                    className="bg-gray-100 py-4 rounded-xl mb-4"
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