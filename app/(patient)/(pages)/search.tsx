import { Images } from '@/assets/Images';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function DoctorSearchScreen() {
    const { user } = useAuth();
    const { showToast } = useToast();

    const doctors = [
        {
            id: 1,
            name: 'Dr Kunmi Tayo',
            speciality: 'Medical Doctor',
            category: 'General',
            hospital: 'Lagoon Hospital',
            experience: '2 years experience',
            price: 'N5,000',
            rating: 4.8,
            image: Images.doctor,
        },
        {
            id: 2,
            name: 'Dr Mary John',
            speciality: 'Dentist',
            category: 'Dentist',
            hospital: null, // no hospital
            experience: '5 years experience',
            price: 'N7,000',
            rating: 4.6,
            image: Images.doctor,
        },
        {
            id: 3,
            name: 'Dr Smith Ade',
            speciality: 'General Surgeon',
            category: 'Surgeon',
            hospital: 'St. Nicholas Hospital',
            experience: '8 years experience',
            price: 'N15,000',
            rating: 4.9,
            image: Images.doctor,
        },
        {
            id: 4,
            name: 'Dr Clara Okafor',
            speciality: 'Pediatrician',
            category: 'Pediatrician',
            hospital: null,
            experience: '6 years experience',
            price: 'N10,000',
            rating: 4.7,
            image: Images.doctor,
        },
        {
            id: 5,
            name: 'Dr James Bello',
            speciality: 'Dermatologist',
            category: 'Dermatologist',
            hospital: 'Reddington Hospital',
            experience: '4 years experience',
            price: 'N8,000',
            rating: 4.5,
            image: Images.doctor,
        },
        {
            id: 6,
            name: 'Dr Ifeanyi Okoro',
            speciality: 'Cardiologist',
            category: 'Cardiologist',
            hospital: null,
            experience: '12 years experience',
            price: 'N20,000',
            rating: 4.9,
            image: Images.doctor,
        },
        {
            id: 7,
            name: 'Dr Lola Bamidele',
            speciality: 'Gynecologist',
            category: 'Gynecologist',
            hospital: null,
            experience: '9 years experience',
            price: 'N18,000',
            rating: 4.8,
            image: Images.doctor,
        },
        {
            id: 8,
            name: 'Dr Chinedu Umeh',
            speciality: 'Neurologist',
            category: 'Neurologist',
            hospital: 'Lagoon Hospital',
            experience: '15 years experience',
            price: 'N25,000',
            rating: 5.0,
            image: Images.doctor,
        },
        {
            id: 9,
            name: 'Dr Aisha Suleiman',
            speciality: 'Psychiatrist',
            category: 'Psychiatrist',
            hospital: null,
            experience: '7 years experience',
            price: 'N12,000',
            rating: 4.6,
            image: Images.doctor,
        },
        {
            id: 10,
            name: 'Dr Daniel Chukwu',
            speciality: 'Orthopedic Surgeon',
            category: 'Orthopedics',
            hospital: 'Nnamdi Azikiwe University Teaching Hospital',
            experience: '11 years experience',
            price: 'N22,000',
            rating: 4.9,
            image: Images.doctor,
        },
        {
            id: 11,
            name: 'Dr Fatima Lawal',
            speciality: 'Pulmonologist',
            category: 'Pulmonology',
            hospital: 'Lagoon Hospital',
            experience: '10 years experience',
            price: 'N16,000',
            rating: 4.7,
            image: Images.doctor,
        },
        {
            id: 12,
            name: 'Dr Grace Olamide',
            speciality: 'Endocrinologist',
            category: 'Endocrinology',
            hospital: 'Lagoon Hospital',
            experience: '13 years experience',
            price: 'N19,000',
            rating: 4.8,
            image: Images.doctor,
        },
        {
            id: 13,
            name: 'Dr Peter Adeyemi',
            speciality: 'Ophthalmologist',
            category: 'Ophthalmology',
            hospital: null,
            experience: '9 years experience',
            price: 'N14,000',
            rating: 4.6,
            image: Images.doctor,
        },
        {
            id: 14,
            name: 'Dr Francis Okafor',
            speciality: 'ENT Specialist',
            category: 'ENT',
            hospital: null,
            experience: '8 years experience',
            price: 'N12,000',
            rating: 4.7,
            image: Images.doctor,
        },
        {
            id: 15,
            name: 'Dr Vivian Ajayi',
            speciality: 'Oncologist',
            category: 'Oncology',
            hospital: null,
            experience: '14 years experience',
            price: 'N30,000',
            rating: 5.0,
            image: Images.doctor,
        },
        {
            id: 16,
            name: 'Dr Musa Ganiyu',
            speciality: 'Rheumatologist',
            category: 'Rheumatology',
            hospital: null,
            experience: '7 years experience',
            price: 'N17,000',
            rating: 4.5,
            image: Images.doctor,
        },
        {
            id: 17,
            name: 'Dr Amarachi Obi',
            speciality: 'Hematologist',
            category: 'Hematology',
            hospital: 'Covenant Hospital',
            experience: '6 years experience',
            price: 'N13,000',
            rating: 4.6,
            image: Images.doctor,
        },
        {
            id: 18,
            name: 'Dr Funke Alade',
            speciality: 'Nephrologist',
            category: 'Nephrology',
            hospital: 'Makaranta Hospital',
            experience: '12 years experience',
            price: 'N21,000',
            rating: 4.8,
            image: Images.doctor,
        },
        {
            id: 19,
            name: 'Dr Chika Obioma',
            speciality: 'Radiologist',
            category: 'Radiology',
            hospital: 'Jubilee Hospital',
            experience: '10 years experience',
            price: 'N18,000',
            rating: 4.7,
            image: Images.doctor,
        },
        {
            id: 20,
            name: 'Dr Jane Efe',
            speciality: 'Neonatologist',
            category: 'Pediatrics',
            hospital: null,
            experience: '9 years experience',
            price: 'N15,000',
            rating: 4.9,
            image: Images.doctor,
        },
        {
            id: 21,
            name: 'Dr Kelvin Musa',
            speciality: 'General Practitioner',
            category: 'General',
            hospital: null,
            experience: '4 years experience',
            price: 'N6,000',
            rating: 4.4,
            image: Images.doctor,
        },
        {
            id: 22,
            name: 'Dr Sophia Ade',
            speciality: 'Pediatrician',
            category: 'Pediatrician',
            hospital: null,
            experience: '11 years experience',
            price: 'N13,000',
            rating: 4.8,
            image: Images.doctor,
        },
        {
            id: 23,
            name: 'Dr Henry Udo',
            speciality: 'Dentist',
            category: 'Dentist',
            hospital: null,
            experience: '6 years experience',
            price: 'N9,000',
            rating: 4.7,
            image: Images.doctor,
        },
        {
            id: 24,
            name: 'Dr Ngozi Ebuka',
            speciality: 'Gynecologist',
            category: 'Gynecologist',
            hospital: null,
            experience: '10 years experience',
            price: 'N20,000',
            rating: 4.9,
            image: Images.doctor,
        },
        {
            id: 25,
            name: 'Dr Collins Duru',
            speciality: 'Neurologist',
            category: 'Neurologist',
            hospital: null,
            experience: '8 years experience',
            price: 'N23,000',
            rating: 4.7,
            image: Images.doctor,
        },
    ];

    const categories = [
        { id: 1, title: 'General', icon: 'person' },
        { id: 2, title: 'Dentist', icon: 'medkit' },
        { id: 3, title: 'Surgeon', icon: 'cut' },
        { id: 4, title: 'Pediatrician', icon: 'heart' },
        { id: 5, title: 'Dermatologist', icon: 'body' },
        { id: 6, title: 'Cardiologist', icon: 'heart-circle' },
        { id: 7, title: 'Gynecologist', icon: 'female' },
        { id: 8, title: 'Neurologist', icon: 'fitness' },
        { id: 9, title: 'Psychiatrist', icon: 'medkit' },
        { id: 10, title: 'Orthopedic', icon: 'walk' },
        { id: 11, title: 'Radiologist', icon: 'scan' },
        { id: 12, title: 'Oncologist', icon: 'nuclear' },
        { id: 13, title: 'ENT Specialist', icon: 'ear' },
        { id: 14, title: 'Urologist', icon: 'male' },
        { id: 15, title: 'Nephrologist', icon: 'water' },
        { id: 16, title: 'Endocrinologist', icon: 'thermometer' },
        { id: 17, title: 'Ophthalmologist', icon: 'eye' },
        { id: 18, title: 'Rheumatologist', icon: 'hand-left' },
        { id: 19, title: 'Physiotherapist', icon: 'fitness' },
        { id: 20, title: 'Nutritionist', icon: 'nutrition' },
    ];

    const [selectedCategory, setSelectedCategory] = useState<string>('General');
    const params = useLocalSearchParams()
    const [searchQuery, setSearchQuery] = useState<string>(params.query as string || '')

    const renderStars = (rating: number) => (
        <View className="flex-row items-center">
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text className="text-xs font-sans text-gray-600 ml-1">{rating}</Text>
        </View>
    );

    const DoctorCard = ({ doctor }: { doctor: any }) => (
        <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm mx-2">
            <View className="flex-row">
                <Image
                    source={doctor.image}
                    className="w-28 h-28 rounded-xl"
                    resizeMode="cover"
                />

                <View className="flex-1 ml-4">
                    <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-lg font-sans-semibold text-gray-900">{doctor.name}</Text>
                        {renderStars(doctor.rating)}
                    </View>

                    <Text className="text-gray-600 font-sans text-sm mb-1">{doctor.speciality}</Text>

                    {/* ✅ Only show hospital if it exists */}
                    {doctor.hospital && (
                        <Text className="text-gray-500 font-sans text-xs mb-1">{doctor.hospital}</Text>
                    )}

                    <Text className="text-gray-400 font-sans text-xs mb-3">{doctor.experience}</Text>

                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-secondary font-sans-bold text-base">{doctor.price}</Text>
                            <Text className="text-gray-500 font-sans text-xs">Per Consultation</Text>
                        </View>

                        <TouchableOpacity className="bg-primary px-6 py-2 rounded-lg">
                            <Text className="text-white font-sans-medium text-sm">Consult now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );

    // 🔹 Updated filtering logic
    const filteredDoctors = doctors.filter((doctor) => {
        const query = searchQuery.toLowerCase();

        const matchesSearch =
            doctor.name.toLowerCase().includes(query) ||
            doctor.speciality.toLowerCase().includes(query) ||
            doctor.category.toLowerCase().includes(query) ||
            (doctor.hospital && doctor.hospital.toLowerCase().includes(query));

        if (searchQuery.trim() !== '') {
            return matchesSearch; // ✅ ignore category when searching
        } else {
            return doctor.category === selectedCategory; // ✅ normal category filter
        }
    });

    return (
        <SafeAreaView className="flex-1 bg-gray-50 p-4">
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={() => router.back()} className="bg-white rounded-full p-2 shadow-sm">
                    <Ionicons name="chevron-back" size={20} color="#374151" />
                </TouchableOpacity>

                {/* Search Bar */}
                <View className="flex-1 flex-row items-center bg-white rounded-full px-4 py-1 shadow-sm">
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

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 24 }}
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
                                setSearchQuery(''); // ✅ reset search when category changes
                            }}
                            className={`flex-row items-center px-6 py-3 rounded-xl mr-3 ${selectedCategory === category.title
                                ? 'bg-[#67A9AF33]/20 border border-[#67A9AF33]/20'
                                : 'bg-white border border-gray-200'
                                }`}
                        >
                            <Ionicons
                                name={category.icon}
                                size={16}
                                color={selectedCategory === category.title ? '#67A9AF' : '#6B7280'}
                            />
                            <Text
                                className={`ml-2 text-sm font-sans-medium ${selectedCategory === category.title
                                    ? 'text-[#67A9AF]'
                                    : 'text-gray-600'
                                    }`}
                            >
                                {category.title}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Doctor Cards */}
                {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)
                ) : searchQuery.trim() !== '' ? (
                    // 🔹 Empty search results
                    <View className="items-center justify-center mt-20">
                        <Ionicons name="search-outline" size={50} color="#9CA3AF" />
                        <Text className="text-gray-500 font-sans-medium mt-4 text-base">
                            No results found for "{searchQuery}"
                        </Text>
                        <Text className="text-gray-400 font-sans text-sm mt-2">
                            Try searching with another name, specialist, or hospital
                        </Text>
                    </View>
                ) : (
                    // 🔹 Empty category results
                    <View className="items-center justify-center mt-20">
                        <Ionicons name="medkit-outline" size={50} color="#9CA3AF" />
                        <Text className="text-gray-500 font-sans-medium mt-4 text-base">
                            No doctors available in {selectedCategory}
                        </Text>
                        <Text className="text-gray-400 font-sans text-sm mt-2">
                            Try these categories instead
                        </Text>

                        <View className="flex-row mt-3">
                            {categories
                                .filter(c => doctors.some(d => d.category === c.title)) // categories with doctors
                                .slice(0, 3) // suggest top 3
                                .map(c => (
                                    <TouchableOpacity
                                        key={c.id}
                                        onPress={() => setSelectedCategory(c.title)}
                                        className="px-6 py-2 bg-primary rounded-full mx-1"
                                    >
                                        <Text className="text-white font-sans text-sm">{c.title}</Text>
                                    </TouchableOpacity>
                                ))}
                        </View>
                    </View>
                )}
                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
}
