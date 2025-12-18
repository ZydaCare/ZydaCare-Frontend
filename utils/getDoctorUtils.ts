// utils/getDoctorUtils.ts

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10;
};

/**
 * Format distance for display
 */
export const formatDistance = (km: number): string => {
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)} km`;
};

/**
 * Get current day of week in lowercase
 */
const getCurrentDay = (): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
};

/**
 * Parse time string (HH:MM) to minutes since midnight
 */
const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

/**
 * Get current time in minutes since midnight
 */
const getCurrentMinutes = (): number => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
};

/**
 * Check if doctor is available now and get availability status
 */
export const getDoctorAvailability = (availability?: any): {
    isAvailable: boolean;
    status: string;
    nextSlot?: string;
} => {
    if (!availability || !availability.workingDays || availability.workingDays.length === 0) {
        return { isAvailable: false, status: 'Availability not set' };
    }

    const currentDay = getCurrentDay();
    const currentMinutes = getCurrentMinutes();

    // Find today's schedule
    const todaySchedule = availability.workingDays.find(
        (wd: any) => wd.day.toLowerCase() === currentDay
    );

    if (!todaySchedule || !todaySchedule.slots || todaySchedule.slots.length === 0) {
        return { isAvailable: false, status: 'Not available today' };
    }

    // Check if any slot is active right now
    for (const slot of todaySchedule.slots) {
        if (!slot.isAvailable) continue;

        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = timeToMinutes(slot.endTime);

        // Currently in this time slot
        if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
            return { isAvailable: true, status: 'Available now' };
        }

        // Slot is coming up later today
        if (currentMinutes < startMinutes) {
            const minutesUntil = startMinutes - currentMinutes;
            if (minutesUntil < 60) {
                return {
                    isAvailable: false,
                    status: `Available in ${minutesUntil} min`,
                    nextSlot: slot.startTime
                };
            } else {
                const hoursUntil = Math.round(minutesUntil / 60);
                return {
                    isAvailable: false,
                    status: `Available in ${hoursUntil} ${hoursUntil === 1 ? 'hour' : 'hours'}`,
                    nextSlot: slot.startTime
                };
            }
        }
    }

    return { isAvailable: false, status: 'Available tomorrow' };
};

/**
 * Transform backend doctor data to frontend format
 */
export interface TransformedDoctor {
    _id: string;
    title: string;
    fullName: string;
    speciality: string;
    hospital: string;
    gender: string;
    workHospitalName?: string;
    yearsOfExperience: number;
    consultationFee: string;
    rating: number;
    profileImage?: { url: string; public_id: string };
    latitude: number;
    longitude: number;
    location?: any;
    distance: string;
    distanceKm: number;
    availability: string;
    availabilityStatus: {
        isAvailable: boolean;
        status: string;
        nextSlot?: string;
    };
    isAvailableForOnlineConsultations: boolean;
    isAvailableForInPersonConsultations: boolean;
    isAvailableForHomeVisits: boolean;
    bio?: string;
    email: string;
}

export const transformDoctorData = (
    doctor: any,
    userLatitude: number,
    userLongitude: number,
    profileImageUrl?: string
): TransformedDoctor => {
    // Extract coordinates from profile.location.coordinates [longitude, latitude]
    const doctorLongitude = doctor.profile?.location?.coordinates?.[0] || 0;
    const doctorLatitude = doctor.profile?.location?.coordinates?.[1] || 0;

    // Skip doctors with invalid coordinates (0,0 or missing)
    const hasValidCoordinates = doctorLatitude !== 0 && doctorLongitude !== 0;

    // Calculate distance only if valid coordinates exist
    const distanceKm = hasValidCoordinates
        ? calculateDistance(userLatitude, userLongitude, doctorLatitude, doctorLongitude)
        : 999999; // Very large number for doctors without coordinates

    // Get availability status from profile.availability
    const availabilityStatus = getDoctorAvailability(doctor.profile?.availability);

    // Get consultation fee from profile.consultationFees.inPerson
    const consultationFee = doctor.profile?.consultationFees?.inPerson || 0;

    // Get profile image - check if url exists and is not empty
    const profileImage = doctor.profile?.profileImage?.url
        ? {
            url: doctor.profile.profileImage.url,
            public_id: doctor.profile.profileImage.public_id || ''
        }
        : undefined;

    // Get years of experience from profile
    const yearsOfExperience = doctor.profile?.yearsOfExperience || 0;

    // Get title from profile
    const title = doctor.profile?.title || 'Dr.';

    const gender = doctor.profile?.gender

    // Get hospital name - prioritize workHospitalName, then clinic name from profile
    const hospital = doctor.workHospitalName ||
        doctor.profile?.practiceInfo?.clinicName ||
        'Private Practice';

    const isAvailableForOnlineConsultations = doctor.profile?.availability?.isAvailableForOnlineConsultations;
    const isAvailableForInPersonConsultations = doctor.profile?.availability?.isAvailableForInPersonConsultations;
    const isAvailableForHomeVisits = doctor.profile?.availability?.isAvailableForHomeVisits;

    return {
        _id: doctor._id,
        title: title,
        fullName: doctor.fullName,
        speciality: doctor.speciality,
        hospital: hospital,
        gender: gender,
        workHospitalName: doctor.workHospitalName,
        yearsOfExperience: yearsOfExperience,
        consultationFee: `₦${consultationFee.toLocaleString()}`,
        rating: doctor.profile?.rating || 4.5,
        profileImage: profileImage,
        latitude: doctorLatitude,
        longitude: doctorLongitude,
        location: doctor.profile?.location,
        distance: hasValidCoordinates ? formatDistance(distanceKm) : 'Location not set',
        distanceKm: distanceKm,
        availability: availabilityStatus.status,
        availabilityStatus: availabilityStatus,
        bio: doctor.profile?.professionalSummary || '',
        email: doctor.email,
        isAvailableForOnlineConsultations: isAvailableForOnlineConsultations,
        isAvailableForInPersonConsultations: isAvailableForInPersonConsultations,
        isAvailableForHomeVisits: isAvailableForHomeVisits,
    };
};

/**
* Filter doctors by search query and category
*/
export const filterDoctors = (
  doctors: TransformedDoctor[],
  searchQuery: string,
  selectedCategory: string,
  viewMode: 'list' | 'map'
): TransformedDoctor[] => {
  const query = searchQuery.toLowerCase().trim();

  // Filter out doctors with invalid coordinates in map view
  const validDoctors = viewMode === 'map'
    ? doctors.filter(d => d.latitude !== 0 && d.longitude !== 0)
    : doctors;

  // If there's a search query, filter by query
  if (query !== '') {
    return validDoctors.filter(doctor => {
      const fullNameMatch = doctor.fullName.toLowerCase().includes(query);
      const titleMatch = doctor.title.toLowerCase().includes(query);
      const specialityMatch = doctor.speciality.toLowerCase().includes(query);
      const hospitalMatch = doctor.hospital?.toLowerCase().includes(query);

      return fullNameMatch || titleMatch || specialityMatch || hospitalMatch;
    });
  }

  // Filter by category (if not "All")
  if (selectedCategory !== 'All') {
    return validDoctors.filter(doctor => {
      // Flexible matching for categories
      const categoryLower = selectedCategory.toLowerCase();
      const specialityLower = doctor.speciality.toLowerCase();
      
      // Direct match
      if (specialityLower === categoryLower) return true;
      
      // Partial match for common variations
      if (categoryLower.includes('doctor') && specialityLower.includes('general')) return true;
      if (categoryLower.includes('child care') && specialityLower.includes('pediatric')) return true;
      if (categoryLower.includes('care giver') && specialityLower.includes('nurse')) return true;
      
      // Check if category is contained in speciality
      if (specialityLower.includes(categoryLower)) return true;
      
      return false;
    });
  }

  return validDoctors;
};

/**
 * Get nearest doctors within a radius (for map view)
 * Prioritizes live doctors and sorts by distance
 */
export const getNearestDoctors = (
    doctors: TransformedDoctor[],
    radiusKm: number,
    liveDoctorIds: string[] = []
): TransformedDoctor[] => {
    // Filter doctors with valid coordinates
    const validDoctors = doctors.filter(d => 
        d.latitude !== 0 && 
        d.longitude !== 0 &&
        !isNaN(d.latitude) &&
        !isNaN(d.longitude)
    );

    // Separate live and non-live doctors
    const liveDoctors = validDoctors.filter(d => liveDoctorIds.includes(d._id));
    const otherDoctors = validDoctors
        .filter(d => !liveDoctorIds.includes(d._id))
        .filter(d => d.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm);

    // If we have live doctors, show all of them + nearest 5 others
    if (liveDoctors.length > 0) {
        return [...liveDoctors, ...otherDoctors.slice(0, 5)];
    }

    // Otherwise, show up to 10 nearest doctors within radius
    return otherDoctors.slice(0, 10);
};

/**
 * Sort doctors by distance
 */
export const sortDoctorsByDistance = (doctors: TransformedDoctor[]): TransformedDoctor[] => {
    return [...doctors].sort((a, b) => a.distanceKm - b.distanceKm);
};

/**
 * Sort doctors by availability (available first)
 */
export const sortDoctorsByAvailability = (doctors: TransformedDoctor[]): TransformedDoctor[] => {
    return [...doctors].sort((a, b) => {
        if (a.availabilityStatus.isAvailable && !b.availabilityStatus.isAvailable) return -1;
        if (!a.availabilityStatus.isAvailable && b.availabilityStatus.isAvailable) return 1;
        return a.distanceKm - b.distanceKm;
    });
};