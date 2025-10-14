import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, Alert, ActivityIndicator, Platform } from 'react-native';
import { useAuth } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Picker } from '@react-native-picker/picker';
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
  const [loading, setLoading] = useState(true);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [newCondition, setNewCondition] = useState('');
  const [showConditionForm, setShowConditionForm] = useState(false);
  const [conditionSeverity, setConditionSeverity] = useState<'mild' | 'moderate' | 'severe'>('moderate');
  const [conditionNotes, setConditionNotes] = useState('');
  
  const [medications, setMedications] = useState<Medication[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([]);
  const [showMedicationForm, setShowMedicationForm] = useState(false);
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

  const notificationIds = useRef<Map<string, string>>(new Map());
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

      await scheduleAllMedicationNotifications(medicationsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      showToast('Failed to load data', 'error');
    }
  };

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) return;

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

  const scheduleAllMedicationNotifications = async (meds: Medication[]) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    notificationIds.current.clear();

    if (!notificationPreferences.medicationReminders.enabled) return;

    for (const med of meds) {
      if (med.enabled && med.time && med.frequency !== 'as_needed') {
        await scheduleMedicationNotification(med);
      }
    }
  };

  const scheduleMedicationNotification = async (medication: Medication) => {
    if (!medication.time) return;

    try {
      const [hours, minutes] = medication.time.split(':').map(Number);
      const advanceMinutes = notificationPreferences.medicationReminders.advanceNotice.unit === 'hours'
        ? notificationPreferences.medicationReminders.advanceNotice.value * 60
        : notificationPreferences.medicationReminders.advanceNotice.value;

      // Calculate the actual notification time by subtracting advance notice
      let notificationHours = hours;
      let notificationMinutes = minutes - advanceMinutes;
      
      // Handle negative minutes
      while (notificationMinutes < 0) {
        notificationMinutes += 60;
        notificationHours -= 1;
      }
      
      // Handle negative hours
      if (notificationHours < 0) {
        notificationHours += 24;
      }

      // Check if the notification time has already passed today
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(notificationHours, notificationMinutes, 0, 0);
      
      let trigger: any;

      if (medication.frequency === 'daily') {
        // If the time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
          trigger = { date: scheduledTime, repeats: true };
        } else {
          trigger = { hour: notificationHours, minute: notificationMinutes, repeats: true };
        }
      } else if (medication.frequency === 'weekly' && medication.specificDays?.length) {
        const dayMap: { [key: string]: number } = {
          'sunday': 1, 'monday': 2, 'tuesday': 3, 'wednesday': 4,
          'thursday': 5, 'friday': 6, 'saturday': 7
        };

        for (const day of medication.specificDays) {
          const dayNumber = dayMap[day.toLowerCase()];
          if (dayNumber) {
            // For weekly, we need to calculate the next occurrence of that day
            const currentDay = now.getDay() || 7; // Convert Sunday from 0 to 7
            const targetDay = dayNumber;
            let daysUntilTarget = targetDay - currentDay;
            
            if (daysUntilTarget < 0) {
              daysUntilTarget += 7;
            } else if (daysUntilTarget === 0 && scheduledTime <= now) {
              // If it's today but time has passed, schedule for next week
              daysUntilTarget = 7;
            }

            const nextOccurrence = new Date(now);
            nextOccurrence.setDate(now.getDate() + daysUntilTarget);
            nextOccurrence.setHours(notificationHours, notificationMinutes, 0, 0);

            trigger = { date: nextOccurrence, repeats: true };

            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: '💊 Medication Reminder',
                body: `${user?.firstName}, time to take ${medication.dosage} of ${medication.drugName}${advanceMinutes > 0 ? ` in ${advanceMinutes} minutes` : ''}`,
                sound: notificationPreferences.medicationReminders.sound || 'default',
                data: { medicationId: medication._id, drugName: medication.drugName, dosage: medication.dosage },
                categoryIdentifier: 'medication',
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger,
            });

            notificationIds.current.set(`${medication._id}-${day}`, notificationId);
          }
        }
        return;
      } else if (medication.frequency === 'monthly') {
        let targetDate = new Date(now);
        targetDate.setHours(notificationHours, notificationMinutes, 0, 0);
        if (targetDate <= now) {
          targetDate.setMonth(targetDate.getMonth() + 1);
        }
        trigger = { date: targetDate, repeats: false };
      }

      if (trigger) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '💊 Medication Reminder',
            body: `${user?.firstName}, time to take ${medication.dosage} of ${medication.drugName}${advanceMinutes > 0 ? ` in ${advanceMinutes} minutes` : ''}`,
            sound: notificationPreferences.medicationReminders.sound || 'default',
            data: { medicationId: medication._id, drugName: medication.drugName, dosage: medication.dosage },
            categoryIdentifier: 'medication',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger,
        });

        notificationIds.current.set(medication._id!, notificationId);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const cancelMedicationNotification = async (medicationId: string) => {
    const notificationId = notificationIds.current.get(medicationId);
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      notificationIds.current.delete(medicationId);
    }

    const keysToDelete: string[] = [];
    notificationIds.current.forEach((value, key) => {
      if (key.startsWith(`${medicationId}-`)) {
        Notifications.cancelScheduledNotificationAsync(value);
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => notificationIds.current.delete(key));
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

  const handleRemoveCondition = async (conditionName: string) => {
    const token = await AsyncStorage.getItem('token');

    Alert.alert(
      'Remove Condition',
      `Are you sure you want to remove "${conditionName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await conditionsApi.removeCondition(token!, conditionName);
              const conditions = await conditionsApi.getConditions(token!);
              setConditions(conditions);
              showToast('Condition removed successfully', 'success');
            } catch (error: any) {
              console.error('Error removing condition:', error);
              showToast(error.response?.data?.error || 'Failed to remove condition', 'error');
            }
          }
        }
      ]
    );
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
      const addedMedication = await medicationsApi.addMedication(token!, {
        drugName: newMedication.drugName,
        dosage: newMedication.dosage,
        frequency: newMedication.frequency,
        time: newMedication.time,
        timesPerDay: newMedication.frequency === 'daily' ? newMedication.timesPerDay : undefined,
        specificDays: newMedication.frequency === 'weekly' ? newMedication.specificDays : undefined,
        notes: newMedication.notes,
        enabled: newMedication.enabled
      });

      if (addedMedication.enabled && notificationPreferences.medicationReminders.enabled) {
        await scheduleMedicationNotification(addedMedication);
      }

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

      if (enabled && notificationPreferences.medicationReminders.enabled) {
        const medication = updatedMeds.find(m => m._id === medicationId);
        if (medication) {
          await scheduleMedicationNotification(medication);
        }
      } else {
        await cancelMedicationNotification(medicationId);
      }

      const reminders = await medicationsApi.getUpcomingReminders(token!);
      setUpcomingReminders(reminders);
    } catch (error: any) {
      console.error('Error toggling medication:', error);
      showToast(error.response?.data?.error || 'Failed to update medication', 'error');
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    const token = await AsyncStorage.getItem('token');

    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationsApi.deleteMedication(token!, medicationId);
              await cancelMedicationNotification(medicationId);

              const [meds, reminders] = await Promise.all([
                medicationsApi.getMedications(token!),
                medicationsApi.getUpcomingReminders(token!)
              ]);
              setMedications(meds);
              setUpcomingReminders(reminders);
              
              showToast('Medication deleted successfully', 'success');
            } catch (error: any) {
              console.error('Error deleting medication:', error);
              showToast(error.response?.data?.error || 'Failed to delete medication', 'error');
            }
          }
        }
      ]
    );
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
      await scheduleAllMedicationNotifications(medications);
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
              <Text className="text-blue-800 font-medium">{reminder.drugName}</Text>
              <Text className="text-blue-600 text-sm">
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
              <Text className="text-gray-700 mb-2 font-medium">Severity</Text>
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
                <Text className="text-center font-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-lg"
                onPress={handleAddCondition}
              >
                <Text className="text-white text-center font-medium">Add Condition</Text>
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
                  <View className={`px-2 py-1 rounded mr-2 ${
                    condition.severity === 'mild' ? 'bg-green-100' :
                    condition.severity === 'moderate' ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}>
                    <Text className={`text-xs font-medium ${
                      condition.severity === 'mild' ? 'text-green-700' :
                      condition.severity === 'moderate' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {condition.severity?.toUpperCase() || 'MODERATE'}
                    </Text>
                  </View>
                  {condition.isActive !== false && (
                    <View className="bg-blue-100 px-2 py-1 rounded">
                      <Text className="text-xs text-blue-700 font-medium">ACTIVE</Text>
                    </View>
                  )}
                </View>
                {condition.diagnosisDate && (
                  <Text className="text-gray-500 text-xs mt-2">
                    📅 Diagnosed: {new Date(condition.diagnosisDate).toLocaleDateString()}
                  </Text>
                )}
                {condition.notes && (
                  <Text className="text-gray-600 text-sm mt-2">{condition.notes}</Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={() => handleRemoveCondition(condition.name)}
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
            <Text className="text-gray-500 text-center mt-2 text-sm">
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
              <Text className="text-gray-700 mb-2 font-medium">Frequency</Text>
              <View className="border border-gray-300 rounded-lg bg-white">
                <Picker
                  selectedValue={newMedication.frequency}
                  onValueChange={(itemValue) => setNewMedication({ ...newMedication, frequency: itemValue })}
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
                <Text className="text-gray-700 mb-2 font-medium">Select Days</Text>
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
                      <Text className={newMedication.specificDays?.includes(day) ? 'text-white font-medium text-xs' : 'text-gray-700 text-xs'}>
                        {day.slice(0, 3).toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {newMedication.frequency !== 'as_needed' && (
              <View className="mb-3">
                <Text className="text-gray-700 mb-2 font-medium">Time (24-hour format)</Text>
                <TextInput
                  className="border border-gray-300 rounded-lg p-3 bg-white font-sans-medium text-[13px] text-gray-700"
                  value={newMedication.time}
                  onChangeText={(text) => setNewMedication({ ...newMedication, time: text })}
                  placeholder="09:00"
                  placeholderTextColor='#9ca3af'
                  maxLength={5}
                />
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
              <Text className="text-gray-700 font-medium">Enable Reminders</Text>
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
                <Text className="text-center font-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary py-3 rounded-lg"
                onPress={handleAddMedication}
              >
                <Text className="text-white text-center font-medium">Add Medication</Text>
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
                <Text className="text-gray-500 text-sm">{med.dosage} • {med.frequency}</Text>
                {med.time && (
                  <Text className="text-gray-500 text-sm">⏰ {med.time}</Text>
                )}
                {med.specificDays && med.specificDays.length > 0 && (
                  <Text className="text-gray-500 text-xs mt-1">
                    📅 {med.specificDays.map(d => d.slice(0, 3).toUpperCase()).join(', ')}
                  </Text>
                )}
                {med.lastTaken && (
                  <Text className="text-green-600 text-xs mt-1">
                    ✓ Last: {new Date(med.lastTaken).toLocaleString()}
                  </Text>
                )}
                {med.nextReminder && med.enabled && (
                  <Text className="text-blue-600 text-xs">
                    📅 Next: {new Date(med.nextReminder).toLocaleString()}
                  </Text>
                )}
                {med.notes && (
                  <Text className="text-gray-600 text-sm mt-1">📝 {med.notes}</Text>
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
                <Text className="text-green-700 text-center text-sm font-medium">✓ Mark as Taken</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {medications.length === 0 && !showMedicationForm && (
          <View className="py-6 items-center">
            <Ionicons name="medical-outline" size={40} color="#d1d5db" />
            <Text className="text-gray-500 text-center mt-2 text-sm">
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
            <Text className="text-gray-700 font-medium">Medication Reminders</Text>
            <Text className="text-gray-500 text-xs">Get notified for medications</Text>
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
            <Text className="text-gray-700 text-sm font-medium mb-2">Advance Notice</Text>
            <View className="flex-row items-center">
              <TextInput
                className="border border-gray-200 rounded-lg px-3 py-2 w-20 text-center mr-2 bg-white"
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
            <Text className="text-gray-700 font-medium">Health Alerts</Text>
            <Text className="text-gray-500 text-xs">Important health notifications</Text>
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
    </ScrollView>
  );
}