import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Switch, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { DoctorProfile } from '@/types/Doctor';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';

const daysOfWeek = [
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

const defaultTimeSlots = [
  { startTime: '09:00', endTime: '17:00', isAvailable: true },
  { startTime: '17:00', endTime: '20:00', isAvailable: true },
];

function ConsultationTypeRow({ icon, label, description, value, onChange, isLast }: {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  isLast: boolean;
}) {
  return (
    <View className={`px-5 py-4 ${!isLast ? 'border-b border-gray-100' : ''}`}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${value ? 'bg-primary/10' : 'bg-gray-100'}`}>
            <Ionicons name={icon as any} size={20} color={value ? '#67A9AF' : '#9CA3AF'} />
          </View>
          <View className="flex-1 mr-3">
            <Text className="font-sans-semibold text-base text-gray-900">{label}</Text>
            <Text className="text-sm text-gray-500 mt-0.5 font-sans">{description}</Text>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: '#E5E7EB', true: '#67A9AF' }}
          thumbColor="white"
          ios_backgroundColor="#E5E7EB"
        />
      </View>
    </View>
  );
}

export default function ScheduleAvailabilityScreen() {
  const { doctorProfile, getDoctorProfile, updateDoctorProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedDays, setExpandedDays] = useState<string[]>([]);
  const [dayToRemove, setDayToRemove] = useState<{ index: number, name: string } | null>(null);
  const [availability, setAvailability] = useState<{
    workingDays: {
      day: string;
      slots: { startTime: string; endTime: string; isAvailable: boolean }[];
    }[];
    isAvailableForHomeVisits: boolean;
    isAvailableForOnlineConsultations: boolean;
    isAvailableForInPersonConsultations: boolean;
    noticePeriod: number;
  }>({
    workingDays: daysOfWeek.map(day => ({
      day,
      slots: [...defaultTimeSlots],
    })),
    isAvailableForHomeVisits: false,
    isAvailableForOnlineConsultations: true,
    isAvailableForInPersonConsultations: true,
    noticePeriod: 60,
  });

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        if (!doctorProfile?.profile?.availability) {
          setIsLoading(false);
          return;
        }

        // Create a map of server days for quick lookup
        const serverDaysMap = new Map(
          doctorProfile.profile.availability.workingDays.map(day => [
            day.day.toLowerCase(),
            day.slots.map(slot => ({
              ...slot,
              isAvailable: true
            }))
          ])
        );

        // Update working days with server data
        const updatedWorkingDays = daysOfWeek.map(day => {
          const serverDaySlots = serverDaysMap.get(day);

          if (serverDaySlots && serverDaySlots.length > 0) {
            return {
              day,
              slots: serverDaySlots
            };
          }

          // If no slots from server, mark as unavailable
          return {
            day,
            slots: [{ startTime: '09:00', endTime: '17:00', isAvailable: false }]
          };
        });

        setAvailability({
          workingDays: updatedWorkingDays,
          isAvailableForHomeVisits: doctorProfile.profile.availability.isAvailableForHomeVisits || false,
          isAvailableForOnlineConsultations: doctorProfile.profile.availability.isAvailableForOnlineConsultations !== false,
          isAvailableForInPersonConsultations: doctorProfile.profile.availability.isAvailableForInPersonConsultations !== false,
          noticePeriod: doctorProfile.profile.availability.noticePeriod || 60,
        });
      } catch (error) {
        console.error('Error loading availability:', error);
        showToast('Failed to load schedule', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, [doctorProfile]);

  const toggleDayExpanded = (day: string) => {
    setExpandedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleRemoveDay = (dayIndex: number) => {
    setDayToRemove({
      index: dayIndex,
      name: availability.workingDays[dayIndex].day
    });
  };

  const confirmRemoveDay = () => {
    if (dayToRemove === null) return;

    const { index } = dayToRemove;
    const updatedDays = [...availability.workingDays];
    updatedDays[index].slots = updatedDays[index].slots.map(slot => ({
      ...slot,
      isAvailable: false
    }));

    setAvailability(prev => ({
      ...prev,
      workingDays: updatedDays
    }));

    // Close the expanded view if open
    setExpandedDays(prev => prev.filter(d => d !== updatedDays[index].day));
    setDayToRemove(null);
  };

  const handleTimeSlotChange = (dayIndex: number, slotIndex: number, field: 'startTime' | 'endTime' | 'isAvailable', value: any) => {
    const updatedDays = [...availability.workingDays];
    const updatedSlots = [...updatedDays[dayIndex].slots];

    updatedSlots[slotIndex] = {
      ...updatedSlots[slotIndex],
      [field]: value
    };

    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      slots: updatedSlots
    };

    setAvailability(prev => ({
      ...prev,
      workingDays: updatedDays
    }));
  };

  const handleAddTimeSlot = (dayIndex: number) => {
    const updatedDays = [...availability.workingDays];
    updatedDays[dayIndex].slots.push({
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: true
    });

    setAvailability(prev => ({
      ...prev,
      workingDays: updatedDays
    }));
  };

  const handleRemoveTimeSlot = (dayIndex: number, slotIndex: number) => {
    const updatedDays = [...availability.workingDays];
    updatedDays[dayIndex].slots.splice(slotIndex, 1);

    if (updatedDays[dayIndex].slots.length === 0) {
      updatedDays[dayIndex].slots.push({
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true
      });
    }

    setAvailability(prev => ({
      ...prev,
      workingDays: updatedDays
    }));
  };

  const handleNoticePeriodSelect = React.useCallback((value: number) => {
    setAvailability(prev => ({ ...prev, noticePeriod: value }));
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // First, update the local state to ensure UI consistency
      const updatedDays = availability.workingDays.map(day => ({
        ...day,
        slots: day.slots.filter(slot => slot.isAvailable).length > 0
          ? day.slots
          : [{ startTime: '09:00', endTime: '17:00', isAvailable: false }]
      }));

      setAvailability(prev => ({
        ...prev,
        workingDays: updatedDays
      }));

      // Then prepare data for the server
      const filteredWorkingDays = updatedDays
        .map(day => ({
          day: day.day.toLowerCase(),
          slots: day.slots.filter(slot => slot.isAvailable)
        }))
        .filter(day => day.slots.length > 0);

      // Prepare the update data - only send the profile data, not the full DoctorProfile
      const updateData = {
        availability: {
          workingDays: filteredWorkingDays,
          isAvailableForHomeVisits: availability.isAvailableForHomeVisits,
          isAvailableForOnlineConsultations: availability.isAvailableForOnlineConsultations,
          isAvailableForInPersonConsultations: availability.isAvailableForInPersonConsultations,
          noticePeriod: availability.noticePeriod,
        }
      };

      console.log('Sending availability update:', updateData);

      // Call the API
      await updateDoctorProfile(updateData);

      // Refresh the doctor profile
      await getDoctorProfile();

      showToast('Schedule updated successfully', 'success');
      router.back();
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      showToast(error.message || 'Failed to update schedule', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#67A9AF" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-5 bg-white shadow-sm">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 -ml-2 p-2 rounded-full active:bg-gray-100"
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-sans-bold text-gray-900">Availability</Text>
              <Text className="text-sm text-gray-500 mt-0.5 font-sans">Manage your schedule & consultation types</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-6 py-6">
            {/* Consultation Types */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <View className="w-1 h-5 bg-primary rounded-full mr-3" />
                <Text className="text-lg font-sans-bold text-gray-900">Consultation Types</Text>
              </View>

              <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <ConsultationTypeRow
                  icon="person-outline"
                  label="In-Person Consultations"
                  description="Meet patients at your clinic"
                  value={availability.isAvailableForInPersonConsultations}
                  onChange={(value) =>
                    setAvailability(prev => ({
                      ...prev,
                      isAvailableForInPersonConsultations: value
                    }))
                  }
                  isLast={false}
                />

                <ConsultationTypeRow
                  icon="videocam-outline"
                  label="Online Consultations"
                  description="Video calls with patients"
                  value={availability.isAvailableForOnlineConsultations}
                  onChange={(value) =>
                    setAvailability(prev => ({
                      ...prev,
                      isAvailableForOnlineConsultations: value
                    }))
                  }
                  isLast={false}
                />

                <ConsultationTypeRow
                  icon="home-outline"
                  label="Home Visits"
                  description="Visit patients at home"
                  value={availability.isAvailableForHomeVisits}
                  onChange={(value) =>
                    setAvailability(prev => ({
                      ...prev,
                      isAvailableForHomeVisits: value
                    }))
                  }
                  isLast={true}
                />
              </View>
            </View>

            {/* Weekly Schedule */}
            <View className="mb-6 mt-2">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-1 h-5 bg-primary rounded-full mr-3" />
                  <Text className="text-lg font-sans-bold text-gray-900">Weekly Schedule</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const updatedDays = availability.workingDays.map(day => ({
                      ...day,
                      slots: day.slots.map(slot => ({
                        ...slot,
                        isAvailable: true
                      }))
                    }));
                    setAvailability(prev => ({
                      ...prev,
                      workingDays: updatedDays
                    }));
                  }}
                  className="px-4 py-2 bg-primary/10 rounded-xl active:bg-primary/20"
                >
                  <Text className="text-sm font-sans-semibold text-primary">Enable All</Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {availability.workingDays.map((day, dayIndex) => {
                  const hasAvailableSlots = day.slots.some(s => s.isAvailable);
                  const isExpanded = expandedDays.includes(day.day);

                  return (
                    <View key={day.day}>
                      <TouchableOpacity
                        className={`px-5 py-4 ${dayIndex < availability.workingDays.length - 1 && !isExpanded ? 'border-b border-gray-100' : ''}`}
                        onPress={() => toggleDayExpanded(day.day)}
                        activeOpacity={0.7}
                      >
                        <View className="flex-row justify-between items-center">
                          <View className="flex-1">
                            <Text className={`font-sans-semibold text-base ${hasAvailableSlots ? 'text-gray-900' : 'text-gray-400'}`}>
                              {day.day}
                            </Text>
                            <Text className="text-sm text-gray-500 mt-0.5 font-sans">
                              {hasAvailableSlots ? `${day.slots.filter(s => s.isAvailable).length} time slot${day.slots.filter(s => s.isAvailable).length > 1 ? 's' : ''}` : 'No slots available'}
                            </Text>
                          </View>
                          <View className="flex-row items-center" style={{ gap: 12 }}>
                            <View className={`px-3 py-1.5 rounded-full ${hasAvailableSlots ? 'bg-green-50' : 'bg-gray-100'}`}>
                              <Text className={`text-xs font-sans-semibold ${hasAvailableSlots ? 'text-green-700' : 'text-gray-500'}`}>
                                {hasAvailableSlots ? 'Available' : 'Unavailable'}
                              </Text>
                            </View>
                            <View className="flex-row items-center" style={{ gap: 8 }}>
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  handleRemoveDay(dayIndex);
                                }}
                                className="p-1"
                              >
                                {hasAvailableSlots && (
                                  <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color="#EF4444"
                                  />
                                )}
                              </TouchableOpacity>
                              <Ionicons
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#9CA3AF"
                              />
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <View className={`px-5 pb-4 pt-2 bg-gray-50/50 border-t border-gray-100 ${dayIndex < availability.workingDays.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <View style={{ gap: 12 }}>
                            {day.slots.map((slot, slotIndex) => (
                              <View key={slotIndex} className="flex-row items-center" style={{ gap: 8 }}>
                                <View className="flex-1 bg-white rounded-xl p-3 shadow-sm">
                                  <TimeSlotPicker
                                    startTime={slot.startTime}
                                    endTime={slot.endTime}
                                    onStartTimeChange={(time) => handleTimeSlotChange(dayIndex, slotIndex, 'startTime', time)}
                                    onEndTimeChange={(time) => handleTimeSlotChange(dayIndex, slotIndex, 'endTime', time)}
                                    disabled={!slot.isAvailable}
                                  />
                                </View>
                                <TouchableOpacity
                                  onPress={() => handleRemoveTimeSlot(dayIndex, slotIndex)}
                                  className="p-3 bg-white rounded-xl shadow-sm active:bg-red-50"
                                  disabled={day.slots.length <= 1}
                                >
                                  <Ionicons
                                    name="trash-outline"
                                    size={20}
                                    color={day.slots.length <= 1 ? '#D1D5DB' : '#EF4444'}
                                  />
                                </TouchableOpacity>
                              </View>
                            ))}

                            <TouchableOpacity
                              onPress={() => handleAddTimeSlot(dayIndex)}
                              className="flex-row items-center justify-center py-3 border-2 border-dashed border-gray-300 rounded-xl bg-white active:bg-gray-50"
                            >
                              <Ionicons name="add-circle-outline" size={20} color="#67A9AF" />
                              <Text className="ml-2 text-primary font-sans-semibold text-sm">Add Time Slot</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Notice Period - Slider Design */}
            <View className="mb-6 mt-2">
              <View className="flex-row items-center mb-4">
                <View className="w-1 h-5 bg-primary rounded-full mr-3" />
                <Text className="text-lg font-sans-bold text-gray-900">Booking Notice Period</Text>
              </View>
              <View className="bg-white rounded-2xl shadow-sm p-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-sm text-gray-600 font-sans">
                    Minimum advance booking time
                  </Text>
                  <View className="bg-primary/10 px-4 py-2 rounded-xl">
                    <Text className="text-primary font-sans-bold text-base">
                      {availability.noticePeriod >= 60 
                        ? `${Math.floor(availability.noticePeriod / 60)} ${Math.floor(availability.noticePeriod / 60) === 1 ? 'hour' : 'hours'}`
                        : `${availability.noticePeriod} min`}
                    </Text>
                  </View>
                </View>

                <View className="mt-4">
                  {/* Quick Select Options */}
                  <View className="flex-row justify-between mb-6">
                    {[
                      { value: 30, label: '30m', icon: 'flash' },
                      { value: 60, label: '1h', icon: 'time' },
                      { value: 240, label: '4h', icon: 'hourglass' },
                      { value: 720, label: '12h', icon: 'moon' },
                      { value: 1440, label: '24h', icon: 'sunny' },
                    ].map((option, index) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setAvailability(prev => ({ ...prev, noticePeriod: option.value }));
                        }}
                        style={({ pressed }) => [
                          {
                            opacity: pressed ? 0.7 : 1,
                          }
                        ]}
                        className={`flex-1 ${index > 0 ? 'ml-2' : ''} items-center py-3 rounded-xl border-2 ${
                          availability.noticePeriod === option.value
                            ? 'bg-primary border-primary'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <Ionicons 
                          name={option.icon as any} 
                          size={20} 
                          color={availability.noticePeriod === option.value ? '#FFFFFF' : '#67A9AF'} 
                        />
                        <Text 
                          className={`text-xs font-sans-semibold mt-1 ${
                            availability.noticePeriod === option.value ? 'text-white' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Custom Time Selector */}
                  <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <Text className="text-sm font-sans-semibold text-gray-700 mb-3">
                      Or set custom time:
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 18, 20].map(hours => (
                        <Pressable
                          key={hours}
                          onPress={() => {
                            setAvailability(prev => ({ ...prev, noticePeriod: hours * 60 }));
                          }}
                          style={({ pressed }) => [
                            {
                              opacity: pressed ? 0.7 : 1,
                            }
                          ]}
                          className={`px-4 py-2 rounded-lg ${
                            availability.noticePeriod === hours * 60
                              ? 'bg-primary'
                              : 'bg-white'
                          }`}
                        >
                          <Text 
                            className={`font-sans-medium text-sm ${
                              availability.noticePeriod === hours * 60 ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {hours}h
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>

                <View className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <View className="flex-row items-start">
                    <Ionicons name="information-circle" size={18} color="#3B82F6" style={{ marginTop: 1, marginRight: 8 }} />
                    <Text className="flex-1 text-xs text-blue-700 font-sans leading-5">
                      Patients must book at least {availability.noticePeriod >= 60 
                        ? `${Math.floor(availability.noticePeriod / 60)} ${Math.floor(availability.noticePeriod / 60) === 1 ? 'hour' : 'hours'}`
                        : `${availability.noticePeriod} minutes`} in advance
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="px-6 py-4 bg-white border-t border-gray-100 shadow-lg">
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`py-4 rounded-2xl items-center justify-center shadow-md ${isSaving ? 'bg-primary/70' : 'bg-primary active:bg-primary/90'
              }`}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-sans-bold text-base">Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={dayToRemove !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDayToRemove(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-sans-bold text-gray-900 mb-2">Remove Day</Text>
            <Text className="text-gray-600 font-sans mb-6">
              Are you sure you want to remove {dayToRemove?.name} from your schedule?
            </Text>

            <View className="flex-row justify-end gap-4">
              <TouchableOpacity
                onPress={() => setDayToRemove(null)}
                className="px-5 py-2.5 rounded-lg bg-gray-100 active:bg-gray-200"
              >
                <Text className="text-gray-900 font-sans-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmRemoveDay}
                className="px-5 py-2.5 rounded-lg bg-red-100 active:bg-red-200"
              >
                <Text className="text-red-700 font-sans-medium">Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}