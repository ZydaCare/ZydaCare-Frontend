import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  Keyboard,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Images } from '@/assets/Images';
import { useAuth } from '@/context/authContext';
import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string;
  experience: number;
  consultationFee: number;
  rating: number;
  totalReviews: number;
  location: string;
  availableToday: boolean;
  qualifications: string;
  about: string;
  email?: string;
  phone?: string;
  matchingScore?: number;
  matchingReasons?: string[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  doctors?: Doctor[];
  showSuggestions?: boolean;
  emergencyRecommendation?: {
    message: string;
    emergencyContacts: { name: string; number: string; }[];
  };
  idmeInsights?: {
    topRecommendation: Doctor;
    recommendationReason: string;
    totalAvailableDoctors: number;
    averageWaitTime: string;
    consultationTypes: string[];
  };
  riskLevel?: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';
  diagnosisSuggestions?: string[];
  images?: string[];
  articleLink?: {        // 👈 add this
    title: string;
    url: string;
    source: string;
  };
}

interface APIResponse {
  success: boolean;
  data?: {
    message: string;
    recommendDoctors: boolean;
    doctors: Doctor[];
    specialties: string[];
    riskLevel?: 'EMERGENCY' | 'URGENT' | 'ROUTINE' | 'SELF_CARE';
    diagnosisSuggestions?: string[];
    emergencyRecommendation?: {
      message: string;
      emergencyContacts: Array<{ name: string; number: string }>;
    };
    idmeInsights?: {
      topRecommendation: Doctor;
      recommendationReason: string;
      totalAvailableDoctors: number;
      averageWaitTime: string;
      consultationTypes: string[];
    };
    articleLink?: {      // 👈 add this
      title: string;
      url: string;
      source: string;
    };
    metadata: { tokensUsed: number; timestamp: string; aiModel?: string; idmeVersion?: string };
  };
  message?: string;
}

const SYMPTOM_SUGGESTIONS = [
  { label: '🤕  Headache', symptom: 'headache', area: 'head' },
  { label: '🌡️  Fever', symptom: 'fever', area: 'body' },
  { label: '😮‍💨  Cough', symptom: 'cough', area: 'chest' },
  { label: '🤢  Stomach Pain', symptom: 'stomach pain', area: 'abdomen' },
  { label: '🩹  Skin Rash', symptom: 'skin rash', area: 'skin' },
  { label: '🦵  Joint Pain', symptom: 'joint pain', area: 'joints' },
];

// ─── Emergency Card ──────────────────────────────────────────────────────────

