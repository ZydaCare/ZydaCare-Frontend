import { getMyAppointments } from "@/api/patient/appointments";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/ui/Toast";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addMinutes, format as formatDate, isAfter, isBefore } from "date-fns";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking, RefreshControl, ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Appointment() {
  const [isAppointment, setIsAppointment] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "Pending" | "Upcoming" | "Ongoing" | "Cancelled" | "All"
  >("Ongoing");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { showToast } = useToast();

  const tabs: Array<
    "All" | "Upcoming" | "Ongoing" | "Cancelled" | "Pending"
  > = ["All", "Upcoming", "Ongoing", "Cancelled", "Pending"];

  const fetchAppointments = useCallback(async (isRefreshing = false) => {
    const token = await AsyncStorage.getItem("token");
    if (!token) return;

    try {
      if (!isRefreshing) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const res = await getMyAppointments(token);
      const array = Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];

      const items = array.map((a: any) => ({
        ...a,
        dateISO: a.appointmentDate,
        date: a.appointmentDate
          ? formatDate(new Date(a.appointmentDate), "d MMMM yyyy h:mma")
          : "",
        speciality:
          a.doctor?.speciality ||
          a.medicalContext?.preferredDoctorOrSpecialty ||
          "General Practice",
        image:
          a.doctor?.profile?.profileImage?.url ||
          a.doctor?.profile?.profileImageUrl,
      }));

      setAppointments(items);
      setIsAppointment(items.length > 0);
    } catch (e: any) {
      setError(e?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    fetchAppointments(true);
  }, [fetchAppointments]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-amber-600";
      case "accepted":
        return "text-primary";
      case "awaiting_payment":
        return "text-amber-600";
      case "paid":
        return "text-green-600";
      case "cancelled":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50";
      case "accepted":
        return "bg-primary/20";
      case "awaiting_payment":
        return "bg-amber-50";
      case "paid":
        return "bg-green-50";
      case "cancelled":
        return "bg-red-50";
      default:
        return "bg-gray-50";
    }
  };

  const getFilteredAppointments = useMemo(() => {
    const now = new Date();

    const items = appointments.map((a) => {
      const start = a.dateISO ? new Date(a.dateISO) : null;
      const status = String(a.status).toLowerCase();
      const sameDay = start ? start.toDateString() === now.toDateString() : false;
      const startedOrNow = start ? now >= start : false;

      return {
        ...a,
        status,
        isPending: status === "pending",
        isCancelled: status === "cancelled",
        isUpcoming: start && start > now && status !== "pending",
        isOngoing:
          status !== "cancelled" &&
          status !== "pending" &&
          (status === "accepted" ||
            status === "awaiting_payment" ||
            (sameDay && startedOrNow)),
      };
    });

    let filtered = items;

    if (selectedTab === "Pending") filtered = items.filter((a) => a.isPending);
    else if (selectedTab === "Cancelled")
      filtered = items.filter((a) => a.isCancelled);
    else if (selectedTab === "Upcoming")
      filtered = items.filter((a) => a.isUpcoming);
    else if (selectedTab === "Ongoing")
      filtered = items.filter((a) => a.isOngoing);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => {
        const doctor = a.doctor?.fullName?.toLowerCase() || "";
        return (
          doctor.includes(q) ||
          a.speciality.toLowerCase().includes(q) ||
          a.status.toLowerCase().includes(q) ||
          a.date.toLowerCase().includes(q)
        );
      });
    }

    if (selectedTab === "Pending") {
      filtered.sort(
        (a, b) =>
          new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );
    }

    return filtered;
  }, [appointments, selectedTab, searchQuery]);

  const handleBookAgain = (appointment: any) => {
    router.push({
      pathname: "/appointment/book",
      params: { doctorId: appointment.doctor._id },
    });
  };

  const TabButton = ({ title, isSelected, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-3 rounded-xl ${isSelected ? "bg-primary shadow-sm" : "bg-white border border-gray-200"
        }`}
    >
      <Text
        className={`font-sans-semibold ${isSelected ? "text-white" : "text-gray-600"
          }`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const canJoinVideoCall = useCallback((appointment: any) => {
    if (!appointment?.dateISO || !appointment?.virtualMeeting?.doctorJoinedAt) return false;

    const appointmentDate = new Date(appointment.dateISO);
    const fiveMinutesBefore = addMinutes(appointmentDate, -5);
    const now = new Date();

    return isAfter(now, fiveMinutesBefore) && isBefore(now, addMinutes(appointmentDate, 5));
  }, []);

  const handleJoinVideoCall = useCallback(async (appointment: any) => {
    if (!appointment?.virtualMeeting?.link) {
      showToast('No meeting link available', 'error');
      return;
    }

    try {
      await Linking.openURL(appointment.virtualMeeting.link);
    } catch (error) {
      console.error('Error joining video call:', error);
      showToast('Failed to join video call', 'error');
    }
  }, [showToast]);

  const formatStatusText = (status: string) => {
    switch (status) {
      case 'awaiting_payment':
        return 'Awaiting Payment';
      default:
        return status
      // return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    }
  };

  const AppointmentCard = ({ appointment }: any) => (
    <View className="bg-white rounded-2xl p-4 mb-4 mx-4 shadow-sm border border-gray-100">
      <View className="flex-row">
        {appointment.image ? (
          <Image
            source={{ uri: appointment.image }}
            className="w-[90px] h-[90px] rounded-xl"
            resizeMode="cover"
          />
        ) : (
          <View className="w-[90px] h-[90px] rounded-xl items-center justify-center bg-primary/10">
            <Ionicons name="person" size={40} color="#67A9AF" />
          </View>
        )}

        <View className="flex-1 ml-4">
          <View className="flex-row items-start">
            <Text
              className="text-base font-sans-bold text-gray-900 mb-1 flex-1"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {appointment.doctor?.profile?.title} {appointment.doctor?.fullName}
            </Text>

            <View
              style={{ flexShrink: 0 }}
              className={`px-4 py-1 rounded-full ml-2 ${getStatusBgColor(appointment.status)}`}
            >
              <Text
                numberOfLines={1}
                className={`text-xs font-sans-medium capitalize ${getStatusColor(appointment.status)}`}
              >
                {formatStatusText(appointment.status)}
              </Text>
            </View>
          </View>



          {/* Speciality */}
          <View className="flex-row items-center mb-1">
            <Ionicons name="medical-outline" size={14} color="#6B7280" />
            <Text className="ml-2 text-gray-600 font-sans text-sm">
              {appointment.speciality}
            </Text>
          </View>

          {/* Date */}
          <View className="flex-row items-center mb-2">
            <Ionicons name="calendar-outline" size={14} color="#6B7280" />
            <Text className="ml-2 text-gray-600 text-xs">{appointment.date}</Text>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(patient)/(pages)/appointment/[id]",
                  params: { id: appointment._id },
                })
              }
              className="flex-1 bg-primary/10 py-2.5 rounded-lg"
            >
              <Text className="text-center text-primary font-sans-semibold text-sm">
                View Details
              </Text>
            </TouchableOpacity>

            {appointment.isOngoing ? (
              <>
                {appointment.appointmentType === 'virtual' && appointment.virtualMeeting?.doctorJoinedAt && (
                  <TouchableOpacity
                    onPress={() => handleJoinVideoCall(appointment)}
                    disabled={!canJoinVideoCall(appointment)}
                    className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row ${canJoinVideoCall(appointment) ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                  >
                    <Ionicons name="videocam" size={16} color="white" style={{ marginRight: 4 }} />
                    <Text className="text-center text-white font-sans-semibold text-sm">
                      Join Call
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    if (!appointment.chatRoom?._id)
                      return showToast("Chat room not available", "error");

                    router.push({
                      pathname: `/(patient)/(pages)/chat/${appointment.chatRoom._id}`,
                      params: {
                        doctorId: appointment.doctor._id,
                        doctorName: appointment.doctor.fullName,
                        doctorAvatar: appointment.image,
                      },
                    });
                  }}
                  className={`flex-1 py-2.5 rounded-lg ${appointment.appointmentType === 'virtual' && appointment.virtualMeeting?.doctorJoinedAt
                    ? 'w-1/3'
                    : 'flex-1'
                    }`}
                  style={{
                    backgroundColor: appointment.appointmentType === 'virtual' && appointment.virtualMeeting?.doctorJoinedAt
                      ? '#67A9AF'
                      : '#67A9AF'
                  }}
                >
                  <Text className="text-center text-white font-sans-semibold text-sm">
                    Chat
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => handleBookAgain(appointment)}
                className="flex-1 bg-primary py-2.5 rounded-lg"
              >
                <Text className="text-center text-white font-sans-semibold text-sm">
                  Book Again
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <Navbar />

      {/* Entire Page Scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#67A9AF']}
            tintColor="#67A9AF"
          />
        }
      >
        {!isAppointment ? (
          /********************
           * Empty Screen
           ********************/
          <View className="mt-20 items-center px-6">
            <Ionicons name="calendar-outline" size={70} color="#67A9AF" />

            <Text className="text-2xl font-sans-bold mt-6">
              No Appointments Yet
            </Text>
            <Text className="text-gray-500 text-base mt-2 text-center">
              Book your first appointment with a qualified doctor
            </Text>

            <TouchableOpacity
              onPress={() => router.push("/(patient)/(pages)/search")}
              className="bg-primary px-8 py-4 rounded-xl mt-8"
            >
              <Text className="text-white text-base font-sans-bold">
                Find a Doctor
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /********************
           * Main Appointment UI
           ********************/
          <View className="flex-1">
            {/* Search Bar */}
            <View className="px-4 pt-4 pb-2">
              <View className="flex-row items-center bg-white rounded-xl px-4 py-1 border border-gray-200">
                <Ionicons name="search-outline" size={20} color="#9CA3AF" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by doctor, specialty, status..."
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 ml-2 font-sans text-gray-900"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Tabs — NOT inside scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 16,
                gap: 8,
              }}
            >
              {tabs.map((tab) => (
                <TabButton
                  key={tab}
                  title={tab}
                  isSelected={selectedTab === tab}
                  onPress={() => setSelectedTab(tab)}
                />
              ))}
            </ScrollView>

            {/* Appointment List */}
            <View className="min-h-[500px]">
              {loading ? (
                <View className="items-center justify-center py-20">
                  <ActivityIndicator size="large" color="#67A9AF" />
                  <Text className="mt-3 text-gray-500">
                    Loading appointments...
                  </Text>
                </View>
              ) : error ? (
                <View className="mx-4 bg-red-50 border border-red-100 p-4 rounded-xl">
                  <Text className="text-red-700 text-center">{error}</Text>
                </View>
              ) : getFilteredAppointments.length === 0 ? (
                <View className="items-center px-6 mt-16">
                  <Ionicons
                    name="calendar-outline"
                    size={60}
                    color="#D1D5DB"
                  />
                  <Text className="text-lg font-sans-bold mt-4">
                    No {selectedTab} Appointments
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1 text-center">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "You have no appointments here"}
                  </Text>
                </View>
              ) : (
                getFilteredAppointments.map((a) => (
                  <AppointmentCard key={a._id} appointment={a} />
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
