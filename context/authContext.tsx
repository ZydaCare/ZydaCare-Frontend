import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { User, AuthState, LoginData, RegisterData, ForgotPasswordData, VerifyOtpData, ResetPasswordData, ResendOtpData } from '../types/User';
import { DoctorProfile, DoctorProfileData } from '@/types/Doctor';

interface AuthContextType extends AuthState {
    login: (data: LoginData) => Promise<any>;
    register: (data: RegisterData) => Promise<any>;
    logout: () => Promise<void>;
    forgotPassword: (data: ForgotPasswordData) => Promise<any>;
    verifyOtp: (data: VerifyOtpData) => Promise<any>;
    resetPassword: (data: ResetPasswordData) => Promise<any>;
    resendOtp: (data: ResendOtpData) => Promise<any>;
    getMe: () => Promise<void>;
    clearError: () => void;
    checkAuthState: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<User>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string; token?: string }>;
    getDoctorProfile: () => Promise<DoctorProfile | null>;
    getPatientProfile: () => Promise<any>;
    completeDoctorProfile: (data: Partial<DoctorProfileData>) => Promise<DoctorProfile>;
    updateDoctorProfile: (data: Partial<DoctorProfileData>) => Promise<DoctorProfile>;
    doctorProfile: DoctorProfile | null;
    patientProfile: any;
    isDoctor: boolean;
    isDoctorProfileComplete: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Helper function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const token = await AsyncStorage.getItem('token');
    console.log(`🔑 Making API call to ${endpoint}`, { hasToken: !!token });

    const headers = new Headers({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
    });

    const config: RequestInit = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        
        // First, get the response text to handle both JSON and non-JSON responses
        const responseText = await response.text();
        let data;
        
        try {
            // Try to parse as JSON
            data = responseText ? JSON.parse(responseText) : {};
        } catch (jsonError) {
            // If not JSON, handle as text response
            if (!response.ok) {
                console.error(`API returned non-JSON error (${endpoint}):`, responseText);
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            // If response is ok but not JSON, return the text
            return responseText;
        }

        if (!response.ok) {
            const errorMessage = data?.message || data?.error || 
                               `HTTP error! status: ${response.status} - ${response.statusText}`;
            console.error(`API Error (${endpoint}):`, errorMessage, 'Response:', data);
            throw new Error(errorMessage);
        }

        // Some endpoints return data in a 'data' property, others don't
        return data.data !== undefined ? data.data : data;
    } catch (error) {
        console.error(`API Call Error (${endpoint}):`, error);
        throw error;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: null,
        isLoading: true,
        isAuthenticated: false,
        error: null,
    });
    const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
    const [isDoctor, setIsDoctor] = useState(false);
    const [isDoctorProfileComplete, setIsDoctorProfileComplete] = useState(false);
    const [patientProfile, setPatientProfile] = useState<any>(null);

    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');

            if (token && userData) {
                const user = JSON.parse(userData);

                // Set state immediately
                setAuthState(prev => ({
                    ...prev,
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                }));

                // Load doctor profile if applicable
                if (user.role === 'doctor') {
                    const doctorData = await AsyncStorage.getItem('doctorProfile');
                    if (doctorData) {
                        const profile = JSON.parse(doctorData);
                        setDoctorProfile(profile);
                        setIsDoctor(true);
                        setIsDoctorProfileComplete(profile.profile?.isProfileComplete || false);
                    }

                    // Fetch latest in background (non-blocking)
                    getDoctorProfile().catch(console.log);
                }

                // Verify token validity in background (don't block)
                getMe().catch(async (error) => {
                    console.log('Token invalid, logging out:', error);
                    await logout();
                });
            } else {
                setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    isAuthenticated: false,
                }));
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                isAuthenticated: false,
            }));
        }
    };
    const login = async (data: LoginData) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await apiCall('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email.trim(),
                    password: data.password,
                }),
            });

            console.log('Login API response:', response);

            const { token, user } = response;

            if (!user.isEmailVerified) {
                await AsyncStorage.setItem('verificationEmail', user.email);
                router.replace({
                    pathname: '/(auth)/otp',
                    params: {
                        email: user.email,
                        flow: 'email_verification'
                    }
                });
                return { requiresVerification: true };
            }

            const formattedUserData = {
                ...user,
                _id: user.id,
            };
            delete formattedUserData.id;

            // ✅ CRITICAL: Save token & user with proper sequencing
            console.log('💾 Saving authentication data...');
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(formattedUserData));

            // ✅ Add a small delay to ensure AsyncStorage write completes
            await new Promise(resolve => setTimeout(resolve, 100));

            // ✅ Verify the token was saved by reading it back
            const savedToken = await AsyncStorage.getItem('token');
            console.log('✅ Token verified:', savedToken ? `YES (${savedToken.substring(0, 20)}...)` : 'NO');

            if (!savedToken) {
                throw new Error('Failed to save authentication token');
            }

            // ✅ Update context state with the new token and user data
            const newAuthState = {
                user: formattedUserData,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            };

            setAuthState(newAuthState);

            // Handle role-specific profile loading
            if (formattedUserData.role === 'doctor') {
                try {
                    console.log('👨\u200d⚕️ Fetching doctor profile...');
                    const profile = await getDoctorProfile();
                    if (profile) {
                        setDoctorProfile(profile);
                        setIsDoctor(true);
                        setIsDoctorProfileComplete(!!profile?.isProfileComplete);
                    }
                } catch (error) {
                    console.error('Error fetching doctor profile:', error);
                    // Don't throw, just log the error
                }
            } else if (formattedUserData.role === 'patient') {
                try {
                    console.log('👤 Fetching patient profile...');
                    // Use the token we just got instead of reading from AsyncStorage
                    const profile = await getPatientProfile();
                    if (profile) {
                        setPatientProfile(profile);
                    }
                } catch (error) {
                    console.error('Error fetching patient profile:', error);
                    // Don't throw, just log the error
                }
            }

            // Navigate to home screen after successful login and profile loading

            // ✅ Call getMe AFTER state is set and stable
            console.log('🔄 Calling getMe to sync user data...');
            try {
                await getMe();
                console.log('✅ getMe completed successfully');
            } catch (error) {
                console.error('⚠️ getMe failed (non-critical):', error);
                // Don't throw here - we already have the user data from login
            }

            // ✅ Final stability delay before navigation
            await new Promise(resolve => setTimeout(resolve, 200));

            // Navigate AFTER everything is ready
            console.log('🚀 Navigating to home screen...');
            if (formattedUserData.role === 'doctor') {
                router.replace('/(doctor)/(tabs)/home');
            } else if (formattedUserData.role === 'patient') {
                router.replace('/(patient)/(tabs)/home');
            } else if (formattedUserData.role === 'admin') {
                router.replace('/(admin)/(tabs)/home');
            }

            return response;
        } catch (error: any) {
            console.error('Login error:', error);
            const errorMessage = error.message || 'Login failed';
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw new Error(errorMessage);
        }
    };

    const register = async (data: RegisterData) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: null,
            }));

            return response;
        } catch (error: any) {
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Registration failed',
            }));
            throw error;
        }
    };

    const forgotPassword = async (data: ForgotPasswordData) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await apiCall('/auth/forgotpassword', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: null,
            }));

            return response;
        } catch (error: any) {
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Failed to send reset email',
            }));
            throw error;
        }
    };

    const verifyOtp = async (data: VerifyOtpData) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await apiCall('/auth/verify-otp', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            if (data.purpose === 'email_verification' && response.token && response.user) {
                const { token, user } = response;

                const formattedUserData = {
                    ...user,
                    _id: user.id,
                };
                delete formattedUserData.id;

                // ✅ Save and verify token
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('user', JSON.stringify(formattedUserData));

                const savedToken = await AsyncStorage.getItem('token');
                console.log('✅ Token saved and verified:', savedToken ? 'YES' : 'NO');

                setAuthState(prev => ({
                    ...prev,
                    user: formattedUserData,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                }));

                // ✅ Verify token works before navigation
                console.log('🔄 Calling getMe to verify authentication...');
                await getMe();
                console.log('✅ getMe completed successfully');

                if (formattedUserData.role === 'doctor') {
                    router.replace('/(doctor)/(tabs)/home');
                } else if (formattedUserData.role === 'patient') {
                    router.replace('/(patient)/(tabs)/home');
                } else if (formattedUserData.role === 'admin') {
                    router.replace('/(admin)/(tabs)/home');
                }
            } else {
                setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: null,
                }));
            }

            return response;
        } catch (error: any) {
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'OTP verification failed',
            }));
            throw error;
        }
    };

    const resetPassword = async (data: ResetPasswordData) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await apiCall('/auth/resetpassword', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    otp: data.otp,
                    password: data.password
                }),
            });

            const responseData = response.data || response;

            if (responseData.success || responseData.message) {
                setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: null,
                }));
                return { success: true, message: responseData.message || 'Password reset successful' };
            }

            if (response.token && response.user) {
                const { token, user: userData } = response;

                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('user', JSON.stringify(userData));

                setAuthState(prev => ({
                    ...prev,
                    user: userData,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                }));

                return { success: true, user: userData };
            }

            throw new Error('Unexpected response from server');

        } catch (error: any) {
            console.error('Reset password error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Password reset failed';
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            throw new Error(errorMessage);
        }
    };

    const resendOtp = async (data: ResendOtpData) => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

            const response = await apiCall('/auth/resend-otp', {
                method: 'POST',
                body: JSON.stringify(data),
            });

            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: null,
            }));

            return response;
        } catch (error: any) {
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                error: error.message || 'Failed to resend OTP',
            }));
            throw error;
        }
    };

    const getPatientProfile = async (): Promise<any> => {
        try {
            // First try to get token from auth state (most up-to-date)
            let token = authState.token;

            // If not in state, fall back to AsyncStorage
            if (!token) {
                token = await AsyncStorage.getItem('token');
                if (!token) {
                    console.log("No token found, skipping getPatientProfile");
                    return null;
                }
                // Update auth state with the token we found
                setAuthState(prev => ({ ...prev, token }));
            }

            console.log('🔑 Making API call to /auth/me');
            const response = await apiCall('/auth/me');
            console.log('Patient profile response received');

            // The response is already unwrapped by apiCall
            const userData = response;

            if (!userData || !userData._id) {
                throw new Error('Invalid user data received');
            }

            // Update the auth state with the latest user data
            setAuthState(prev => ({
                ...prev,
                user: userData,
                isAuthenticated: true,
                isLoading: false,
                error: null
            }));

            // Store the full user data as patient profile
            setPatientProfile(userData);

            // Update user data in AsyncStorage
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            await AsyncStorage.setItem('patientProfile', JSON.stringify(userData));

            console.log('✅ Patient profile updated successfully');
            return userData;
        } catch (error) {
            console.error('Error fetching patient profile:', error);
            return null;
        }
    };

    const getMe = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log("No token found, skipping getMe");
                return null;
            }

            const response = await apiCall('/auth/me');
            console.log('Auth/me response:', response);

            // The response is already unwrapped by apiCall
            const userData = response;

            if (!userData || !userData._id) {
                throw new Error('Invalid user data received');
            }

            // Update user data in AsyncStorage
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            // Set role-specific states and profiles
            if (userData.role === 'patient') {
                // For patients, we can use the user data directly
                setPatientProfile(userData);
                await AsyncStorage.setItem('patientProfile', JSON.stringify(userData));
            } else if (userData.role === 'doctor') {
                // For doctors, we still use the separate doctor profile endpoint
                await getDoctorProfile();
            }

            // Update auth state
            setAuthState(prev => ({
                ...prev,
                user: userData,
                isAuthenticated: true,
                error: null,
            }));

            return userData;
        } catch (error: any) {
            console.error('GetMe error:', error);
            // Don't update error state here - let calling code decide what to do
            throw error;
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'user', 'doctorProfile']);

            setAuthState({
                user: null,
                token: null,
                isLoading: false,
                isAuthenticated: false,
                error: null,
            });

            setDoctorProfile(null);
            setIsDoctor(false);
            setIsDoctorProfileComplete(false);

            console.log('Logout successful');
            router.replace('/welcome');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const clearError = () => {
        setAuthState(prev => ({ ...prev, error: null }));
    };

    const updateProfile = async (data: Partial<User>) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${BASE_URL}/auth/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update profile');
            }

            const responseData = await response.json();
            const updatedUser = responseData.data || responseData;

            setAuthState(prev => ({
                ...prev,
                user: prev.user ? { ...prev.user, ...updatedUser } : updatedUser,
                isAuthenticated: true,
            }));

            if (updatedUser) {
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
            }

            return updatedUser;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    };

    const updatePassword = async (currentPassword: string, newPassword: string) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${BASE_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update password');
            }

            if (data.token) {
                await AsyncStorage.setItem('token', data.token);
                setAuthState(prev => ({
                    ...prev,
                    token: data.token,
                }));
            }

            return { success: true, message: data.message, token: data.token };
        } catch (error) {
            console.error('Update password error:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : typeof error === 'object' && error !== null && 'message' in error
                    ? String(error.message)
                    : 'Failed to update password';
            return {
                success: false,
                message: errorMessage
            };
        }
    };

    // Doctor functions
    const getDoctorProfile = async (): Promise<DoctorProfile | null> => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log("No token found, skipping getDoctorProfile");
                return null;
            }

            const response = await apiCall('/doctors/me');
            console.log('Doctor profile response:', response);

            const profile = response as DoctorProfile;
            // Check both root and nested profile for isProfileComplete
            const isProfileComplete = Boolean(profile.isProfileComplete ?? profile.profile?.isProfileComplete);

            // Ensure the profile has the isProfileComplete at the root level
            const updatedProfile = {
                ...profile,
                isProfileComplete: isProfileComplete
            };

            setDoctorProfile(updatedProfile);
            setIsDoctor(true);
            setIsDoctorProfileComplete(isProfileComplete);

            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                user.isDoctorProfileComplete = isProfileComplete;
                await AsyncStorage.setItem('user', JSON.stringify(user));
            }

            await AsyncStorage.setItem('doctorProfile', JSON.stringify(profile));

            return profile;
        } catch (error) {
            console.error('Error fetching doctor profile:', error);
            return null;
        }
    };

    const completeDoctorProfile = async (data: Partial<DoctorProfileData>): Promise<DoctorProfile> => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await apiCall('/doctors/complete-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const profile = response as DoctorProfile;
            // Check both root and nested profile for isProfileComplete
            const isComplete = Boolean(profile.isProfileComplete ?? profile.profile?.isProfileComplete);

            // Ensure the profile has the isProfileComplete at the root level
            const updatedProfile = {
                ...profile,
                isProfileComplete: isComplete
            };

            setDoctorProfile(updatedProfile);
            setIsDoctorProfileComplete(isComplete);

            // Update user data in AsyncStorage
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                user.isDoctorProfileComplete = isComplete;
                await AsyncStorage.setItem('user', JSON.stringify(user));
            }

            await AsyncStorage.setItem('doctorProfile', JSON.stringify(profile));

            return profile;
        } catch (error: any) {
            console.error('Error completing doctor profile:', error);
            throw new Error(error.message || 'Failed to complete doctor profile');
        }
    };

    const updateDoctorProfile = async (data: Partial<DoctorProfileData>): Promise<DoctorProfile> => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await apiCall('/doctors/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            console.log('Update doctor profile response:', response);

            // Backend returns just the profile object, we need to merge with existing doctor data
            const updatedProfileData = response;

            // Get the existing doctor profile to preserve top-level fields
            const existingDoctorProfile = doctorProfile;

            if (!existingDoctorProfile) {
                throw new Error('No existing doctor profile found');
            }

            // Create the complete updated profile by merging
            const completeUpdatedProfile: DoctorProfile = {
                ...existingDoctorProfile,
                profile: {
                    ...existingDoctorProfile.profile,
                    ...updatedProfileData,
                    isProfileComplete: updatedProfileData.isProfileComplete ?? existingDoctorProfile.profile?.isProfileComplete ?? false,
                }
            };

            // Check for profile completion
            const isComplete = completeUpdatedProfile.profile.isProfileComplete;

            // Update state
            setDoctorProfile(completeUpdatedProfile);
            setIsDoctorProfileComplete(isComplete);

            // Update user data in AsyncStorage
            const userString = await AsyncStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                user.isDoctorProfileComplete = isComplete;
                await AsyncStorage.setItem('user', JSON.stringify(user));
            }

            // Save complete profile to AsyncStorage
            await AsyncStorage.setItem('doctorProfile', JSON.stringify(completeUpdatedProfile));

            return completeUpdatedProfile;
        } catch (error: any) {
            console.error('Error updating doctor profile:', error);
            throw new Error(error.message || 'Failed to update doctor profile');
        }
    };

    const contextValue: AuthContextType = {
        ...authState,
        login,
        register,
        logout,
        forgotPassword,
        verifyOtp,
        resetPassword,
        resendOtp,
        getMe,
        clearError,
        checkAuthState,
        updateProfile,
        updatePassword,
        getDoctorProfile,
        completeDoctorProfile,
        updateDoctorProfile,
        getPatientProfile,
        patientProfile,
        doctorProfile,
        isDoctor,
        isDoctorProfileComplete,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};