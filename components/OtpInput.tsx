import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OtpInputProps {
  codeLength?: number;
  onCodeFilled: (code: string) => void;
  onResendCode?: () => void;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  resendButtonText?: string;
  continueButtonText?: string;
  autoFocus?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

export interface OtpInputRef {
  clear: () => void;
  focus: () => void;
}

const OtpInput = forwardRef<OtpInputRef, OtpInputProps>(({
  codeLength = 5,
  onCodeFilled,
  onResendCode,
  title = 'Enter OTP',
  subtitle = 'Enter the verification code sent to you',
  loading = false,
  resendButtonText = 'Resend code',
  continueButtonText = 'Continue',
  autoFocus = true,
  containerClassName = '',
  inputClassName = 'w-14 h-14 border border-gray-300 rounded-lg text-center text-lg bg-gray-50 font-sans-semibold',
  titleClassName = 'text-black text-[22px] font-sans-semibold text-center mb-8',
  subtitleClassName = 'text-gray-600 text-center mb-12 leading-relaxed font-sans',
}, ref) => {
  const [otp, setOtp] = useState<string[]>(Array(codeLength).fill(''));
  const inputRefs = useRef<TextInput[]>([]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setOtp(Array(codeLength).fill(''));
      inputRefs.current[0]?.focus();
    },
    focus: () => {
      inputRefs.current[0]?.focus();
    }
  }));

  const handleOtpChange = (value: string, index: number) => {
    if (value && !/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input if there's a value and not the last input
    if (value && index < codeLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // If all fields are filled, call onCodeFilled
    if (newOtp.every(digit => digit !== '') && newOtp.length === codeLength) {
      onCodeFilled(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleContinue = () => {
    onCodeFilled(otp.join(''));
  };

  const isCodeComplete = otp.every(digit => digit !== '') && otp.length === codeLength;

  return (
    <View className={containerClassName}>
      {/* Title */}
      <Text className={titleClassName}>
        {title}
      </Text>

      {/* Subtitle */}
      <Text className={subtitleClassName}>
        {subtitle}
      </Text>

      {/* OTP Input */}
      <View className="flex-row justify-center mb-8 space-x-4">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              if (ref && !inputRefs.current.includes(ref)) {
                inputRefs.current[index] = ref;
              }
            }}
            className={`${inputClassName} ${index > 0 ? 'ml-3' : ''}`}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoFocus={autoFocus && index === 0}
          />
        ))}
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        className={`bg-secondary rounded-full py-4 items-center justify-center mb-6 ${!isCodeComplete ? 'opacity-50' : ''}`}
        onPress={handleContinue}
        disabled={!isCodeComplete || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text className="text-white text-base font-sans-semibold">{continueButtonText}</Text>
        )}
      </TouchableOpacity>

      {/* Resend Code */}
      {onResendCode && (
        <View className="flex-row justify-center items-center">
          <Text className="text-gray-600 text-sm font-sans">Didn't receive code? </Text>
          <TouchableOpacity onPress={onResendCode} disabled={loading}>
            <Text className="text-sm text-primary underline font-sans-semibold">
              {resendButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default OtpInput;
