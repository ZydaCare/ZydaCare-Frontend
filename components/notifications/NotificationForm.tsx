import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Modal, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToast } from '@/components/ui/Toast';
import { Notification, searchUsers, CreateNotificationData } from '@/api/admin/notifications';
import { User } from '@/types/User';

type NotificationType = 'info' | 'alert' | 'warning' | 'error' | 'update' | 'promotion' | 'appointment' | 'payment' | 'message' | 'reminder';

const notificationTypes: { value: NotificationType; label: string; icon: string; color: string }[] = [
  { value: 'info', label: 'Information', icon: 'information-circle', color: '#3B82F6' },
  { value: 'alert', label: 'Alert', icon: 'alert-circle', color: '#EF4444' },
  { value: 'warning', label: 'Warning', icon: 'warning', color: '#F59E0B' },
  { value: 'update', label: 'Update', icon: 'refresh-circle', color: '#8B5CF6' },
  { value: 'promotion', label: 'Promotion', icon: 'pricetag', color: '#EC4899' },
  { value: 'appointment', label: 'Appointment', icon: 'calendar', color: '#10B981' },
  { value: 'payment', label: 'Payment', icon: 'card', color: '#6366F1' },
  { value: 'message', label: 'Message', icon: 'chatbubbles', color: '#3B82F6' },
  { value: 'reminder', label: 'Reminder', icon: 'time', color: '#8B5CF6' },
];

interface NotificationFormProps {
  initialData?: Partial<CreateNotificationData>;
  onSubmit: (data: CreateNotificationData) => Promise<void>;
  isSubmitting: boolean;
}

