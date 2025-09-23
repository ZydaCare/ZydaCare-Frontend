import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, RegisterData, LoginCredentials, OtpVerification, ResetPasswordData } from '../types/auth';

const API_URL = 'https://zydacare-backend.onrender.com/api/v1/auth'; // Replace with your actual API URL

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    register: (data: RegisterData) => Promise<void>;
    login: (credentials: LoginCredentials) => Promise<{ user: User; token: string }>;
    verifyOtp: (data: OtpVerification & { purpose: string }) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (data: ResetPasswordData) => Promise<void>;
    resendOtp: (email: string, purpose: string) => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<{
        user: User | null;
        token: string | null;
        isAuthenticated: boolean;
        isLoading: boolean;
        error: string | null;
    }>({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
        error: null,
    });

    // Load user from storage on mount and verify token
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userString = await AsyncStorage.getItem('user');

                if (token && userString) {
                    try {
                        const user = JSON.parse(userString);
                        // Here you might want to verify the token with your backend
                        // For now, we'll assume the token is valid if it exists
                        setState(prev => ({
                            ...prev,
                            token,
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                        }));
                    } catch (error) {
                        console.error('Error parsing user data:', error);
                        // Clear invalid data
                        await AsyncStorage.multiRemove(['token', 'user']);
                        setState(prev => ({ ...prev, isLoading: false }));
                    }
                } else {
                    setState(prev => ({ ...prev, isLoading: false }));
                }
            } catch (error) {
                console.error('Error loading user from storage:', error);
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        loadUser();
    }, []);

    // API request helper with generic type support
    const apiRequest = async <T = any>(endpoint: string, method: string, body?: any, headers = {}): Promise<T> => {
        try {
            console.log(`API Request: ${method} ${API_URL}${endpoint}`, { body });
            const response = await fetch(`${API_URL}${endpoint}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                ...(body && { body: JSON.stringify(body) }),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data?.message ||
                    data?.error ||
                    `Request failed with status ${response.status}`;
                const error: any = new Error(errorMessage);
                error.response = { status: response.status, data };
                throw error;
            }

            return data;
        } catch (err: any) {
            console.error('API Error:', err);
            throw err;
        }
    };

    // Auth methods
    const register = async (data: RegisterData) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            await apiRequest('/register', 'POST', data);
        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message }));
            throw err;
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const verifyOtp = async ({ email, otp, purpose }: OtpVerification & { purpose: string }) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const data = await apiRequest('/verify-otp', 'POST', { 
                email, 
                otp, 
                purpose 
            });

            // Only set authentication state if it's email verification or if token is returned
            if (data.token && data.user) {
                await AsyncStorage.setItem('token', data.token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));

                setState(prev => ({
                    ...prev,
                    user: data.user,
                    token: data.token,
                    isAuthenticated: true,
                }));
            }
            
            return data;
        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message }));
            throw err;
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const login = async ({ email, password }: LoginCredentials): Promise<{ user: User; token: string }> => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            const data = await apiRequest('/login', 'POST', { email, password }) as { user: User; token: string };

            // Store token and user data in AsyncStorage
            await Promise.all([
                AsyncStorage.setItem('token', data.token),
                AsyncStorage.setItem('user', JSON.stringify(data.user))
            ]);

            setState(prev => ({
                ...prev,
                user: data.user,
                token: data.token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            }));

            return { user: data.user, token: data.token };
        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message }));
            throw err;
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const forgotPassword = async (email: string) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            await apiRequest('/forgotpassword', 'POST', { email });
        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message }));
            throw err;
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const resetPassword = async ({ email, otp, password }: ResetPasswordData) => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            // Use the new resetpassword endpoint with email, otp, and password in body
            const data = await apiRequest('/resetpassword', 'PUT', {
                email,
                otp,
                password
            });

            if (!data.token || !data.user) {
                throw new Error('Invalid response from server');
            }

            // Store the user data and token
            await AsyncStorage.setItem('token', data.token);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));

            setState(prev => ({
                ...prev,
                user: data.user,
                token: data.token,
                isAuthenticated: true,
                isLoading: false,
            }));
        } catch (err: any) {
            console.error('Error in resetPassword:', err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to reset password';
            setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
            throw new Error(errorMessage);
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const resendOtp = async (email: string, purpose: string = 'email_verification') => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));
            await apiRequest('/resend-otp', 'POST', { email, purpose });
        } catch (err: any) {
            setState(prev => ({ ...prev, error: err.message }));
            throw err;
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const logout = async () => {
        try {
            // Clear all async storage items
            await AsyncStorage.multiRemove(['token', 'user']);
            
            // Reset state
            setState({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
            
            // Navigation will be handled by the RootLayoutNav component
        } catch (error) {
            console.error('Error during logout:', error);
            throw error;
        }
    };

    const clearError = () => {
        setState(prev => ({ ...prev, error: null }));
    };
    
    // Add a function to check if user is authenticated
    const isAuthenticated = (): boolean => {
        return state.isAuthenticated && !!state.token;
    };
    
    // Add a function to get user role
    const getUserRole = (): string | undefined => {
        return state.user?.role;
    };

    return (
        <AuthContext.Provider
            value={{
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                isLoading: state.isLoading,
                error: state.error,
                register,
                login,
                verifyOtp,
                forgotPassword,
                resetPassword,
                resendOtp,
                logout,
                clearError,
            }}
        >
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