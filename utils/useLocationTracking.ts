// hooks/useLocationTracking.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import LocationTrackingService from '@/services/LocationTrackingService';
import * as Location from 'expo-location';

interface DoctorLocation {
  doctorId: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  doctorInfo: {
    fullName: string;
    speciality: string;
    profileImage: string | null;
  };
  distance?: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

export const useLocationTracking = (serverUrl: string, autoConnect: boolean = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeDoctors, setActiveDoctors] = useState<DoctorLocation[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const initializeAttempted = useRef(false);
  const isInitializing = useRef(false);

  // Initialize connection
  useEffect(() => {
    if (autoConnect && !initializeAttempted.current && !isInitializing.current) {
      initializeAttempted.current = true;
      isInitializing.current = true;
      
      // Add small delay to ensure everything is mounted
      const timer = setTimeout(() => {
        initializeConnection().finally(() => {
          isInitializing.current = false;
        });
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      if (initializeAttempted.current) {
        LocationTrackingService.disconnect();
      }
    };
  }, [autoConnect, serverUrl]);

  // Setup location listener
  useEffect(() => {
    const unsubscribe = LocationTrackingService.addLocationListener((doctors) => {
      setActiveDoctors(doctors);
    });

    return unsubscribe;
  }, []);

  const initializeConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const success = await LocationTrackingService.initialize(serverUrl);
      
      if (success) {
        setIsConnected(true);
        console.log('✅ Location tracking initialized');
      } else {
        setError('Failed to connect to location tracking server');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get user's current location
  const getUserLocation = useCallback(async (): Promise<UserLocation | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(userLoc);
      return userLoc;
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
      return null;
    }
  }, []);

  // DOCTOR: Start sharing location
  const startSharing = useCallback(async (updateInterval: number = 5000) => {
    try {
      setLoading(true);
      setError(null);

      const success = await LocationTrackingService.startSharingLocation(updateInterval);
      
      if (success) {
        setIsSharing(true);
        return true;
      } else {
        setError('Failed to start sharing location');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start sharing');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // DOCTOR: Stop sharing location
  const stopSharing = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const success = await LocationTrackingService.stopSharingLocation();
      
      if (success) {
        setIsSharing(false);
        return true;
      } else {
        setError('Failed to stop sharing location');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to stop sharing');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // PATIENT: Request all doctor locations
  const requestDoctorLocations = useCallback(async (radiusKm?: number) => {
    try {
      setLoading(true);
      setError(null);

      const location = await getUserLocation();
      if (!location) {
        setError('User location required');
        return [];
      }

      const doctors = await LocationTrackingService.requestDoctorLocations(
        location,
        radiusKm
      );

      return doctors;
    } catch (err: any) {
      setError(err.message || 'Failed to request locations');
      return [];
    } finally {
      setLoading(false);
    }
  }, [getUserLocation]);

  // PATIENT: Subscribe to specific doctor
  const subscribeToDoctor = useCallback(async (doctorId: string) => {
    try {
      const success = await LocationTrackingService.subscribeToDoctor(doctorId);
      if (!success) {
        setError('Failed to subscribe to doctor');
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe');
      return false;
    }
  }, []);

  // PATIENT: Unsubscribe from doctor
  const unsubscribeFromDoctor = useCallback(async (doctorId: string) => {
    try {
      const success = await LocationTrackingService.unsubscribeFromDoctor(doctorId);
      if (!success) {
        setError('Failed to unsubscribe from doctor');
      }
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe');
      return false;
    }
  }, []);

  // Get specific doctor location
  const getDoctorLocation = useCallback((doctorId: string) => {
    return LocationTrackingService.getDoctorLocation(doctorId);
  }, []);

  // Reconnect manually
  const reconnect = useCallback(async () => {
    LocationTrackingService.disconnect();
    await initializeConnection();
  }, []);

  return {
    // State
    isConnected,
    isSharing,
    activeDoctors,
    userLocation,
    loading,
    error,

    // Doctor functions
    startSharing,
    stopSharing,

    // Patient functions
    getUserLocation,
    requestDoctorLocations,
    subscribeToDoctor,
    unsubscribeFromDoctor,
    getDoctorLocation,

    // Utility
    reconnect,
  };
};