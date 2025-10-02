import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { User, AuthState, LoginData, RegisterData, ForgotPasswordData, VerifyOtpData, ResetPasswordData, ResendOtpData } from '../types/User';


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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Helper function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const token = await AsyncStorage.getItem('token');

    const config: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        const errorMessage = data?.message || data?.error || 'An error occurred';
        throw new Error(errorMessage);
    }

    // ✅ unwrap `data` if it exists
    return data.data ?? data;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [authState, setAuthState] = useState<AuthState>({
        user: null,
        token: null,
        isLoading: true,
        isAuthenticated: false,
        error: null,
    });

    // Check authentication state on app start
    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userData = await AsyncStorage.getItem('user');

            if (token && userData) {
                const user = JSON.parse(userData);
                setAuthState(prev => ({
                    ...prev,
                    token,
                    user,
                    isAuthenticated: true,
                    isLoading: false,
                }));

                // Verify token is still valid by fetching user data
                try {
                    await getMe();
                } catch (error) {
                    // Token is invalid, clear storage
                    await logout();
                }
            } else {
                setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    isAuthenticated: false,
                    user: null,
                    token: null,
                }));
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
            setAuthState(prev => ({
                ...prev,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                error: 'Error checking authentication state',
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

            // If email is not verified, redirect to OTP screen
            if (!user.isEmailVerified) {
                // Save email for OTP verification
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
                _id: user.id, // normalize field name
            };
            delete formattedUserData.id;

            // Save token & user immediately
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(formattedUserData));

            // ✅ Update context immediately
            setAuthState(prev => ({
                ...prev,
                user: formattedUserData,
                token,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            }));

            // ✅ Navigate now (don't wait for getMe)
            if (formattedUserData.role === 'doctor') {
                router.replace('/(doctor)/(tabs)/home');
            } else if (formattedUserData.role === 'patient') {
                router.replace('/(patient)/(tabs)/home');
            } else if (formattedUserData.role === 'admin') {
                router.replace('/(admin)/(tabs)/home');
            }

            // ✅ Optionally refresh user in background
            getMe().catch(err => console.warn("getMe failed after login:", err));

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

            // If it's email verification, store the token and user data
            if (data.purpose === 'email_verification' && response.token && response.user) {
                const { token, user } = response;

                const formattedUserData = {
                    ...user,
                    _id: user.id, // normalize id
                };
                delete formattedUserData.id;

                // ✅ Save token & user
                await AsyncStorage.setItem('token', token);
                await AsyncStorage.setItem('user', JSON.stringify(formattedUserData));

                // ✅ Update context
                setAuthState(prev => ({
                    ...prev,
                    user: formattedUserData,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                }));

                // Navigate based on role
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
            console.log('Resetting password with data:', { email: data.email, otp: data.otp });

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

            console.log('Reset password response:', response);

            // Handle different response structures
            const responseData = response.data || response;

            // If the response indicates success but doesn't include user data
            if (responseData.success || responseData.message) {
                // Just clear the loading state and return success
                setAuthState(prev => ({
                    ...prev,
                    isLoading: false,
                    error: null,
                }));
                return { success: true, message: responseData.message || 'Password reset successful' };
            }

            // If the response includes a token and user data
            if (response.token && response.user) {
                const { token, user: userData } = response;

                // Store token and user data
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

            // If we get here, the response format is unexpected
            console.error('Unexpected response format:', response);
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

    const getMe = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.log("No token found, skipping getMe");
                return null; // don’t call API if logged out
            }

            const response = await apiCall('/auth/me');
            console.log('GetMe response:', response);

            const userData = response;
            if (!userData || !userData._id) {
                throw new Error('Invalid user data received');
            }

            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setAuthState(prev => ({
                ...prev,
                user: userData,
                isAuthenticated: true,
                error: null,
            }));

            return userData;
        } catch (error: any) {
            console.error('GetMe error:', error);
            setAuthState(prev => ({
                ...prev,
                error: error.message || 'Failed to fetch user data',
            }));
            throw error;
        }
    };


    const logout = async () => {
        try {
            await AsyncStorage.multiRemove(['token', 'user']);

            setAuthState({
                user: null,
                token: null,
                isLoading: false,
                isAuthenticated: false,
                error: null,
            });

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
            
            // Update the user in the auth state
            setAuthState(prev => ({
                ...prev,
                user: prev.user ? { ...prev.user, ...updatedUser } : updatedUser,
                isAuthenticated: true,
            }));

            // Update AsyncStorage
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

            // Update the token in storage and state if a new one was returned
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