import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Types
interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    photo: string;
    role: 'patient' | 'doctor';
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'patient' | 'doctor';
}

interface ForgotPasswordData {
    email: string;
}

interface VerifyOtpData {
    email: string;
    otp: string;
    purpose: 'email_verification' | 'password_reset';
}

interface ResetPasswordData {
    email: string;
    otp: string;
    password: string;
}

interface ResendOtpData {
    email: string;
    purpose: 'email_verification' | 'password_reset';
}

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL - Replace with your actual backend URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// API Helper function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
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

            // ✅ Navigate now (don’t wait for getMe)
            if (formattedUserData.role === 'doctor') {
                router.replace('/(doctor)/(tabs)/home');
            } else {
                router.replace('/(patient)/(tabs)/home');
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
            } else {
              router.replace('/(patient)/(tabs)/home');
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