export interface ProfileImage {
  public_id: string;
  url: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: ProfileImage;
  dob: Date;
  phone: string;
  gender: string;
  country: string;
  state: string;
  city: string;
  address: string;
  zipCode: string;
  role: 'patient' | 'doctor';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'patient' | 'doctor';
}

export interface ForgotPasswordData {
    email: string;
}

export interface VerifyOtpData {
    email: string;
    otp: string;
    purpose: 'email_verification' | 'password_reset';
}

export interface ResetPasswordData {
    email: string;
    otp: string;
    password: string;
}

export interface ResendOtpData {
    email: string;
    purpose: 'email_verification' | 'password_reset';
}