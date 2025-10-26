import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Animated
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import ChatService, { Message } from '@/api/chat';
import { useAuth } from '@/context/authContext';
import { useToast } from '@/components/ui/Toast';

type PatientInfo = {
  _id: string;
  name: string;
  avatar?: string;
  age?: number;
  gender?: string;
  online: boolean;
};

const DoctorChatScreen = () => {
  const { id: roomId, patientId, patientName, patientAvatar } = useLocalSearchParams<{
    id: string;
    patientId?: string;
    patientName?: string;
    patientAvatar?: string;
  }>();

  const router = useRouter();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);
  const { showToast } = useToast();

  // Initialize patient from route params or messages
  useEffect(() => {
    if (patientId && patientName) {
      setPatient({
        _id: patientId,
        name: patientName,
        avatar: patientAvatar,
        online: false
      });
    }
  }, [patientId, patientName, patientAvatar]);

  // Keyboard listeners for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const keyboardDidShowListener = Keyboard.addListener(
        'keyboardDidShow',
        (e) => {
          setKeyboardHeight(e.endCoordinates.height);
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        'keyboardDidHide',
        () => {
          setKeyboardHeight(0);
        }
      );

      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }
  }, []);

  // Load messages and connect to socket
  useEffect(() => {
    let isSubscribed = true;

    const initializeChat = async () => {
      try {
        setIsLoading(true);

        // Connect to socket
        await ChatService.connect();
        console.log('✅ Connected to socket');

        // Join room
        const joinResult = await ChatService.joinRoom(roomId as string);
        if (!joinResult.success) {
          throw new Error(joinResult.error || 'Failed to join room');
        }

        // Fetch messages
        const fetchedMessages = await ChatService.getChatMessages(roomId as string);
        if (isSubscribed) {
          setMessages(fetchedMessages);

          // If we don't have patient info from props, try to get it from messages
          if ((!patientId || !patientName) && fetchedMessages.length > 0) {
            const patientMessage = fetchedMessages.find((m: any) => m.sender._id !== user?._id);
            if (patientMessage) {
              setPatient({
                _id: patientMessage.sender._id,
                name: patientMessage.sender.name,
                avatar: patientMessage.sender.photo,
                online: otherUserOnline,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
        if (isSubscribed) {
          setIsLoading(false);
          showToast('Failed to load chat. Please try again.', 'error');
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    initializeChat();

    // Set up socket listeners
    ChatService.onNewMessage((newMessage: any) => {
      if (isSubscribed && newMessage.room === roomId) {
        setMessages(prev => [...prev, newMessage]);

        // Auto-mark as seen if message is from other user
        if (newMessage.sender._id !== user?._id) {
          ChatService.markAsSeen(newMessage._id, roomId as string);
        }

        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    ChatService.onMessageSeen((data: any) => {
      if (isSubscribed && data.roomId === roomId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === data.messageId ? { ...msg, seen: true } : msg
          )
        );
      }
    });

    ChatService.onUserTyping((data: any) => {
      if (isSubscribed && data.userId !== user?._id) {
        setIsTyping(data.isTyping);
      }
    });

    // Handle user online status
    const handleUserOnline = (data: { userId: string; timestamp: string }) => {
      if (isSubscribed && data.userId === patientId) {
        console.log('Patient came online:', data);
        setOtherUserOnline(true);
        setPatient(prev => prev ? { ...prev, online: true } : null);
      }
    };

    const handleUserOffline = (data: { userId: string }) => {
      if (isSubscribed && data.userId === patientId) {
        console.log('Patient went offline:', data);
        setOtherUserOnline(false);
        setPatient(prev => prev ? { ...prev, online: false } : null);
      }
    };

    // Set up event listeners
    ChatService.onUserOnline(handleUserOnline);
    ChatService.onUserOffline(handleUserOffline);
    
    // The server should automatically emit 'user-online' or 'user-offline' events
    // when the socket connection is established

    return () => {
      isSubscribed = false;
      ChatService.leaveRoom(roomId as string);
      // The ChatService.removeAllListeners() will clean up all listeners
      ChatService.removeAllListeners();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [roomId, user?._id]);

  const handleTyping = useCallback((text: string) => {
    setMessage(text);

    // Emit typing indicator
    if (text.length > 0) {
      ChatService.emitTyping(roomId as string, true);

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing indicator after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        ChatService.emitTyping(roomId as string, false);
      }, 2000);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      ChatService.emitTyping(roomId as string, false);
    }
  }, [roomId]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    const messageText = message.trim();
    setMessage('');
    setIsSending(true);

    // Stop typing indicator
    ChatService.emitTyping(roomId as string, false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      // Send message via HTTP (socket will handle the real-time update)
      await ChatService.sendMessage(roomId as string, messageText);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message. Please try again.', 'error');
      setMessage(messageText); // Restore message on error
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    // Handle both populated sender object and sender ID string
    const senderId = typeof item.sender === 'string' ? item.sender : item.sender._id;
    const isFromCurrentUser = senderId === user?._id;
    const time = format(new Date(item.createdAt), 'h:mm a');

    return (
      <View
        className={`mb-3 flex-row ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        <View
          className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${isFromCurrentUser
              ? 'bg-primary rounded-tr-sm'
              : 'bg-white rounded-tl-sm border border-gray-100'
            }`}
        >
          <Text className={`text-[15px] font-sans leading-5 ${isFromCurrentUser ? 'text-white' : 'text-gray-800'}`}>
            {item.content}
          </Text>
          <View className="flex-row justify-end items-center mt-1.5 space-x-1">
            <Text
              className={`text-[11px] font-sans ${isFromCurrentUser ? 'text-white/60' : 'text-gray-400'}`}
            >
              {time}
            </Text>
            {isFromCurrentUser && (
              <Ionicons
                name={item.seen ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.seen ? '#fff' : 'rgba(255,255,255,0.6)'}
                style={{ marginLeft: 2 }}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#67A9AF" />
        <Text className="mt-4 text-gray-600 font-sans">Loading chat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View className="bg-white border-b border-gray-100 shadow-sm pt-8">
          <View className="flex-row items-center px-4 py-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2 -ml-2 mr-1"
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#1F2937" />
            </TouchableOpacity>

            <View className="flex-row items-center flex-1">
              <View className="relative">
                {patient?.avatar ? (
                  <Image
                    source={{ uri: patient.avatar }}
                    className="w-11 h-11 rounded-full"
                    onError={() => {
                      setPatient(prev => prev ? { ...prev, avatar: undefined } : null);
                    }}
                  />
                ) : (
                  <View className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 items-center justify-center">
                    <Ionicons name="person" size={22} color="#67A9AF" />
                  </View>
                )}
                {patient?.online && (
                  <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                )}
              </View>

              <View className="ml-3 flex-1">
                <Text className="font-sans-bold text-[17px] text-gray-900" numberOfLines={1}>
                  {patient?.name || 'Patient'}
                </Text>
                {isTyping ? (
                  <View className="flex-row items-center mt-0.5">
                    <Text className="text-xs text-primary font-sans-medium">typing</Text>
                    <View className="flex-row ml-0.5 space-x-0.5">
                      <View className="w-1 h-1 rounded-full bg-primary animate-bounce" />
                      <View className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <View className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </View>
                  </View>
                ) : (
                  <Text className="text-xs text-gray-500 font-sans mt-0.5">
                    {patient?.online ? 'Active now' : 'Offline'}
                  </Text>
                )}
              </View>
            </View>

            {/* <TouchableOpacity className="p-2" activeOpacity={0.7}>
              <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
            </TouchableOpacity> */}
          </View>
        </View>

        {/* Messages Container */}
        <View className="flex-1 bg-gray-50">
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-4">
                <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
              </View>
              <Text className="text-gray-900 font-sans-semibold text-lg text-center mb-2">
                Start the Conversation
              </Text>
              <Text className="text-gray-500 font-sans text-center text-sm">
                No messages yet. Send a message to begin chatting with your patient.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item._id}
              renderItem={renderMessage}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 16,
              }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
              }}
            />
          )}
        </View>

        {/* Input Area - Fixed at bottom */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        >
          <View 
            className="bg-white border-t border-gray-100 px-4 pb-8 pt-3 shadow-lg"
            style={Platform.OS === 'android' ? { marginBottom: keyboardHeight } : {}}
          >
            <View className="flex-row items-center gap-2">
              <View className="flex-1 bg-gray-100 rounded-3xl px-4 py-2 min-h-[44px] max-h-[120px]">
                <TextInput
                  ref={inputRef}
                  value={message}
                  onChangeText={handleTyping}
                  placeholder="Type a message..."
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 font-sans text-[15px] leading-5"
                  multiline
                  maxLength={1000}
                  editable={!isSending}
                  onFocus={() => {
                    // Scroll to end when keyboard opens
                    setTimeout(() => {
                      flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                  style={{
                    paddingTop: Platform.OS === 'ios' ? 10 : 8,
                    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
                  }}
                />
              </View>

              <TouchableOpacity
                className={`w-12 h-12 rounded-full items-center justify-center shadow-md ${message.trim() && !isSending ? 'bg-primary' : 'bg-gray-300'
                  }`}
                onPress={handleSend}
                disabled={!message.trim() || isSending}
                activeOpacity={0.8}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons
                    name="send"
                    size={18}
                    color="#ffffff"
                    style={{ marginLeft: 2 }}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default DoctorChatScreen;