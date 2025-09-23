// types/auth.ts

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'patient' | 'doctor';
  isEmailVerified: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: 'patient' | 'doctor';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface OtpVerification {
  email: string;
  otp: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  password: string;
}

// New types for different OTP purposes
export type OtpPurpose = 'email_verification' | 'password_reset';

export interface OtpVerificationWithPurpose extends OtpVerification {
  purpose: OtpPurpose;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  user?: User;
}

export interface ApiError {
  message: string;
  response?: {
    status: number;
    data: any;
  };
}