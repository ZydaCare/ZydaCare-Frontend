import React, { useState, useRef, useEffect } from 'react';
import { StatusBar, SafeAreaView, KeyboardAvoidingView, Platform, Image, View, Alert, Text } from 'react-native';
import { Images } from '@/assets/Images';
import OtpInput from '@/components/OtpInput';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useToast } from '@/components/ui/Toast';

type LoginResponse = {
  user?: {
    role: string;
    [key: string]: any;
  };
  requiresVerification?: boolean;
  [key: string]: any;
};

type OtpFlowType = 'signup' | 'forgotPassword' | 'email_verification' | 'changeEmail' | 'twoFactorAuth';

type VerifyOtpResponse = {
  success: boolean;
  message?: string;
  [key: string]: any;
};

export default function OtpScreen() {
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<any>(null);
  const { verifyOtp, resendOtp, error, clearError } = useAuth() as {
    verifyOtp: (data: { email: string; otp: string; purpose: string }) => Promise<VerifyOtpResponse>;
    resendOtp: (data: { email: string; purpose: string }) => Promise<{ success: boolean; message?: string }>;
    login: (credentials: { email: string; password: string }) => Promise<LoginResponse>;
    error: string | null;
    clearError: () => void;
  };
  const [message, setMessage] = useState('');
  const { showToast } = useToast();
  
  // Get the flow type from URL params
  const { flow = 'signup', email: paramEmail = '' } = useLocalSearchParams<{
    flow?: OtpFlowType;
    email?: string;
  }>();
  
  // Get email from params or AsyncStorage
  const [email, setEmail] = useState<string>(paramEmail as string);
  
  useEffect(() => {
    const getEmail = async () => {
      if (!paramEmail) {
        const savedEmail = await AsyncStorage.getItem('verificationEmail');
        if (savedEmail) {
          setEmail(savedEmail);
        }
      } else {
        setEmail(paramEmail as string);
      }
    };
    getEmail();
  }, [paramEmail]);

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, []);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
      clearError();
    }
  }, [error]);

  const handleCodeFilled = async (code: string) => {
    if (!email) {
      showToast('Email is required for OTP verification', 'error');
      return;
    }

    try {
      setLoading(true);
      const purpose = flow === 'forgotPassword' ? 'password_reset' : 'email_verification';
      const response = await verifyOtp({ email, otp: code, purpose });

      if (response.success) {
        // If this was an email verification, clear the stored email
        if (flow === 'email_verification') {
          await AsyncStorage.removeItem('verificationEmail');
          
          // Try to log in the user automatically
          try {
            // const loginResponse = await login({ email, password: '' });
            // if (loginResponse?.user) {
              showToast('Email verified successfully!', 'success');
              router.replace('/(auth)/login');
              return;
            // }
          } catch (loginError) {
            console.log('Auto-login after verification failed, redirecting to login', loginError);
          }
          
          // If auto-login failed, redirect to login
          showToast('Email verified successfully! Please login.', 'success');
          router.replace('/(auth)/login');
          return;
        }

        // Handle other flows
        switch (flow) {
          case 'forgotPassword':
            router.push({
              pathname: '/(auth)/newPassword',
              params: { email, otp: code }
            });
            break;
            
          case 'signup':
          default:
            showToast('Email verified successfully! Please login.', 'success');
            router.replace('/(auth)/login');
            break;
        }
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to verify OTP. Please try again.';
      showToast(errorMessage, 'error');
      
      // Clear the OTP input on error
      if (otpRef.current) {
        otpRef.current.clear();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    console.log(`Resend code for ${flow} flow`);
    if (otpRef.current) {
      otpRef.current.clear();
    }
    
    if (!email) {
      showToast('Email is required to resend OTP', 'error');
      return;
    }
    
    try {
      // Determine the purpose based on flow
      const purpose = flow === 'forgotPassword' ? 'password_reset' : 'email_verification';
      
      await resendOtp({ email, purpose });
      showToast(flow === 'forgotPassword' ? 'New password reset OTP sent to your email' : 'New verification OTP sent to your email', 'success');
      setMessage(flow === 'forgotPassword' ? 'New password reset OTP sent to your email' : 'New verification OTP sent to your email');
    } catch (error: any) {
      console.error('Failed to resend OTP:', error);
      showToast('Failed to resend OTP. Please try again.', 'error');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6">
          {/* Logo and Branding */}
          <View className="items-center mt-16 mb-16">
            <Image source={Images.LogoIcon} className="w-[150px] h-[150px]" />
          </View>

          <OtpInput
            ref={otpRef}
            onCodeFilled={handleCodeFilled}
            onResendCode={handleResendCode}
            loading={loading}
            title={
              flow === 'forgotPassword' 
                ? 'Reset Your Password' 
                : flow === 'signup'
                ? 'Verify Your Email'
                : 'Enter Verification Code'
            }
            subtitle={
              flow === 'forgotPassword'
                ? `Enter the 5-digit code sent to ${email || 'your email'}`
                : 'Enter the 5-digit code sent to your email'
            }
            continueButtonText={
              flow === 'forgotPassword' 
                ? 'Verify Code' 
                : flow === 'signup'
                ? 'Verify Email'
                : 'Verify Code'
            }
            resendButtonText="Resend code"
            containerClassName="flex-1"
          />
        </View>
        {/* <Text className="text-center font-sans-semibold text-[16px] text-secondary mt-4">{message}</Text> */}
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}