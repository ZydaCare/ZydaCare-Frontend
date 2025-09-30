import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'info' | 'warning';

type ToastContextType = {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: () => void;
};

const { width } = Dimensions.get('window');
const TOAST_WIDTH = width - 40;

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showToast = useCallback((msg: string, toastType: ToastType = 'info', duration: number = 4000) => {
    setMessage(msg);
    setType(toastType);
    
    // Reset animations
    opacity.setValue(0);
    translateY.setValue(20);
    scale.setValue(0.95);
    
    setIsVisible(true);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Show animation with spring effect
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      })
    ]).start();

    // Auto hide after duration
    timeoutRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  }, [opacity, translateY, scale]);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
      Animated.spring(translateY, {
        toValue: -100,
        useNativeDriver: true,
      })
    ]).start(({ finished }) => {
      if (finished) {
        setIsVisible(false);
      }
    });
  }, [opacity, translateY]);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return '#67A9AF'; // primary
      case 'error': return '#DC2626';   // red-600 - slightly darker for better contrast
      case 'warning': return '#F59E0B'; // yellow-500
      default: return '#67A9AF';        // primary
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {isVisible && (
        <View className="absolute top-14 left-0 right-0 items-center z-50 px-5">
          <Animated.View 
            style={[{
              backgroundColor: getBgColor(),
              opacity,
              transform: [{ translateY }, { scale }],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
              width: TOAST_WIDTH,
            }]}
            className="p-4 rounded-xl flex-row items-center"
          >
            <View className="flex-row items-center flex-1">
              <Ionicons 
                name={getIcon() as any} 
                size={22} 
                color="white" 
                className="mt-0.5"
                style={{ marginRight: 12 }}
              />
              <Text 
                className="text-white font-sans-medium text-[15px] flex-1"
                style={{ lineHeight: 22 }}
              >
                {message}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={hideToast} 
              className="p-1 -mr-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