const EmergencyCard = ({ recommendation }: { recommendation: any }) => (
  <View className="mt-3 rounded-2xl overflow-hidden border border-red-100">
    <View className="bg-red-500 px-4 py-3 flex-row items-center gap-2">
      <Ionicons name="warning" size={16} color="white" />
      <Text className="text-white font-sans-bold text-sm">Emergency Alert</Text>
    </View>
    <View className="bg-red-50 px-4 py-3">
      <Text className="text-red-800 font-sans text-sm leading-relaxed mb-3">{recommendation.message}</Text>
      {recommendation.emergencyContacts.map((contact: any, i: number) => (
        <TouchableOpacity
          key={i}
          onPress={() => Alert.alert('Emergency Call', `Call ${contact.name} at ${contact.number}?`)}
          className="flex-row items-center justify-between bg-white rounded-xl px-3 py-2 mb-2"
        >
          <View className="flex-row items-center gap-2">
            <View className="w-7 h-7 bg-red-100 rounded-full items-center justify-center">
              <Ionicons name="call" size={13} color="#EF4444" />
            </View>
            <Text className="font-sans-medium text-sm text-gray-700">{contact.name}</Text>
          </View>
          <Text className="font-sans-bold text-sm text-red-500">{contact.number}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ─── IDME Insights Card ──────────────────────────────────────────────────────

const IDMEInsightsCard = ({ insights }: { insights: any }) => (
  <View className="mt-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
    <View className="flex-row items-center gap-2 mb-3">
      <Ionicons name="sparkles" size={15} color="#3B82F6" />
      <Text className="font-sans-bold text-sm text-blue-700">AI Recommendation</Text>
    </View>
    <View className="bg-white rounded-xl p-3 mb-3">
      <Text className="font-sans text-xs text-gray-400 mb-1">Best match for you</Text>
      <Text className="font-sans-bold text-sm text-gray-900">{insights.topRecommendation.name}</Text>
      <Text className="font-sans-medium text-xs text-primary mt-0.5">{insights.topRecommendation.specialty}</Text>
      <Text className="font-sans text-xs text-blue-500 mt-1 italic">{insights.recommendationReason}</Text>
    </View>
    <View className="flex-row gap-2">
      {[
        { label: 'Doctors', value: `${insights.totalAvailableDoctors}` },
        { label: 'Wait', value: insights.averageWaitTime },
        { label: 'Mode', value: insights.consultationTypes[0] },
      ].map((stat, i) => (
        <View key={i} className="flex-1 bg-white rounded-xl p-2 items-center">
          <Text className="font-sans-bold text-sm text-gray-800">{stat.value}</Text>
          <Text className="font-sans text-xs text-gray-400 mt-0.5">{stat.label}</Text>
        </View>
      ))}
    </View>
  </View>
);

// ─── Risk Badge ───────────────────────────────────────────────────────────────

const RiskBadge = ({ riskLevel }: { riskLevel: string }) => {
  const map: Record<string, { icon: any; label: string; desc: string; bg: string; text: string; iconColor: string }> = {
    EMERGENCY: { icon: 'alert-circle', label: 'Emergency', desc: 'Seek immediate attention', bg: 'bg-red-50', text: 'text-red-700', iconColor: '#EF4444' },
    URGENT: { icon: 'time-outline', label: 'Urgent', desc: 'See a doctor soon', bg: 'bg-orange-50', text: 'text-orange-700', iconColor: '#F97316' },
    ROUTINE: { icon: 'calendar-outline', label: 'Routine', desc: 'Schedule when convenient', bg: 'bg-blue-50', text: 'text-blue-700', iconColor: '#3B82F6' },
    SELF_CARE: { icon: 'checkmark-circle-outline', label: 'Self-Care', desc: 'Home treatment may suffice', bg: 'bg-green-50', text: 'text-green-700', iconColor: '#22C55E' },
  };
  const c = map[riskLevel] || map.ROUTINE;
  return (
    <View className={`mt-3 flex-row items-center gap-3 ${c.bg} rounded-2xl px-4 py-3`}>
      <Ionicons name={c.icon} size={20} color={c.iconColor} />
      <View>
        <Text className={`font-sans-semibold text-sm ${c.text}`}>{c.label} Priority</Text>
        <Text className={`font-sans text-xs ${c.text} opacity-70`}>{c.desc}</Text>
      </View>
    </View>
  );
};

// ─── Diagnosis List ───────────────────────────────────────────────────────────

const DiagnosisList = ({ suggestions }: { suggestions: string[] }) => {
  if (!suggestions?.length) return null;
  return (
    <View className="mt-3 bg-purple-50 border border-purple-100 rounded-2xl p-4">
      <Text className="font-sans-semibold text-sm text-purple-700 mb-2">Possible Conditions</Text>
      {suggestions.map((s, i) => (
        <View key={i} className="flex-row items-start gap-2 mb-1.5">
          <View className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />
          <Text className="font-sans text-sm text-purple-600 flex-1">{s}</Text>
        </View>
      ))}
      <Text className="font-sans text-xs text-purple-400 mt-2 italic">Possibilities only — not a diagnosis</Text>
    </View>
  );
};

// ─── Article Card ─────────────────────────────────────────────────────────────

const ArticleCard = ({ article }: { article: { title: string; url: string; source: string } }) => (
  <TouchableOpacity
    onPress={() => Linking.openURL(article.url)}
    activeOpacity={0.8}
    className="mt-3 bg-white border border-gray-100 rounded-2xl p-4 flex-row items-center gap-3 shadow-sm"
  >
    <View className="w-10 h-10 bg-teal-50 rounded-xl items-center justify-center shrink-0">
      <Ionicons name="newspaper-outline" size={18} color="#67A9AF" />
    </View>
    <View className="flex-1">
      <Text className="font-sans text-xs text-gray-400 mb-0.5">{article.source}</Text>
      <Text className="font-sans-semibold text-sm text-gray-800 leading-snug" numberOfLines={2}>
        {article.title}
      </Text>
      <View className="flex-row items-center gap-1 mt-1">
        <Text className="font-sans-medium text-xs text-primary">Read article</Text>
        <Ionicons name="arrow-forward" size={11} color="#67A9AF" />
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Message Text ─────────────────────────────────────────────────────────────

const MessageText = ({ content, isUser }: { content: string; isUser: boolean }) => {
  // Remove any leftover [ARTICLE:...] tags that weren't stripped server-side
  const cleaned = content.replace(/\[ARTICLE:[^\]]+\]/gi, '').trim();

  // Split on URLs so any that slip through are tappable
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = cleaned.split(urlRegex);

  return (
    <Text className={`font-sans text-sm leading-relaxed ${isUser ? 'text-white' : 'text-gray-800'}`}>
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <Text
            key={i}
            className={`underline ${isUser ? 'text-blue-200' : 'text-primary'}`}
            onPress={() => Linking.openURL(part)}
          >
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </Text>
  );
};

// ─── Doctor Card ──────────────────────────────────────────────────────────────

const DoctorCard = ({ doctor, onBook }: { doctor: Doctor; onBook: (d: Doctor) => void }) => (
  <View className="bg-white border border-gray-100 rounded-2xl p-4 mb-3">
    <View className="flex-row gap-3 items-start">
      <Image source={{ uri: doctor.image }} className="w-14 h-14 rounded-xl" />
      <View className="flex-1">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-2">
            <Text className="font-sans-bold text-sm text-gray-900">{doctor.name}</Text>
            <Text className="font-sans-medium text-xs text-primary mt-0.5">{doctor.specialty}</Text>
          </View>
          {doctor.matchingScore != null && (
            <View className="bg-green-50 px-2 py-1 rounded-full">
              <Text className="font-sans-bold text-xs text-green-600">{Math.round(doctor.matchingScore)}%</Text>
            </View>
          )}
        </View>
        <Text className="font-sans text-xs text-gray-400 mt-1">{doctor.qualifications}</Text>
        <View className="flex-row items-center gap-3 mt-2">
          <View className="flex-row items-center gap-1">
            <Ionicons name="star" size={11} color="#FBBF24" />
            <Text className="font-sans-medium text-xs text-gray-600">{doctor.rating}</Text>
            {doctor.totalReviews > 0 && (
              <Text className="font-sans text-xs text-gray-400">({doctor.totalReviews})</Text>
            )}
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="ribbon-outline" size={11} color="#9CA3AF" />
            <Text className="font-sans text-xs text-gray-500">{doctor.experience} yrs</Text>
          </View>
          {doctor.availableToday && (
            <View className="bg-green-50 px-2 py-0.5 rounded-full">
              <Text className="font-sans-medium text-xs text-green-600">Today</Text>
            </View>
          )}
        </View>
      </View>
    </View>

    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-50">
      <View>
        <Text className="font-sans-bold text-sm text-gray-900">₦{doctor.consultationFee.toLocaleString()}</Text>
        <View className="flex-row items-center gap-1 mt-0.5">
          <Ionicons name="location-outline" size={11} color="#9CA3AF" />
          <Text className="font-sans text-xs text-gray-400" numberOfLines={1}>{doctor.location}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onBook(doctor)}
        className="bg-secondary px-4 py-2.5 rounded-xl flex-row items-center gap-1.5 active:opacity-80"
      >
        <Ionicons name="calendar-outline" size={14} color="white" />
        <Text className="font-sans-semibold text-xs text-white">Book</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <View className="flex-row items-end gap-2 mb-6">
    <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
      <Ionicons name="pulse" size={15} color="white" />
    </View>
    <View className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
      <View className="flex-row gap-1 items-center">
        <View className="w-2 h-2 rounded-full bg-gray-300" style={{ opacity: 0.5 }} />
        <View className="w-2 h-2 rounded-full bg-gray-300" style={{ opacity: 0.7 }} />
        <View className="w-2 h-2 rounded-full bg-gray-300" style={{ opacity: 0.9 }} />
      </View>
    </View>
  </View>
);

// ─── Suggestion Chips (in-chat) ───────────────────────────────────────────────

const SuggestionChips = ({ onSelect }: { onSelect: (text: string) => void }) => (
  <View className="mt-4 mb-2">
    <Text className="font-sans text-xs text-gray-400 mb-2">What are you experiencing?</Text>
    <View className="flex-row flex-wrap gap-2">
      {SYMPTOM_SUGGESTIONS.map(chip => (
        <TouchableOpacity
          key={chip.label}
          onPress={() => onSelect(`I'm experiencing ${chip.symptom} in my ${chip.area}. Can you help?`)}
          className="bg-white border border-gray-200 rounded-full px-3 py-2 active:bg-gray-50"
        >
          <Text className="font-sans-medium text-sm text-gray-700">{chip.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const Health = () => {
  const { user } = useAuth();
  const fullName = `${user?.firstName} ${user?.lastName}`.trim();
  const avatarUri = user?.profileImage?.url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'U')}&background=67A9AF&color=fff`;

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${user?.firstName} 👋  I'm your ZydaCare AI health assistant.\n\nDescribe your symptoms and I'll help assess what's going on, how urgent it is, and connect you with the right doctor.`,
      timestamp: new Date(),
      doctors: [],
      showSuggestions: true,
    },
  ]);

  const [showWelcome, setShowWelcome] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken).catch(console.error);
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  const getAIResponse = async (history: Message[]) => {
    try {
      setIsTyping(true);
      setError(null);

      // Get the last user message to extract images
      const lastUserMessage = history.find(m => m.role === 'user' && m.images);

      const apiMessages = history.map(m => ({
        role: m.role,
        content: m.content,
        images: m.images || [] // Include images in API call
      }));

      const response = await axios.post<APIResponse>(
        `${BASE_URL}/health-ai/chat`,
        {
          messages: apiMessages,
          // Include images from the last user message
          images: lastUserMessage?.images || []
        },
        {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );
      if (response.data.success && response.data.data) {
        const d = response.data.data;
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: d.message,
          timestamp: new Date(),
          doctors: d.doctors || [],
          showSuggestions: false,
          emergencyRecommendation: d.emergencyRecommendation,
          idmeInsights: d.idmeInsights,
          riskLevel: d.riskLevel,
          diagnosisSuggestions: d.diagnosisSuggestions,
          articleLink: d.articleLink,   // 👈 add this
        }]);
      } else {
        throw new Error(response.data.message || 'No response');
      }
    } catch (err: any) {
      let msg = "I'm having trouble right now. ";
      if (err.response) msg += err.response.data?.message || 'Please try again.';
      else if (err.request) msg += 'Please check your connection.';
      else msg += 'Please try again.';
      setError(msg);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: msg,
        timestamp: new Date(),
        doctors: [],
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || isTyping) return;
    // Hide welcome message and remove suggestions from the first message once user sends
    setShowWelcome(false);
    setMessages(prev => prev.map((m, i) => i === 0 ? { ...m, showSuggestions: false } : m));
    const userMsg: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
      images: selectedImages.length > 0 ? selectedImages : undefined
    };
    const updated = [...messages.map((m, i) => i === 0 ? { ...m, showSuggestions: false } : m), userMsg];
    setMessages(updated);
    setInput('');
    setSelectedImages([]); // Clear images after sending
    await getAIResponse(updated);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowAppointmentModal(true);
  };

  const confirmAppointment = () => {
    if (selectedDoctor) {
      router.push({
        pathname: '/appointment/book',
        params: { doctorId: selectedDoctor.id },
      });
      setShowAppointmentModal(false);
      setSelectedDoctor(null);
    }
  };

  const cancelAppointment = () => {
    setShowAppointmentModal(false);
    setSelectedDoctor(null);
  };

  const handleImageUpload = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >

      {/* ── Header ── */}
      <View className="bg-white border-b border-gray-100 px-5 pt-14 pb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-primary rounded-2xl items-center justify-center">
            <Ionicons name="pulse" size={20} color="white" />
          </View>
          <View className="flex-1">
            <Text className="font-sans-bold text-base text-gray-900">ZydaCare AI</Text>
            <Text className="font-sans text-xs text-gray-400">Health Assistant</Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-full">
            <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <Text className="font-sans-medium text-xs text-green-600">Online</Text>
          </View>
        </View>

        {error && (
          <View className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text className="font-sans text-xs text-red-600 flex-1">{error}</Text>
          </View>
        )}
      </View>

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustContentInsets={false}
      >
        {messages.map((msg, index) => (
          index === 0 && !showWelcome ? null : (
            <View
              key={index}
              className={`mb-5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Row: avatar + bubble */}
              <View className={`flex-row items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`} style={{ maxWidth: '88%' }}>

                {/* Avatar */}
                {msg.role === 'assistant' ? (
                  <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mb-1 shrink-0">
                    <Ionicons name="pulse" size={14} color="white" />
                  </View>
                ) : (
                  <Image source={{ uri: avatarUri }} className="w-8 h-8 rounded-full mb-1 shrink-0" />
                )}

                {/* Bubble */}
                <View className={`rounded-2xl px-4 py-3 ${msg.role === 'user'
                  ? 'bg-primary rounded-br-sm'
                  : 'bg-white border border-gray-100 rounded-bl-sm shadow-sm'
                  }`}>
                  <MessageText content={msg.content} isUser={msg.role === 'user'} />

                  {/* Display images in user messages */}
                  {msg.images && msg.images.length > 0 && (
                    <View className="mt-2">
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View className="flex-row gap-2">
                          {msg.images.map((imageUri, index) => (
                            <Image
                              key={index}
                              source={{ uri: imageUri }}
                              className="w-24 h-24 rounded-lg"
                              style={{ resizeMode: 'cover' }}
                            />
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Rich content below assistant bubble */}
              {msg.role === 'assistant' && (
                <View className="ml-10" style={{ maxWidth: '88%', width: '88%' }}>
                  {msg.emergencyRecommendation && (
                    <EmergencyCard recommendation={msg.emergencyRecommendation} />
                  )}
                  {msg.idmeInsights && (
                    <IDMEInsightsCard insights={msg.idmeInsights} />
                  )}
                  {msg.riskLevel && (msg.doctors?.length || msg.emergencyRecommendation) && (
                    <RiskBadge riskLevel={msg.riskLevel} />
                  )}
                  {msg.diagnosisSuggestions && msg.diagnosisSuggestions.length > 0 && (
                    <DiagnosisList suggestions={msg.diagnosisSuggestions} />
                  )}
                  {msg.articleLink && (
                    <ArticleCard article={msg.articleLink} />
                  )}

                  {msg.doctors && msg.doctors.length > 0 && (
                    <View className="mt-4">
                      <Text className="font-sans-semibold text-xs text-gray-400 mb-3 tracking-wide uppercase">
                        Recommended Doctors
                      </Text>
                      {msg.doctors.map(d => (
                        <DoctorCard key={d.id} doctor={d} onBook={handleBookAppointment} />
                      ))}
                    </View>
                  )}
                  {/* In-chat suggestion chips — only on welcome message */}
                  {msg.showSuggestions && (
                    <SuggestionChips onSelect={(text) => handleSend(text)} />
                  )}
                </View>
              )}

              {/* Timestamp */}
              <Text className={`font-sans text-xs text-gray-300 mt-1.5 ${msg.role === 'user' ? 'mr-10' : 'ml-10'}`}>
                {msg.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          )
        ))}

        {isTyping && <TypingIndicator />}
      </ScrollView>

      {/* ── Input ── */}
      <View className="bg-white border-t border-gray-100 px-4 pt-3 pb-24">
        {/* Image Preview */}
        {selectedImages.length > 0 && (
          <View className="mb-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {selectedImages.map((imageUri, index) => (
                  <View key={index} className="relative">
                    <Image
                      source={{ uri: imageUri }}
                      className="w-20 h-20 rounded-lg"
                      style={{ resizeMode: 'cover' }}
                    />
                    <TouchableOpacity
                      onPress={() => removeImage(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                    >
                      <Ionicons name="close" size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View className="flex-row items-end gap-2">
          {/* Image Upload Button */}
          <TouchableOpacity
            onPress={handleImageUpload}
            className="w-11 h-11 rounded-2xl items-center justify-center bg-gray-100"
          >
            <Ionicons name="camera" size={20} color="#6B7280" />
          </TouchableOpacity>

          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Describe your symptoms or upload images…"
            placeholderTextColor="#D1D5DB"
            multiline
            maxLength={500}
            editable={!isTyping}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 font-sans text-sm text-gray-800"
            style={{ maxHeight: 120, lineHeight: 20 }}
            onFocus={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={`w-11 h-11 rounded-2xl items-center justify-center ${!input.trim() || isTyping ? 'bg-gray-100' : 'bg-primary active:opacity-80'
              }`}
          >
            {isTyping
              ? <ActivityIndicator size="small" color="#9CA3AF" />
              : <Ionicons name="arrow-up" size={20} color={!input.trim() ? '#9CA3AF' : 'white'} />
            }
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center justify-center gap-1 mt-2">
          <Ionicons name="shield-checkmark-outline" size={11} color="#9CA3AF" />
          <Text className="font-sans text-xs text-gray-600">AI guidance only — not a medical diagnosis</Text>
        </View>
      </View>

      {/* Custom Appointment Modal */}
      {showAppointmentModal && selectedDoctor && (
        <View className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <View className="bg-white rounded-2xl p-4 m-4 w-full max-w-[90%] shadow-2xl">
            <View className="flex-row justify-between items-start mb-4">
              <Text className="font-sans-bold text-lg text-gray-900">Book Appointment</Text>
              <TouchableOpacity onPress={cancelAppointment}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Image
                source={{ uri: selectedDoctor.image }}
                className="w-20 h-20 rounded-full mb-3"
                style={{ resizeMode: 'cover' }}
              />
              <Text className="font-sans-semibold text-base text-gray-900 mb-1">{selectedDoctor.name}</Text>
              <Text className="font-sans text-sm text-gray-600 mb-2">{selectedDoctor.specialty}</Text>
              <Text className="font-sans text-xs text-gray-500 mb-4">{selectedDoctor.qualifications}</Text>
            </View>

            <View className="space-y-2 mb-4">
              <View className="flex-row justify-between items-center">
                <Text className="font-sans text-sm text-gray-600">Experience:</Text>
                <Text className="font-sans-medium text-sm text-gray-900">{selectedDoctor.experience} years</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="font-sans text-sm text-gray-600">Rating:</Text>
                <Text className="font-sans-medium text-sm text-gray-900">⭐ {selectedDoctor.rating}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="font-sans text-sm text-gray-600">Consultation:</Text>
                <Text className="font-sans-medium text-sm text-gray-900">₦{selectedDoctor.consultationFee.toLocaleString()}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="font-sans text-sm text-gray-600">Location:</Text>
                <Text className="font-sans-medium text-sm text-gray-900">{selectedDoctor.location}</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={cancelAppointment}
                className="flex-1 bg-gray-100 border border-gray-300 rounded-xl py-3 px-4 items-center"
              >
                <Text className="font-sans-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmAppointment}
                className="flex-1 bg-primary border border-primary rounded-xl py-3 px-4 items-center active:opacity-80"
              >
                <Text className="font-sans-medium text-white">Confirm Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default Health;