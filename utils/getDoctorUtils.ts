// utils/doctorUtils.ts

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 User latitude
 * @param lon1 User longitude
 * @param lat2 Doctor latitude
 * @param lon2 Doctor longitude
 * @returns Distance in kilometers
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
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal
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
    workHospitalName?: string;
    yearsOfExperience?: number;
    consultationFee?: number;
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
    bio?: string;
    email: string;
  }
  
  export const transformDoctorData = (
    doctor: any,
    userLatitude: number,
    userLongitude: number,
    profileImage?: { url: string; public_id: string }
  ): TransformedDoctor => {
    // Extract coordinates (backend uses [longitude, latitude])
    const doctorLongitude = doctor.location?.coordinates?.[0] || 
                            doctor.profile?.location?.coordinates?.[0] || 
                            0;
    const doctorLatitude = doctor.location?.coordinates?.[1] || 
                           doctor.profile?.location?.coordinates?.[1] || 
                           0;
  
    // Calculate distance
    const distanceKm = calculateDistance(
      userLatitude,
      userLongitude,
      doctorLatitude,
      doctorLongitude
    );
  
    // Get availability status
    const availabilityStatus = getDoctorAvailability(
      doctor.profile?.availability || doctor.availability
    );
  
    // Get consultation fee
    const consultationFee = doctor.profile?.consultationFees?.inPerson || 
                           doctor.consultationFee || 
                           0;
  
    // Get profile image
    // const profileImage = doctor.profile?.profileImage || 
    //                     doctor.profileImage || 
    //                     { url: '', public_id: '' };
  
    return {
      _id: doctor._id,
    //   name: doctor.fullName,
      title: doctor.title,
      fullName: doctor.fullName,
      speciality: doctor.speciality,
    //   category: doctor.speciality, // Map speciality to category
      hospital: doctor.workHospitalName || doctor.profile?.practiceInfo?.clinicName || 'Private Practice',
      workHospitalName: doctor.workHospitalName,
      yearsOfExperience: doctor.profile?.yearsOfExperience || doctor.yearsOfExperience,
    //   price: `₦${consultationFee.toLocaleString()}`,
      consultationFee: consultationFee,
      rating: doctor.profile?.rating || doctor.rating || 4.5,
      profileImage: profileImage,
      latitude: doctorLatitude,
      longitude: doctorLongitude,
      location: doctor.location || doctor.profile?.location,
      distance: formatDistance(distanceKm),
      distanceKm: distanceKm,
      availability: availabilityStatus.status,
      availabilityStatus: availabilityStatus,
      bio: doctor.profile?.professionalSummary || doctor.bio,
      email: doctor.email,
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
  
    // In map view, only show doctors that match the search query
    if (viewMode === 'map') {
      if (query === '') return [];
  
      return doctors.filter(doctor =>
        doctor.title.toLowerCase().includes(query) && doctor.fullName.toLowerCase().includes(query) ||
        doctor.speciality.toLowerCase().includes(query) ||
        // doctor.category.toLowerCase().includes(query) ||
        (doctor.hospital && doctor.hospital.toLowerCase().includes(query))
      );
    }
  
    // In list view, filter by category or search query
    if (query !== '') {
      return doctors.filter(doctor =>
        doctor.title.toLowerCase().includes(query) && doctor.fullName.toLowerCase().includes(query) ||
        doctor.speciality.toLowerCase().includes(query) ||
        // doctor.category.toLowerCase().includes(query) ||
        (doctor.hospital && doctor.hospital.toLowerCase().includes(query))
      );
    }
  
    // Filter by category (if not "All")
    if (selectedCategory === 'All') {
      return doctors;
    }
  
    return doctors.filter(doctor => doctor.speciality === selectedCategory);
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
      return a.distanceKm - b.distanceKm; // Then sort by distance
    });
  };