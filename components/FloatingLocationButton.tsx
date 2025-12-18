import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  Animated,
} from 'react-native';

interface FloatingLocationButtonProps {
  onPress: () => void;
  isSharing?: boolean;
}

export const FloatingLocationButton: React.FC<FloatingLocationButtonProps> = ({
  onPress,
  isSharing = false,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (isSharing) {
      // Pulse animation when sharing
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isSharing]);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute right-6 bottom-24 shadow-lg"
      style={{
        elevation: 8,
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
        }}
        className={`w-16 h-16 rounded-full items-center justify-center ${
          isSharing ? 'bg-green-500' : 'bg-primary'
        }`}
      >
        {isSharing && (
          <View className="absolute w-20 h-20 bg-green-500/30 rounded-full" />
        )}
        <Ionicons
          name={isSharing ? "navigate" : "location-outline"}
          size={28}
          color="#fff"
        />
      </Animated.View>
      
      {/* Live Indicator */}
      {isSharing && (
        <View className="absolute -top-1 -right-1 bg-white rounded-full p-1">
          <View className="w-3 h-3 bg-green-500 rounded-full" />
        </View>
      )}

      {/* Tooltip */}
      <View className="absolute -top-12 right-0 bg-gray-900 px-3 py-2 rounded-lg opacity-0 hover:opacity-100">
        <Text className="text-white text-xs font-sans-medium whitespace-nowrap">
          {isSharing ? 'Sharing Location' : 'Share Location'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};