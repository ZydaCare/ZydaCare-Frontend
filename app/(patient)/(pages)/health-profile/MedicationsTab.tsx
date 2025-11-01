import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Platform, Modal } from 'react-native';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToast } from '@/components/ui/Toast';
import { medicationsApi, conditionsApi, healthProfileApi, Medication, Condition, NotificationPreferences } from '@/api/patient/healthProfile';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function MedicationsTab() {
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [conditionModalVisible, setConditionModalVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [showConditionForm, setShowConditionForm] = useState(false);
  const [conditionSeverity, setConditionSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [conditionNotes, setConditionNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [medications, setMedications] = useState<Medication[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
  const [tempTime, setTempTime] = useState(new Date());
  const [newMedication, setNewMedication] = useState<Medication>({
    drugName: '',
    dosage: '',
    frequency: 'daily',
    time: '09:00',
    timesPerDay: ['morning'],
    specificDays: [],
    notes: '',
    enabled: true
  });

  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    medicationReminders: {
      enabled: true,
      sound: 'default',
      advanceNotice: { value: 15, unit: 'minutes' }
    },
    healthAlerts: {
      enabled: true
    }
  });

  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
    registerForPushNotifications();
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const medicationId = response.notification.request.content.data.medicationId;
      if (medicationId) {
        handleMedicationTaken(medicationId as string);
      }
    });

    return () => subscription.remove();
  }, []);

  const fetchData = async () => {
    const token = await AsyncStorage.getItem('token');

    try {
      const [conditionsData, medicationsData, remindersData, profileData] = await Promise.all([
        conditionsApi.getConditions(token!),
        medicationsApi.getMedications(token!),
        medicationsApi.getUpcomingReminders(token!),
        healthProfileApi.getHealthProfile(token!)
      ]);

      setConditions(conditionsData);
      setMedications(medicationsData);
      setUpcomingReminders(remindersData);

      if (profileData.notificationPreferences) {
        setNotificationPreferences(profileData.notificationPreferences);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      showToast('Failed to load data', 'error');
    }
  };

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      showToast('Please enable notifications in settings', 'error');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medication-reminders', {
        name: 'Medication Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#67A9AF',
        sound: 'default',
      });
    }
  };

  // Time Picker Handlers
  const showTimePicker = () => {
    // Parse current time string to Date object
    const [hours, minutes] = newMedication.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setTempTime(date);
    setTimePickerVisible(true);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setTimePickerVisible(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setTempTime(selectedDate);
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      setNewMedication({ ...newMedication, time: timeString });

      if (Platform.OS === 'ios') {
        // iOS picker stays open, will close on "Done" button
      }
    }
  };

  const confirmIOSTime = () => {
    setTimePickerVisible(false);
  };

  // Condition handlers
  const handleAddCondition = async () => {
    if (!newCondition.trim()) {
      showToast('Please enter a condition name', 'error');
      return;
    }

    const token = await AsyncStorage.getItem('token');

    try {
      await conditionsApi.addCondition(token!, {
        name: newCondition,
        severity: conditionSeverity,
        notes: conditionNotes || undefined,
        isActive: true
      });

      setNewCondition('');
      setConditionSeverity('moderate');
      setConditionNotes('');
      setShowConditionForm(false);

      const conditions = await conditionsApi.getConditions(token!);
      setConditions(conditions);
      showToast('Condition added successfully', 'success');
    } catch (error: any) {
      console.error('Error adding condition:', error);
      showToast(error.response?.data?.error || 'Failed to add condition', 'error');
    }
  };

  const handleRemoveCondition = (condition: { name: string }) => {
    setSelectedCondition(condition);
    setConditionModalVisible(true);
  };

  const confirmRemoveCondition = async () => {
    if (!selectedCondition) return;

    const token = await AsyncStorage.getItem('token');
    try {
      await conditionsApi.removeCondition(token!, selectedCondition.name);
      const conditions = await conditionsApi.getConditions(token!);
      setConditions(conditions);
      setConditionModalVisible(false);
      setSelectedCondition(null);
      showToast('Condition removed successfully', 'success');
    } catch (error: any) {
      console.error('Error removing condition:', error);
      showToast(error.response?.data?.error || 'Failed to remove condition', 'error');
    }
  };

  // Medication handlers
  const handleAddMedication = async () => {
    if (!newMedication.drugName || !newMedication.dosage) {
      showToast('Please provide medication name and dosage', 'error');
      return;
    }

    if (newMedication.frequency === 'weekly' && (!newMedication.specificDays || newMedication.specificDays.length === 0)) {
      showToast('Please select at least one day for weekly medication', 'error');
      return;
    }

    if (newMedication.frequency !== 'as_needed' && !newMedication.time) {
      showToast('Please provide a time for the medication', 'error');
      return;
    }

    const token = await AsyncStorage.getItem('token');

    try {
      await medicationsApi.addMedication(token!, {
        drugName: newMedication.drugName,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        time: newMedication.time,
        timesPerDay: newMedication.frequency === 'daily' ? newMedication.timesPerDay : undefined,
        specificDays: newMedication.frequency === 'weekly' ? newMedication.specificDays : undefined,
        notes: newMedication.notes,
        enabled: newMedication.enabled
      });

      setShowMedicationForm(false);
      setNewMedication({
        drugName: '', dosage: '', frequency: 'daily', time: '09:00',
        timesPerDay: ['morning'], specificDays: [], notes: '', enabled: true
      });

      const [meds, reminders] = await Promise.all([
        medicationsApi.getMedications(token!),
        medicationsApi.getUpcomingReminders(token!)
      ]);
      setMedications(meds);
      setUpcomingReminders(reminders);

      showToast('Medication added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding medication:', error);
      showToast(error.response?.data?.error || 'Failed to add medication', 'error');
    }
  };

  const handleToggleMedication = async (medicationId: string, enabled: boolean) => {
    const token = await AsyncStorage.getItem('token');

    try {
      await medicationsApi.updateMedication(token!, medicationId, { enabled });

      const updatedMeds = medications.map(med =>
        med._id === medicationId ? { ...med, enabled } : med
      );
      setMedications(updatedMeds);

      const reminders = await medicationsApi.getUpcomingReminders(token!);
      setUpcomingReminders(reminders);

      showToast(enabled ? 'Medication enabled' : 'Medication disabled', 'success');
    } catch (error: any) {
      console.error('Error toggling medication:', error);
      showToast(error.response?.data?.error || 'Failed to update medication', 'error');
    }
  };

  const handleDeleteMedication = (medicationId: string) => {
    setSelectedMedicationId(medicationId);
    setDeleteModalVisible(true);
  };

  const confirmDeleteMedication = async () => {
    if (!selectedMedicationId) return;

    const token = await AsyncStorage.getItem('token');
    setIsLoading(true);
    try {
      await medicationsApi.deleteMedication(token!, selectedMedicationId);

      const [meds, reminders] = await Promise.all([
        medicationsApi.getMedications(token!),
        medicationsApi.getUpcomingReminders(token!)
      ]);

      setMedications(meds);
      setUpcomingReminders(reminders);
      setIsLoading(false);
      setDeleteModalVisible(false);
      setSelectedMedicationId(null);
      showToast('Medication deleted successfully', 'success');
    } catch (error: any) {
      console.error('Error deleting medication:', error);
      showToast(error.response?.data?.error || 'Failed to delete medication', 'error');
      setIsLoading(false);
    }
  };

  const handleMedicationTaken = async (medicationId: string) => {
    const token = await AsyncStorage.getItem('token');

    try {
      await medicationsApi.markMedicationTaken(token!, medicationId);

      const [meds, reminders] = await Promise.all([
        medicationsApi.getMedications(token!),
        medicationsApi.getUpcomingReminders(token!)
      ]);
      setMedications(meds);
      setUpcomingReminders(reminders);

      showToast('Medication marked as taken', 'success');
    } catch (error: any) {
      console.error('Error marking medication as taken:', error);
      showToast(error.response?.data?.error || 'Failed to mark medication as taken', 'error');
    }
  };

  const handleUpdateNotificationPreferences = async () => {
    const token = await AsyncStorage.getItem('token');

    try {
      await healthProfileApi.updateNotificationPreferences(token!, notificationPreferences);
      showToast('Notification preferences updated', 'success');
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      showToast(error.response?.data?.error || 'Failed to update preferences', 'error');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#67A9AF" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-4">
      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
          <View className="flex-row items-center mb-3">
            <Ionicons name="time-outline" size={20} color="#1e40af" />
            <Text className="text-base font-sans-semibold text-blue-900 ml-2">
              Upcoming Reminders
            </Text>
          </View>
          {upcomingReminders.slice(0, 3).map((reminder) => (
            <View key={reminder._id} className="mb-2 bg-white rounded-lg p-3">
              <Text className="text-blue-800 font-sans-medium">{reminder.drugName}</Text>
              <Text className="text-blue-600 text-sm font-sans">
                {new Date(reminder.nextReminder).toLocaleString()} • {reminder.dosage}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Health Conditions */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name="pulse-outline" size={22} color="#67A9AF" />
            <Text className="text-lg font-sans-semibold ml-2">Health Conditions</Text>
          </View>
          <TouchableOpacity
            className="bg-primary/10 p-2 rounded-lg"
            onPress={() => setShowConditionForm(!showConditionForm)}
          >
            <Ionicons name={showConditionForm ? "close" : "add"} size={20} color="#67A9AF" />
          </TouchableOpacity>
        </View>

        {showConditionForm && (
          <View className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3 bg-white font-sans-medium text-[13px] text-gray-700"
              placeholder="Condition name (e.g., Type 2 Diabetes)"
              placeholderTextColor='#9ca3af'
              value={newCondition}
              onChangeText={setNewCondition}
            />

            <View className="mb-3">
              <Text className="text-gray-700 mb-2 font-sans-medium">Severity</Text>
              <View className="border border-gray-300 rounded-lg bg-white">
                <Picker
                  selectedValue={conditionSeverity}
                  onValueChange={(itemValue) => setConditionSeverity(itemValue)}
                >
                  <Picker.Item label="Mild" value="mild" />
                  <Picker.Item label="Moderate" value="moderate" />
                  <Picker.Item label="Severe" value="severe" />
                </Picker>
              </View>
            </View>

            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4 bg-white font-sans-medium text-[13px] text-gray-700"
              placeholder="Notes (optional)"
              placeholderTextColor='#9ca3af'
              value={conditionNotes}
              onChangeText={setConditionNotes}
              multiline
              numberOfLines={3}
            />

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-gray-200 py-3 rounded-lg"
                onPress={() => {
                  setShowConditionForm(false);
                  setNewCondition('');
                  setConditionSeverity('moderate');
                  setConditionNotes('');
                }}
              >
                <Text className="text-center font-sans-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-lg"
                onPress={handleAddCondition}
              >
                <Text className="text-white text-center font-sans-medium">Add Condition</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {conditions.map((condition, index) => (
          <View key={index} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-sans-medium text-base mb-1">{condition.name}</Text>
                <View className="flex-row items-center flex-wrap mt-1">
                  <View className={`px-2 py-1 rounded mr-2 ${condition.severity === 'mild' ? 'bg-green-100' :
                    condition.severity === 'moderate' ? 'bg-yellow-100' :
                      'bg-red-100'
                    }`}>
                    <Text className={`text-xs font-sans-medium ${condition.severity === 'mild' ? 'text-green-700' :
                      condition.severity === 'moderate' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                      {condition.severity?.toUpperCase() || 'MODERATE'}
                    </Text>
                  </View>
                  {condition.isActive !== false && (
                    <View className="bg-blue-100 px-2 py-1 rounded">
                      <Text className="text-xs text-blue-700 font-sans-medium">ACTIVE</Text>
                    </View>
                  )}
                </View>
                {condition.diagnosisDate && (
                  <Text className="text-gray-500 font-sans text-xs mt-2">
                    📅 Diagnosed: {new Date(condition.diagnosisDate).toLocaleDateString()}
                  </Text>
                )}
                {condition.notes && (
                  <Text className="text-gray-600 font-sans text-sm mt-2">{condition.notes}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveCondition(condition)}
                className="ml-2"
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {conditions.length === 0 && !showConditionForm && (
          <View className="py-6 items-center">
            <Ionicons name="pulse-outline" size={40} color="#d1d5db" />
            <Text className="text-gray-500 font-sans text-center mt-2 text-sm">
              No conditions added yet
            </Text>
          </View>
        )}
      </View>

      {/* Medications */}
      <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name="medical-outline" size={22} color="#67A9AF" />
            <Text className="text-lg font-sans-semibold ml-2">Medications</Text>
          </View>
          <TouchableOpacity
            className="bg-primary/10 p-2 rounded-lg"
            onPress={() => setShowMedicationForm(!showMedicationForm)}
          >
            <Ionicons name={showMedicationForm ? "close" : "add"} size={20} color="#67A9AF" />
          </TouchableOpacity>
        </View>

        {showMedicationForm && (
          <View className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
            <Text className="font-sans-semibold mb-3">Add New Medication</Text>

            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3 bg-white font-sans-medium text-[13px] text-gray-700"
              placeholder="Medication Name (e.g., Aspirin)"
              placeholderTextColor='#9ca3af'
              value={newMedication.drugName}
              onChangeText={(text) => setNewMedication({ ...newMedication, drugName: text })}
            />

            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3 bg-white font-sans-medium text-[13px] text-gray-700"
              placeholder="Dosage (e.g., 500mg, 2 tablets)"
              placeholderTextColor='#9ca3af'
              value={newMedication.dosage}
              onChangeText={(text) => setNewMedication({ ...newMedication, dosage: text })}
            />

            <View className="mb-3">
              <Text className="text-gray-700 mb-2 font-sans-medium">Frequency</Text>
              <View className="border border-gray-300 rounded-lg bg-white">
                <Picker
                  selectedValue={newMedication.frequency}
                  onValueChange={(itemValue) => setNewMedication({ ...newMedication, frequency: itemValue })}
                  style={{ color: 'gray', fontSize: 10, fontFamily: 'Inter_400Regular' }}
                >
                  <Picker.Item label="Daily" value="daily" />
                  <Picker.Item label="Weekly" value="weekly" />
                  <Picker.Item label="Monthly" value="monthly" />
                  <Picker.Item label="As Needed" value="as_needed" />
                </Picker>
              </View>
            </View>

            {newMedication.frequency === 'weekly' && (
              <View className="mb-3">
                <Text className="text-gray-700 mb-2 font-sans-medium">Select Days</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <TouchableOpacity
                      key={day}
                      className={`px-3 py-2 rounded-lg ${newMedication.specificDays?.includes(day) ? 'bg-primary' : 'bg-gray-200'}`}
                      onPress={() => {
                        const days = newMedication.specificDays || [];
                        const newDays = days.includes(day) ? days.filter(d => d !== day) : [...days, day];
                        setNewMedication({ ...newMedication, specificDays: newDays });
                      }}
                    >
                      <Text className={newMedication.specificDays?.includes(day) ? 'text-white font-sans-medium text-xs' : 'text-gray-700 font-sans-medium text-xs'}>
                        {day.slice(0, 3).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {newMedication.frequency !== 'as_needed' && (
              <View className="mb-3">
                <Text className="text-gray-700 mb-2 font-sans-medium">Reminder Time</Text>
                <TouchableOpacity
                  className="border border-gray-300 rounded-lg p-3 bg-white flex-row items-center justify-between"
                  onPress={showTimePicker}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={20} color="#67A9AF" />
                    <Text className="ml-2 text-gray-700 font-sans-medium">
                      {newMedication.time || 'Select Time'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            )}

            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3 bg-white font-sans-medium text-[13px] text-gray-700"
              placeholder="Notes (optional)"
              placeholderTextColor='#9ca3af'
              value={newMedication.notes}
              onChangeText={(text) => setNewMedication({ ...newMedication, notes: text })}
              multiline
              numberOfLines={2}
            />

            <View className="flex-row justify-between items-center mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <Text className="text-gray-700 font-sans-medium">Enable Reminders</Text>
              <Switch
                value={newMedication.enabled}
                onValueChange={(value) => setNewMedication({ ...newMedication, enabled: value })}
                trackColor={{ false: '#e5e7eb', true: '#67A9AF' }}
                thumbColor={newMedication.enabled ? '#67A9AF' : '#9ca3af'}
              />
            </View>

            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 bg-gray-200 py-3 rounded-lg"
                onPress={() => {
                  setShowMedicationForm(false);
                  setNewMedication({
                    drugName: '', dosage: '', frequency: 'daily', time: '09:00',
                    timesPerDay: ['morning'], specificDays: [], notes: '', enabled: true
                  });
                }}
              >
                <Text className="text-center font-sans-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-lg"
                onPress={handleAddMedication}
              >
                <Text className="text-white text-center font-sans-medium">Add Medication</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Medications List */}
        {medications.map((med) => (
          <View key={med._id} className="border-b border-gray-100 py-3">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="font-sans-medium text-base">{med.drugName}</Text>
                <Text className="text-gray-500 font-sans text-sm">{med.dosage} • {med.frequency}</Text>
                {med.time && (
                  <Text className="text-gray-500 font-sans text-sm">⏰ {med.time}</Text>
                )}
                {med.specificDays && med.specificDays.length > 0 && (
                  <Text className="text-gray-500 font-sans text-xs mt-1">
                    📅 {med.specificDays.map(d => d.slice(0, 3).toUpperCase()).join(', ')}
                  </Text>
                )}
                {med.lastTaken && (
                  <Text className="text-green-600 font-sans text-xs mt-1">
                    ✓ Last: {new Date(med.lastTaken).toLocaleString()}
                  </Text>
                )}
                {med.nextReminder && med.enabled && (
                  <Text className="text-blue-600 font-sans text-xs">
                    📅 Next: {new Date(med.nextReminder).toLocaleString()}
                  </Text>
                )}
                {med.notes && (
                  <Text className="text-gray-600 font-sans text-sm mt-1">📝 {med.notes}</Text>
                )}
              </View>
              <View className="flex-row items-center ml-2">
                <Switch
                  value={med.enabled}
                  onValueChange={(value) => handleToggleMedication(med._id!, value)}
                  trackColor={{ false: '#e5e7eb', true: '#67A9AF' }}
                  thumbColor={med.enabled ? '#67A9AF' : '#9ca3af'}
                />
                <TouchableOpacity
                  className="ml-2"
                  onPress={() => handleDeleteMedication(med._id!)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
            {med.enabled && (
              <TouchableOpacity
                className="bg-green-50 border border-green-200 py-2 px-3 rounded-lg"
                onPress={() => handleMedicationTaken(med._id!)}
              >
                <Text className="text-green-700 text-center text-sm font-sans-medium">✓ Mark as Taken</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {medications.length === 0 && !showMedicationForm && (
          <View className="py-6 items-center">
            <Ionicons name="medical-outline" size={40} color="#d1d5db" />
            <Text className="text-gray-500 text-center mt-2 font-sans text-sm">
              No medications added yet
            </Text>
          </View>
        )}
      </View>

      {/* Notification Preferences */}
      <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <View className="flex-row items-center mb-3">
          <Ionicons name="notifications-outline" size={22} color="#67A9AF" />
          <Text className="text-lg font-sans-semibold ml-2">Notification Settings</Text>
        </View>

        <View className="flex-row justify-between items-center mb-3 p-3 bg-gray-50 rounded-lg">
          <View className="flex-1">
            <Text className="text-gray-700 font-sans-medium">Medication Reminders</Text>
            <Text className="text-gray-500 font-sans text-xs">Get notified for medications</Text>
          </View>
          <Switch
            value={notificationPreferences.medicationReminders.enabled}
            onValueChange={(value) => setNotificationPreferences({
              ...notificationPreferences,
              medicationReminders: { ...notificationPreferences.medicationReminders, enabled: value }
            })}
            trackColor={{ false: '#e5e7eb', true: '#67A9AF' }}
            thumbColor={notificationPreferences.medicationReminders.enabled ? '#67A9AF' : '#9ca3af'}
          />
        </View>

        {notificationPreferences.medicationReminders.enabled && (
          <View className="mb-3 pl-4 border-l-2 border-primary/30 ml-2">
            <Text className="text-gray-700 text-sm font-sans-medium mb-2">Advance Notice</Text>
            <View className="flex-row items-center">
              <TextInput
                className="border border-gray-200 font-sans rounded-lg px-3 py-2 w-20 text-center mr-2 bg-white"
                value={notificationPreferences.medicationReminders.advanceNotice.value.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setNotificationPreferences({
                    ...notificationPreferences,
                    medicationReminders: {
                      ...notificationPreferences.medicationReminders,
                      advanceNotice: {
                        ...notificationPreferences.medicationReminders.advanceNotice,
                        value
                      }
                    }
                  });
                }}
                keyboardType="numeric"
              />
              <View className="border border-gray-200 rounded-lg flex-1 bg-white">
                <Picker
                  selectedValue={notificationPreferences.medicationReminders.advanceNotice.unit}
                  onValueChange={(itemValue) => setNotificationPreferences({
                    ...notificationPreferences,
                    medicationReminders: {
                      ...notificationPreferences.medicationReminders,
                      advanceNotice: {
                        ...notificationPreferences.medicationReminders.advanceNotice,
                        unit: itemValue
                      }
                    }
                  })}
                  style={{ color: 'gray', fontSize: 12, fontFamily: 'Inter_400Regular' }}
                >
                  <Picker.Item label="Minutes" value="minutes" />
                  <Picker.Item label="Hours" value="hours" />
                </Picker>
              </View>
            </View>
          </View>
        )}

        <View className="flex-row justify-between items-center mb-3 p-3 bg-gray-50 rounded-lg">
          <View className="flex-1">
            <Text className="text-gray-700 font-sans-medium">Health Alerts</Text>
            <Text className="text-gray-500 text-xs font-sans">Important health notifications</Text>
          </View>
          <Switch
            value={notificationPreferences.healthAlerts.enabled}
            onValueChange={(value) => setNotificationPreferences({
              ...notificationPreferences,
              healthAlerts: { enabled: value }
            })}
            trackColor={{ false: '#e5e7eb', true: '#67A9AF' }}
            thumbColor={notificationPreferences.healthAlerts.enabled ? '#67A9AF' : '#9ca3af'}
          />
        </View>

        <TouchableOpacity
          className="bg-primary py-3 rounded-xl mt-2 mb-5"
          onPress={handleUpdateNotificationPreferences}
        >
          <View className="flex-row justify-center items-center">
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text className="text-white text-center font-sans-medium ml-2">Save Preferences</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Time Picker Modal */}
      {Platform.OS === 'ios' && timePickerVisible && (
        <Modal
          transparent={true}
          visible={timePickerVisible}
          animationType="slide"
          onRequestClose={() => setTimePickerVisible(false)}
        >
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl p-4">
              <View className="flex-row justify-between items-center mb-3">
                <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
                  <Text className="text-red-500 font-sans-medium text-base">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-sans-semibold">Select Time</Text>
                <TouchableOpacity onPress={confirmIOSTime}>
                  <Text className="text-primary font-sans-medium text-base">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempTime}
                mode="time"
                is24Hour={true}
                display="spinner"
                onChange={onTimeChange}
                textColor="#000000"
              />
            </View>
          </View>
        </Modal>
      )}

       {Platform.OS === 'android' && timePickerVisible && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          display="spinner"
          is24Hour={true}
          onChange={onTimeChange}
        />
      )}

      {/* Delete Medication Modal */}
      <Modal
        transparent={true}
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-4">
          <View className="bg-white w-full max-w-xs rounded-2xl p-6">
            <Text className="text-lg text-gray-900 mb-3 font-sans-semibold">
              Delete Medication
            </Text>
            <Text className="text-gray-600 mb-6 font-sans-medium">
              Are you sure you want to delete this medication?
            </Text>
            <View className="flex-row justify-end gap-4">
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-sans">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmDeleteMedication}
                className="px-4 py-2 rounded-lg bg-[#ff6b35]"
              >
                {isLoading ? (
                  <Text className="text-white font-sans">Deleting...</Text>
                ) : (
                  <Text className="text-white font-sans">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Remove Condition Modal */}
      <Modal
        transparent={true}
        visible={conditionModalVisible}
        animationType="fade"
        onRequestClose={() => setConditionModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-4">
          <View className="bg-white w-full max-w-xs rounded-2xl p-6">
            <Text className="text-lg text-gray-900 mb-3 font-sans-semibold">
              Remove Condition
            </Text>
            <Text className="text-gray-600 mb-6 font-sans-medium">
              Are you sure you want to remove "{selectedCondition?.name}"?
            </Text>
            <View className="flex-row justify-end gap-4">
              <TouchableOpacity
                onPress={() => setConditionModalVisible(false)}
                className="px-4 py-2 rounded-lg bg-gray-200"
              >
                <Text className="text-gray-700 font-sans">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRemoveCondition}
                className="px-4 py-2 rounded-lg bg-[#ff6b35]"
              >
                <Text className="text-white font-sans">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}