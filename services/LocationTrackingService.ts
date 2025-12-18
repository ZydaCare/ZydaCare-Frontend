// services/locationTracking.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { io } from 'socket.io-client';

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

interface LocationUpdate {
  latitude: number;
  longitude: number;
}

class LocationTrackingService {
  private socket: Socket | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private isSharing: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private activeDoctors: Map<string, DoctorLocation> = new Map();
  private listeners: Set<(doctors: DoctorLocation[]) => void> = new Set();

  /**
   * Initialize socket connection with authentication
   */
  async initialize(serverUrl: string): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return false;
      }

      // Remove any path from the server URL as Socket.IO needs the root URL
      const url = new URL(serverUrl);
      const cleanServerUrl = `${url.protocol}//${url.host}`;

      console.log('Connecting to socket server:', cleanServerUrl);

      // Enable debug logging
      if (__DEV__) {
        // @ts-ignore - This is a browser-only API
        if (typeof localStorage !== 'undefined') {
          // @ts-ignore
          localStorage.debug = 'socket.io-client:*';
        }
      }

      this.socket = io(cleanServerUrl, {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupSocketListeners();

      return new Promise((resolve) => {
        this.socket?.on('connect', () => {
          console.log('✅ Socket connected with ID:', this.socket?.id);
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket?.on('connect_error', (error: any) => {
          console.error('Socket connection error:', error.message);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
          }
        });
      });
    } catch (error) {
      console.error('Error initializing location tracking:', error);
      return false;
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners() {
    if (!this.socket) return;

    // Connection successful
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected with ID:', this.socket?.id);
    });

    // Handle connection errors
    this.socket.on('connect_error', (error: any) => {
      console.error('❌ Socket.IO connection error:', error.message);
      console.error('Error details:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    // Listen for doctor location updates
    this.socket.on('doctor:locationUpdated', (data: any) => {
      console.log('📍 Doctor location updated:', data.doctorId);

      const location: DoctorLocation = {
        doctorId: data.doctorId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date(data.timestamp),
        doctorInfo: data.doctorInfo,
        distance: data.distance,
      };

      this.activeDoctors.set(data.doctorId, location);
      this.notifyListeners();
    });

    // Listen for doctor going offline
    this.socket.on('doctor:offline', (data: { doctorId: string }) => {
      console.log('📴 Doctor went offline:', data.doctorId);
      this.activeDoctors.delete(data.doctorId);
      this.notifyListeners();
    });

    // Connection events
    this.socket.on('disconnect', (reason: any) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber: any) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      // Re-request doctor locations after reconnection
      if (!this.isSharing) {
        this.requestDoctorLocations();
      }
    });
  }

  /**
   * DOCTOR: Start sharing location
   * ✅ FIXED: Removed doctorId parameter - backend will determine it from auth token
   */
  async startSharingLocation(updateInterval: number = 5000): Promise<boolean> {
    try {
      if (this.isSharing) {
        console.log('Already sharing location');
        return true;
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      // ✅ FIX: Don't send doctorId - backend will get it from the authenticated user
      console.log('📡 Requesting to start location sharing');
      const response = await this.emitWithCallback('doctor:startSharing', {});
      console.log('📡 Server response:', response);
      
      if (!response?.success) {
        const errorMsg = response?.message || 'Failed to start sharing';
        console.error('❌ Start sharing failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Start watching location
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: updateInterval,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          this.updateLocation(location.coords.latitude, location.coords.longitude);
        }
      );

      this.isSharing = true;
      console.log('✅ Started sharing location');
      return true;
    } catch (error) {
      console.error('Error starting location sharing:', error);
      return false;
    }
  }

  /**
   * DOCTOR: Stop sharing location
   */
  async stopSharingLocation(): Promise<boolean> {
    try {
      if (!this.isSharing) {
        console.log('Not currently sharing location');
        return true;
      }

      // Stop watching location
      if (this.locationSubscription) {
        this.locationSubscription.remove();
        this.locationSubscription = null;
      }

      // Notify server to stop sharing
      const response = await this.emitWithCallback('doctor:stopSharing', {});
      if (!response?.success) {
        console.warn('Failed to notify server:', response?.message);
      }

      this.isSharing = false;
      console.log('✅ Stopped sharing location');
      return true;
    } catch (error) {
      console.error('Error stopping location sharing:', error);
      return false;
    }
  }

  /**
   * DOCTOR: Update current location to server
   */
  private async updateLocation(latitude: number, longitude: number) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, skipping location update');
      return;
    }

    try {
      const response = await this.emitWithCallback('doctor:updateLocation', {
        latitude,
        longitude,
      });

      if (!response?.success) {
        console.warn('Location update failed:', response?.message);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }

  /**
   * PATIENT: Request all active doctor locations
   */
  async requestDoctorLocations(
    userLocation?: { latitude: number; longitude: number },
    radiusKm?: number
  ): Promise<DoctorLocation[]> {
    try {
      const response = await this.emitWithCallback('patient:requestDoctorLocations', {
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        radiusKm,
      });

      if (response?.success && response.locations) {
        // Update active doctors map
        this.activeDoctors.clear();
        response.locations.forEach((loc: any) => {
          this.activeDoctors.set(loc.doctorId, {
            doctorId: loc.doctorId,
            latitude: loc.latitude,
            longitude: loc.longitude,
            timestamp: new Date(loc.lastUpdated),
            doctorInfo: loc.doctorInfo,
            distance: loc.distance,
          });
        });

        this.notifyListeners();
        return Array.from(this.activeDoctors.values());
      }

      return [];
    } catch (error) {
      console.error('Error requesting doctor locations:', error);
      return [];
    }
  }

  /**
   * PATIENT: Subscribe to specific doctor's location updates
   */
  async subscribeToDoctor(doctorId: string): Promise<boolean> {
    try {
      const response = await this.emitWithCallback('patient:subscribeToDoctor', {
        doctorId,
      });

      return response?.success || false;
    } catch (error) {
      console.error('Error subscribing to doctor:', error);
      return false;
    }
  }

  /**
   * PATIENT: Unsubscribe from doctor's location updates
   */
  async unsubscribeFromDoctor(doctorId: string): Promise<boolean> {
    try {
      const response = await this.emitWithCallback('patient:unsubscribeFromDoctor', {
        doctorId,
      });

      return response?.success || false;
    } catch (error) {
      console.error('Error unsubscribing from doctor:', error);
      return false;
    }
  }

  /**
   * Add listener for doctor location updates
   */
  addLocationListener(callback: (doctors: DoctorLocation[]) => void): () => void {
    this.listeners.add(callback);

    // Immediately call with current data
    callback(Array.from(this.activeDoctors.values()));

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of location updates
   */
  private notifyListeners() {
    const doctors = Array.from(this.activeDoctors.values());
    this.listeners.forEach(listener => listener(doctors));
  }

  /**
   * Get all active doctor locations
   */
  getActiveDoctors(): DoctorLocation[] {
    return Array.from(this.activeDoctors.values());
  }

  /**
   * Get specific doctor location
   */
  getDoctorLocation(doctorId: string): DoctorLocation | null {
    return this.activeDoctors.get(doctorId) || null;
  }

  /**
   * Check if currently sharing location
   */
  isSharingLocation(): boolean {
    return this.isSharing;
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.isSharing) {
      this.stopSharingLocation();
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.activeDoctors.clear();
    this.listeners.clear();
    console.log('🔌 Location tracking service disconnected');
  }

  /**
   * Helper: Emit event with callback promise
   */
  private emitWithCallback(event: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Socket timeout'));
      }, 10000);

      this.socket.emit(event, data, (response: any) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }
}

// Export singleton instance
export default new LocationTrackingService();