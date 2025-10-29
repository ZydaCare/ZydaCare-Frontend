import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ConfirmationModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showCancel?: boolean;
  icon?: string;
  iconColor?: string;
  children?: React.ReactNode;
};

const ConfirmationModal: React.FC<{
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  showCancel?: boolean;
  icon?: string;
  iconColor?: string;
  children?: React.ReactNode;
}> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#67A9AF',
  onConfirm,
  onCancel,
  showCancel = true,
  icon = 'warning',
  iconColor = '#67A9AF',
  children,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 justify-center items-center p-4">
        <View className="bg-white rounded-2xl w-full max-w-md mx-4">
          <View className="p-6">
            <View className="items-center mb-4">
              <View className={`w-16 h-16 rounded-full ${iconColor} bg-opacity-10 items-center justify-center mb-3`}>
                <Ionicons name={icon as any} size={32} color={iconColor} />
              </View>
              <Text className="text-xl font-sans-bold text-gray-900 text-center">{title}</Text>
              <Text className="text-gray-600 text-center mt-2">{message}</Text>
            </View>

            {/* Custom content area */}
            <View className="mt-4">
              {children}
            </View>
          </View>

          <View className="px-6 pb-6 pt-2">
            <View className="space-y-3">
              <TouchableOpacity
                onPress={onConfirm}
                className={`py-3.5 rounded-xl items-center justify-center`}
                style={{ backgroundColor: confirmColor }}
              >
                <Text className="text-white font-sans-bold">{confirmText}</Text>
              </TouchableOpacity>

              {showCancel && (
                <TouchableOpacity
                  onPress={onCancel}
                  className="py-3.5 rounded-xl items-center justify-center border border-gray-200 mt-5"
                >
                  <Text className="text-gray-700 font-sans-medium">{cancelText}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;
