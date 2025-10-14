import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Images } from '@/assets/Images';
import { useAuth } from '@/context/authContext';
import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string;
  experience: number;
  consultationFee: number;
  location: string;
  rating: number;
  totalReviews: number;
  availableToday: boolean;
  qualifications: string;
  about: string;
  email?: string;
  phone?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  doctors?: Doctor[];
  recommendDoctors?: boolean;
  askFollowUp?: boolean;
}

interface APIResponse {
  success: boolean;
  data?: {
    message: string;
    recommendDoctors: boolean;
    doctors: Doctor[];
    specialties: string[];
    metadata: {
      tokensUsed: number;
      timestamp: string;
    };
  };
  message?: string;
}

const DoctorCard = ({ doctor, onBook }: { doctor: Doctor; onBook: (doctor: Doctor) => void }) => {
  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3 shadow-sm">
      <View className="flex-row gap-3">
        <Image
          source={{ uri: doctor.image }}
          className="w-20 h-20 rounded-lg"
        />
        <View className="flex-1">
          <Text className="font-sans-semibold text-base text-gray-900">{doctor.name}</Text>
          <Text className="text-primary font-sans-medium text-sm">{doctor.specialty}</Text>
          <Text className="text-gray-600 font-sans text-xs mt-1">{doctor.qualifications}</Text>

          <View className="flex-row items-center gap-3 mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="ribbon" size={12} color="#6B7280" />
              <Text className="text-xs font-sans text-gray-600">{doctor.experience} years</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={12} color="#FCD34D" />
              <Text className="text-xs font-sans text-gray-600">{doctor.rating}</Text>
            </View>
            {doctor.totalReviews > 0 && (
              <Text className="text-xs font-sans text-gray-500">({doctor.totalReviews})</Text>
            )}
          </View>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-1">
            <Ionicons name="cash-outline" size={16} color="#6B7280" />
            <Text className="font-sans-semibold text-sm text-gray-700">₦{doctor.consultationFee.toLocaleString()}</Text>
            <Text className="text-xs font-sans text-gray-500"> per consultation</Text>
          </View>
          {doctor.availableToday && (
            <View className="bg-primary px-2 py-1 rounded-full">
              <Text className="text-xs text-white font-medium">Available Today</Text>
            </View>
          )}
        </View>

        <View className="flex-row items-start gap-1 mb-3">
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text className="text-xs font-sans text-gray-600 flex-1">{doctor.location}</Text>
        </View>

        <TouchableOpacity
          onPress={() => onBook(doctor)}
          className="w-full bg-secondary py-3 rounded-lg active:bg-secondary/80"
        >
          <View className="flex-row items-center justify-center gap-2">
            <Ionicons name="calendar-outline" size={18} color="white" />
            <Text className="text-white font-sans-semibold text-sm">Book Appointment</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TypingIndicator = () => (
  <View className="flex-row mb-4 justify-start">
    <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mr-2">
      <Ionicons name="chatbubble" size={18} color="white" />
    </View>
    <View className="bg-white px-4 py-3 rounded-2xl border border-gray-200 shadow-sm">
      <View className="flex-row gap-1">
        <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ opacity: 0.4 }} />
        <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ opacity: 0.6 }} />
        <View className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ opacity: 0.8 }} />
      </View>
    </View>
  </View>
);

