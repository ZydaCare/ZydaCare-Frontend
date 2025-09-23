import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, View, StyleProp, TextStyle } from 'react-native';
import { twMerge } from 'tailwind-merge';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  children: React.ReactNode;
  onPress: () => void;
  className?: string;
  textClassName?: string;
  isLoading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  radius = 'md',
  children,
  onPress,
  className = '',
  textClassName = '',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  // Base classes
  const baseClasses = 'flex-row items-center justify-center';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    outline: 'border border-primary bg-transparent',
    ghost: 'bg-transparent',
  };

  // Size classes
  const sizeClasses = {
    sm: 'py-2 px-3',
    md: 'py-3 px-4',
    lg: 'py-4 px-6',
  };

  // Text color classes
  const textColorClasses = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: 'text-primary',
    ghost: 'text-primary',
  };

  // Radius classes
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  };

  // Disabled state
  const disabledClasses = disabled ? 'opacity-50' : 'opacity-100';

  // Combine all classes
  const buttonClasses = twMerge(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    radiusClasses[radius],
    disabledClasses,
    className
  );

  const textClasses = twMerge(
    'text-center font-medium',
    textColorClasses[variant],
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base',
    textClassName
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={buttonClasses}
      style={style}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'secondary' ? '#fff' : '#67A9AF'}
          size={size === 'sm' ? 'small' : 'large'}
          className="mr-2"
        />
      ) : leftIcon ? (
        <View className="mr-2">{leftIcon}</View>
      ) : null}
      
      <Text className={textClasses} style={textStyle}>
        {children}
      </Text>
      
      {rightIcon && !isLoading && <View className="ml-2">{rightIcon}</View>}
    </TouchableOpacity>
  );
};

export default Button;