const NotificationForm: React.FC<NotificationFormProps> = ({
  initialData = {},
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState<CreateNotificationData>({
    title: '',
    message: '',
    recipientType: 'all',
    type: 'info',
    ...initialData,
  });

  const [showDatePicker, setShowDatePicker] = useState<'scheduledAt' | 'expiresAt' | null>(null);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [showAdditionalData, setShowAdditionalData] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [additionalData, setAdditionalData] = useState<Record<string, any>>({});
  const [newDataKey, setNewDataKey] = useState('');
  const [newDataValue, setNewDataValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();
  const [isMounted, setIsMounted] = useState(true);


  // Load users when search query changes
  useEffect(() => {
    const loadUsers = async () => {
      if (searchQuery.length < 2) {
        setUsers([]);
        return;
      }

      try {
        setIsLoadingUsers(true);
        const response = await searchUsers(searchQuery);
        setUsers(response.data);
      } catch (error) {
        console.error('Error searching users:', error);
        showToast('Failed to search users', 'error');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    const timer = setTimeout(() => {
      loadUsers();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initialize additional data from form data
  useEffect(() => {
    if (formData.data && typeof formData.data === 'object') {
      setAdditionalData({ ...formData.data });
    }
  }, []);

  const handleAddData = () => {
    if (!newDataKey.trim()) {
      showToast('Please enter a key', 'error');
      return;
    }

    setAdditionalData(prev => ({
      ...prev,
      [newDataKey]: newDataValue || null,
    }));

    // Update form data
    setFormData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [newDataKey]: newDataValue || null,
      },
    }));

    // Reset form
    setNewDataKey('');
    setNewDataValue('');
  };

  const handleRemoveData = (key: string) => {
    const newData = { ...additionalData };
    delete newData[key];
    setAdditionalData(newData);

    // Update form data
    setFormData(prev => ({
      ...prev,
      data: newData,
    }));
  };

  const handleSelectUser = (user: User) => {
    setFormData(prev => ({
      ...prev,
      recipient: user._id,
      recipientName: `${user.firstName} ${user.lastName}`,
    }));
    setShowUserPicker(false);
    setSearchQuery('');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title cannot be more than 100 characters';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length > 500) {
      newErrors.message = 'Message cannot be more than 500 characters';
    }

    if (formData.recipientType === 'specific_user' && !formData.recipient) {
      newErrors.recipient = 'Please select a recipient';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      try {
        // Prepare the data to be submitted
        const submissionData = {
          ...formData,
          // Include patient field if recipient is a specific user
          ...(formData.recipientType === 'specific_user' && formData.recipient 
            ? { 
                patient: formData.recipient,
                recipient: formData.recipient
              }
            : {}),
          // Convert additionalData to a Map if it exists
          data: additionalData && Object.keys(additionalData).length > 0 
            ? new Map(Object.entries(additionalData))
            : undefined,
          // Ensure required fields are included
          type: formData.type || 'info',
        };

        await onSubmit(submissionData);
      } catch (error) {
        console.error('Error submitting notification:', error);
        showToast('Failed to send notification', 'error');
      }
    }
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return 'Not set';
    const d = new Date(date);
    return d.toLocaleString();
  };

  const handleDateChange = (field: 'scheduledAt' | 'expiresAt', event: any, date?: Date) => {
    // Only update if the component is still mounted
    if (!isMounted) return;

    // Always close the picker first (Android behavior)
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }

    // Only update if user didn't cancel and date exists
    if (event.type === 'set' && date) {
      setFormData(prev => ({
        ...prev,
        [field]: date,
      }));
    } else if (event.type === 'dismissed') {
      // Handle Android back button press
      setShowDatePicker(null);
    }
  };

  // Add cleanup in useEffect
  useEffect(() => {
    return () => {
      setIsMounted(false);
      // Ensure picker is dismissed when component unmounts
      if (Platform.OS === 'android' && showDatePicker) {
        setShowDatePicker(null);
      }
    };
  }, [showDatePicker]);

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Recipient Type */}
      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-2">
          Send To <Text className="text-red-500">*</Text>
        </Text>
        <View className="flex-row flex-wrap -mx-1">
          {[
            { value: 'all', label: 'All Users', icon: 'people' },
            { value: 'patients', label: 'Patients', icon: 'medkit' },
            { value: 'doctors', label: 'Doctors', icon: 'medal' },
            { value: 'specific_user', label: 'Specific User', icon: 'person' },
          ].map(({ value, label, icon }) => (
            <TouchableOpacity
              key={value}
              onPress={() => setFormData({ ...formData, recipientType: value as any })}
              className={`m-1 px-3 py-2 rounded-lg border ${formData.recipientType === value
                ? 'bg-primary border-primary'
                : 'bg-white border-gray-300'
                }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={icon as any}
                  size={16}
                  color={formData.recipientType === value ? 'white' : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`text-sm font-sans ${formData.recipientType === value ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {errors.recipientType && (
          <Text className="text-red-500 text-xs mt-1 font-sans">
            {errors.recipientType}
          </Text>
        )}
      </View>

      {/* Specific User Picker (Conditional) */}
      {formData.recipientType === 'specific_user' && (
        <View className="mb-4">
          <Text className="text-sm font-sans-medium text-gray-700 mb-1">
            Select User <Text className="text-red-500">*</Text>
          </Text>
          <TouchableOpacity
            className={`border ${errors.recipient ? 'border-red-500' : 'border-gray-300'
              } rounded-lg px-4 py-3`}
            onPress={() => setShowUserPicker(true)}
            disabled={isSubmitting}
          >
            <Text className={`font-sans ${formData.recipient ? 'text-gray-900' : 'text-gray-400'
              }`}>
              {formData.recipientName || 'Select a user'}
            </Text>
          </TouchableOpacity>
          {errors.recipient && (
            <Text className="text-red-500 text-xs mt-1 font-sans">
              {errors.recipient}
            </Text>
          )}

          {/* User Picker Modal */}
          <Modal
            visible={showUserPicker}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowUserPicker(false)}
          >
            <View className="flex-1 bg-black/50 justify-center p-4">
              <View className="bg-white rounded-xl p-4 max-h-[80%]">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-sans-bold text-gray-900">
                    Select User
                  </Text>
                  <TouchableOpacity onPress={() => setShowUserPicker(false)}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <View className="border border-gray-200 rounded-lg mb-4">
                  <View className="flex-row items-center px-3 py-2 border-b border-gray-100">
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 ml-2 font-sans"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                    />
                  </View>

                  <View className="max-h-64">
                    {isLoadingUsers ? (
                      <View className="py-4">
                        <ActivityIndicator size="small" color="#67A9AF" />
                      </View>
                    ) : users.length > 0 ? (
                      <FlatList
                        data={users}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            className="px-4 py-3 border-b border-gray-100"
                            onPress={() => handleSelectUser(item)}
                          >
                            <Text className="font-sans-medium text-gray-900">
                              {item.firstName} {item.lastName}
                            </Text>
                            <Text className="text-sm text-gray-500 font-sans">
                              {item.email}
                            </Text>
                            <Text className="text-xs text-gray-400 font-sans mt-1">
                              {item.role}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    ) : searchQuery.length >= 2 ? (
                      <View className="py-4 items-center">
                        <Ionicons name="search" size={32} color="#9CA3AF" />
                        <Text className="text-gray-500 mt-2 font-sans">
                          No users found
                        </Text>
                      </View>
                    ) : (
                      <View className="py-4 items-center">
                        <Ionicons name="people" size={32} color="#9CA3AF" />
                        <Text className="text-gray-500 mt-2 font-sans text-center px-4">
                          Search for users by name or email
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-primary rounded-lg py-3 items-center mt-2"
                  onPress={() => setShowUserPicker(false)}
                >
                  <Text className="text-white font-sans-medium">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {/* Notification Type */}
      <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-2">
          Notification Type
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
          {notificationTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              onPress={() => setFormData({ ...formData, type: type.value })}
              className={`m-1 px-3 py-2 rounded-lg border ${formData.type === type.value
                ? 'border-primary bg-primary/10'
                : 'border-gray-200 bg-white'
                }`}
              style={{
                borderLeftWidth: formData.type === type.value ? 3 : 1,
                borderLeftColor: formData.type === type.value ? type.color : '#E5E7EB',
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={type.icon as any}
                  size={16}
                  color={formData.type === type.value ? type.color : '#6B7280'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`text-sm font-sans ${formData.type === type.value ? 'text-gray-900' : 'text-gray-600'
                    }`}
                >
                  {type.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Title */}
      <View className="mb-4">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          Title <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`border ${errors.title ? 'border-red-500' : 'border-gray-300'
            } rounded-lg px-4 py-3 font-sans`}
          placeholder="Enter notification title"
          value={formData.title}
          onChangeText={(text) =>
            setFormData({ ...formData, title: text })
          }
          maxLength={100}
          editable={!isSubmitting}
        />
        <View className="flex-row justify-between mt-1">
          {errors.title ? (
            <Text className="text-red-500 text-xs font-sans">
              {errors.title}
            </Text>
          ) : (
            <View />
          )}
          <Text className="text-xs text-gray-500 font-sans">
            {formData.title.length}/100
          </Text>
        </View>
      </View>

      {/* Message */}
      <View className="mb-4">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          Message <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`border ${errors.message ? 'border-red-500' : 'border-gray-300'
            } rounded-lg px-4 py-3 h-32 text-justify font-sans`}
          placeholder="Enter notification message"
          value={formData.message}
          onChangeText={(text) =>
            setFormData({ ...formData, message: text })
          }
          multiline
          maxLength={500}
          textAlignVertical="top"
          editable={!isSubmitting}
        />
        <View className="flex-row justify-between mt-1">
          {errors.message ? (
            <Text className="text-red-500 text-xs font-sans">
              {errors.message}
            </Text>
          ) : (
            <View />
          )}
          <Text className="text-xs text-gray-500 font-sans">
            {formData.message.length}/500
          </Text>
        </View>
      </View>

      {/* Scheduled At */}
      {/* <View className="mb-4">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          Schedule
        </Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-lg px-4 py-3"
          onPress={() => setShowDatePicker('scheduledAt')}
          disabled={isSubmitting}
        >
          <Text className="text-gray-900 font-sans">
            {formData.scheduledAt
              ? `Scheduled for: ${formatDate(formData.scheduledAt)}`
              : 'Send immediately'}
          </Text>
        </TouchableOpacity>
        {showDatePicker === 'scheduledAt' && (
          <DateTimePicker
            value={formData.scheduledAt ? new Date(formData.scheduledAt) : new Date()}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(event, date) => {
              handleDateChange('scheduledAt', event, date);
              // On Android, we need to close the picker after selection
              if (Platform.OS === 'android') {
                setShowDatePicker(null);
              }
            }}
          />
        )}

      </View> */}

      {/* Expires At */}
      {/* <View className="mb-6">
        <Text className="text-sm font-sans-medium text-gray-700 mb-1">
          Expiration (Optional)
        </Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-lg px-4 py-3"
          onPress={() => setShowDatePicker('expiresAt')}
          disabled={isSubmitting}
        >
          <Text className="text-gray-900 font-sans">
            {formData.expiresAt
              ? `Expires at: ${formatDate(formData.expiresAt)}`
              : 'No expiration'}
          </Text>
        </TouchableOpacity>
        {showDatePicker === 'expiresAt' && (
          <DateTimePicker
            value={formData.expiresAt ? new Date(formData.expiresAt) : new Date()}
            mode="datetime"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={formData.scheduledAt ? new Date(formData.scheduledAt) : new Date()}
            onChange={(event, date) => {
              handleDateChange('expiresAt', event, date);
              // On Android, we need to close the picker after selection
              if (Platform.OS === 'android') {
                setShowDatePicker(null);
              }
            }}
          />
        )}
      </View> */}

      {/* Additional Data (Optional) */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-sans-medium text-gray-700">
            Additional Data (Optional)
          </Text>
          <TouchableOpacity
            className="text-primary text-sm font-sans-medium"
            onPress={() => setShowAdditionalData(true)}
            disabled={isSubmitting}
          >
            <Text className="text-primary font-sans-medium">
              {Object.keys(additionalData).length > 0 ? 'Edit Data' : 'Add Data'}
            </Text>
          </TouchableOpacity>
        </View>

        {Object.keys(additionalData).length > 0 ? (
          <View className="border border-gray-200 rounded-lg p-3">
            {Object.entries(additionalData).map(([key, value]) => (
              <View key={key} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <View className="flex-1">
                  <Text className="text-sm font-sans-medium text-gray-700">{key}</Text>
                  <Text
                    className="text-sm text-gray-500 font-sans mt-1"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {value === null ? 'null' :
                      typeof value === 'object' ? JSON.stringify(value) :
                        String(value)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveData(key)}
                  disabled={isSubmitting}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <TouchableOpacity
            className="border border-dashed border-gray-300 rounded-lg p-4 items-center"
            onPress={() => setShowAdditionalData(true)}
            disabled={isSubmitting}
          >
            <Ionicons name="add-circle-outline" size={24} color="#9CA3AF" />
            <Text className="text-gray-500 text-sm mt-1 text-center font-sans">
              Add deep link data or custom payload
            </Text>
          </TouchableOpacity>
        )}

        {/* Additional Data Modal */}
        <Modal
          visible={showAdditionalData}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAdditionalData(false)}
        >
          <View className="flex-1 bg-black/50 justify-center p-4">
            <View className="bg-white rounded-xl p-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-sans-bold text-gray-900">
                  Additional Data
                </Text>
                <TouchableOpacity onPress={() => setShowAdditionalData(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View className="space-y-3 mb-4">
                <View>
                  <Text className="text-sm font-sans-medium text-gray-700 mb-1">
                    Key
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 font-sans"
                    placeholder="e.g., screen, id, url"
                    value={newDataKey}
                    onChangeText={setNewDataKey}
                    autoCapitalize="none"
                  />
                </View>

                <View>
                  <Text className="text-sm font-sans-medium text-gray-700 mb-1">
                    Value (leave empty for null)
                  </Text>
                  <TextInput
                    className="border border-gray-300 rounded-lg px-3 py-2 font-sans"
                    placeholder="e.g., home, 123, https://example.com"
                    value={newDataValue}
                    onChangeText={setNewDataValue}
                  />
                </View>

                <TouchableOpacity
                  className="bg-primary rounded-lg py-3 items-center mt-2"
                  onPress={handleAddData}
                >
                  <Text className="text-white font-sans-medium">
                    Add Data
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="mt-4">
                <Text className="text-sm font-sans-medium text-gray-700 mb-2">
                  Current Data
                </Text>
                {Object.keys(additionalData).length > 0 ? (
                  <View className="border border-gray-200 rounded-lg p-3">
                    {Object.entries(additionalData).map(([key, value]) => (
                      <View key={key} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <View className="flex-1">
                          <Text className="text-sm font-sans-medium text-gray-900">{key}</Text>
                          <Text className="text-xs text-gray-500 font-sans">
                            {value === null ? 'null' :
                              typeof value === 'object' ? JSON.stringify(value) :
                                String(value)}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleRemoveData(key)}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="border border-dashed border-gray-300 rounded-lg p-4 items-center">
                    <Ionicons name="document-text-outline" size={24} color="#9CA3AF" />
                    <Text className="text-gray-500 text-sm mt-1 text-center font-sans">
                      No additional data added yet
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                className="bg-primary rounded-lg py-3 items-center mt-6"
                onPress={() => setShowAdditionalData(false)}
              >
                <Text className="text-white font-sans-medium">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        className={`bg-primary rounded-lg py-3 items-center justify-center mb-8 ${isSubmitting ? 'opacity-70' : ''
          }`}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text className="text-white font-sans-medium text-base">
            Send Notification
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default NotificationForm;