const Health = () => {
  const { user } = useAuth(); // Make sure your auth context provides token
  const fullName = `${user?.firstName} ${user?.lastName}`.trim();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.firstName}! 👋\n\nI'm your ZydaCare AI Health Assistant. Think of me as your first point of contact for health concerns - I'm here to:\n\n• Listen to your symptoms\n• Provide helpful health guidance\n• Recommend appropriate specialists\n• Answer your health questions\n\nHow are you feeling today? Tell me what's bothering you, and let's figure out the best way to help you feel better.`,
      timestamp: new Date(),
      doctors: []
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        setToken(storedToken);
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };

    loadToken();
  }, []);


  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const getAIResponse = async (conversationHistory: Message[]): Promise<void> => {
    try {
      setIsTyping(true);
      setError(null);

      // Prepare messages for API (only send role and content)
      const apiMessages = conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      console.log('Sending request to:', `${BASE_URL}/health-ai/chat`);
      console.log('Message count:', apiMessages.length);

      // Make API call
      const response = await axios.post<APIResponse>(
        `${BASE_URL}/health-ai/chat`,
        { messages: apiMessages },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Use your auth token
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('API Response:', response.data);

      if (response.data.success && response.data.data) {
        const { message, doctors, recommendDoctors } = response.data.data;

        const assistantMessage: Message = {
          role: 'assistant',
          content: message,
          timestamp: new Date(),
          doctors: doctors || [],
          recommendDoctors: recommendDoctors
        };

        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(response.data.message || 'Failed to get AI response');
      }

    } catch (err: any) {
      console.error('Error getting AI response:', err);

      let errorMessage = "I'm having trouble processing your request. ";

      if (err.response) {
        // Server responded with error
        console.error('Server Error:', err.response.data);
        errorMessage += err.response.data.message || 'Please try again.';
      } else if (err.request) {
        // Request made but no response
        console.error('Network Error:', err.request);
        errorMessage += 'Please check your internet connection.';
      } else {
        // Something else happened
        console.error('Error:', err.message);
        errorMessage += 'Please try again.';
      }

      setError(errorMessage);

      // Show fallback message
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `${errorMessage}\n\nWould you like to browse our available doctors directly? I can help you find the right specialist for your needs.`,
        timestamp: new Date(),
        doctors: [],
        recommendDoctors: false
      };

      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    // Update messages with user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    // Get AI response
    await getAIResponse(updatedMessages);
  };

  const handleBookAppointment = (doctor: Doctor) => {
    Alert.alert(
      'Book Appointment',
      `Would you like to book an appointment with ${doctor.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Book Now',
          onPress: () => {
            // TODO: Navigate to booking screen
            console.log('Booking appointment with:', doctor);
            Alert.alert('Success', `Proceeding to book appointment with ${doctor.name}`);
            // In production: navigation.navigate('BookAppointment', { doctorId: doctor.id });
          }
        }
      ]
    );
  };

  const handleQuickAction = async (action: string) => {
    const quickMessages: { [key: string]: string } = {
      'general': "I need a general health checkup",
      'emergency': "I need urgent medical attention",
      'followup': "I need help with understanding my symptoms"
    };

    if (quickMessages[action]) {
      setInput(quickMessages[action]);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
      style={{ backgroundColor: '#F0FDFA' }}
    >
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-2 pt-12 shadow-sm">
        <View className="flex-row items-center gap-3">
          <Image source={Images.LogoIcon} className="w-14 h-14" />
          <View className="flex-1">
            <Text className="text-xl font-sans-semibold text-gray-900">AI Health Assistant</Text>
            <Text className="text-sm font-sans text-gray-600">Powered by ZydaCare</Text>
          </View>
          <View className="items-center">
            <View className="w-2 h-2 bg-green-500 rounded-full" />
            <Text className="text-xs font-sans text-gray-500 mt-1">Online</Text>
          </View>
        </View>

        {/* Error Banner */}
        {error && (
          <View className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex-row items-start gap-2">
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text className="flex-1 text-sm font-sans text-red-700">{error}</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View className="bg-white border-b border-gray-100 px-4 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleQuickAction('general')}
              className="bg-primary/10 px-4 py-2 rounded-full flex-row items-center gap-2"
            >
              <Ionicons name="medical" size={16} color="#67A9AF" />
              <Text className="text-primary font-sans-medium text-sm">General Checkup</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickAction('emergency')}
              className="bg-red-50 px-4 py-2 rounded-full flex-row items-center gap-2"
            >
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text className="text-red-600 font-sans-medium text-sm">Emergency</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleQuickAction('followup')}
              className="bg-blue-50 px-4 py-2 rounded-full flex-row items-center gap-2"
            >
              <Ionicons name="help-circle" size={16} color="#3B82F6" />
              <Text className="text-blue-600 font-sans-medium text-sm">Need Help</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Messages Container */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <View key={index} className={`flex-row mb-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mr-2">
                <Ionicons name="chatbubble" size={18} color="white" />
              </View>
            )}

            <View className={`flex-1 ${message.role === 'user' ? 'items-end' : 'items-start'}`} style={{ maxWidth: '85%' }}>
              <View className={`px-4 py-3 rounded-2xl ${message.role === 'user'
                  ? 'bg-primary'
                  : 'bg-white border border-gray-200 shadow-sm'
                }`}>
                <Text className={`text-sm font-sans-medium leading-relaxed ${message.role === 'user' ? 'text-white' : 'text-gray-800'
                  }`}>
                  {message.content}
                </Text>
              </View>

              {/* Doctor Cards */}
              {message.doctors && message.doctors.length > 0 && (
                <View className="w-full mt-3">
                  <Text className="text-sm font-sans-semibold text-gray-700 mb-2">
                    Recommended Doctors ({message.doctors.length})
                  </Text>
                  {message.doctors.map(doctor => (
                    <DoctorCard
                      key={doctor.id}
                      doctor={doctor}
                      onBook={handleBookAppointment}
                    />
                  ))}
                </View>
              )}

              <Text className="text-xs font-sans text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            {message.role === 'user' && (
              <View className="w-8 h-8 rounded-full ml-2 overflow-hidden">
                <Image
                  source={{ uri: user?.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName || 'U')}&background=67A9AF&color=fff` }}
                  className="w-8 h-8"
                />
              </View>
            )}
          </View>
        ))}

        {isTyping && <TypingIndicator />}
      </ScrollView>

      {/* Input Area */}
      <View className="bg-white border-t border-gray-200 px-4 py-3 pb-24">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Describe your symptoms..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={500}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm font-sans bg-gray-50"
            style={{ maxHeight: 100 }}
            editable={!isTyping}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-3 rounded-xl ${(!input.trim() || isTyping) ? 'bg-gray-300' : 'bg-primary active:bg-primary/80'}`}
          >
            {isTyping ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-center mt-2 gap-1">
          <Ionicons name="shield-checkmark" size={12} color="#6B7280" />
          <Text className="text-xs font-sans text-gray-500 text-center">
            Secure & confidential. AI provides guidance, not medical diagnosis.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Health;