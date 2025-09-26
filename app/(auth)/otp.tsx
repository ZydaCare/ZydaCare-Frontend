import React, { useState, useRef, useEffect } from 'react';
import { StatusBar, SafeAreaView, KeyboardAvoidingView, Platform, Image, View, Alert, Text } from 'react-native';
import { Images } from '@/assets/Images';
import OtpInput from '@/components/OtpInput';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/authContext';

type OtpFlowType = 'signup' | 'forgotPassword' | 'changeEmail' | 'twoFactorAuth';

export default function OtpScreen() {
  const [loading, setLoading] = useState(false);
  const otpRef = useRef<any>(null);
  const { verifyOtp, resendOtp, error, clearError } = useAuth();
  const [message, setMessage] = useState('');
  
  // Get the flow type from URL params
  const { flow = 'signup', email = '' } = useLocalSearchParams<{
    flow?: OtpFlowType;
    email?: string;
  }>();

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, []);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Verification Failed', error);
      clearError();
    }
  }, [error]);

  const handleCodeFilled = async (code: string) => {
    if (!email) {
      Alert.alert('Error', 'Email is required for OTP verification');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Verifying OTP for email:', email, 'Flow:', flow);
      
      // Determine the purpose based on flow
      const purpose = flow === 'forgotPassword' ? 'password_reset' : 'email_verification';
      
      const result = await verifyOtp({ 
        email, 
        otp: code, 
        purpose 
      });
      
      console.log('OTP verified successfully', result);
      
      // Handle navigation based on flow type
      switch (flow) {
        case 'forgotPassword':
          console.log('Navigating to new password screen with email and OTP');
          router.push({
            pathname: '/(auth)/newPassword',
            params: { 
              email,
              otp: code // Pass the OTP code to the new password screen
            }
          });
          break;
          
        case 'changeEmail':
          // Handle email change verification
          router.back();
          break;
          
        case 'signup':
        default:
          // For signup, user should be authenticated after email verification
          router.replace('/(patient)/(tabs)/home'); // or wherever authenticated users should go
          break;
      }
    } catch (error) {
      console.error('OTP verification failed:', error);
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
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
      Alert.alert('Error', 'Email is required to resend OTP');
      return;
    }
    
    try {
      // Determine the purpose based on flow
      const purpose = flow === 'forgotPassword' ? 'password_reset' : 'email_verification';
      
      await resendOtp({ email, purpose });
      setMessage(flow === 'forgotPassword' ? 'New password reset OTP sent to your email' : 'New verification OTP sent to your email');
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
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
        <Text className="text-center text-gray-500 mt-4">{message}</Text>
        
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}