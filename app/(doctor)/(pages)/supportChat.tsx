import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Image
} from 'react-native';
import { useAuth } from '@/context/authContext';
import { Linking } from 'react-native';
import { Images } from '@/assets/Images';

interface Message {
    id: number;
    text: string;
    sender: 'doctor' | 'support';
    time: string;
    read: boolean;
}

export default function DoctorSupportChatScreen() {
    const { user } = useAuth();
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: `Hello Dr. ${user?.lastName}! Thank you for reaching out to ZydaCare Support. How can I assist you today?`,
            sender: 'support',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: true
        }
    ]);
    const scrollViewRef = useRef<ScrollView>(null);

    const quickReplyOptions = [
        'Appointment Scheduling',
        'Patient Management',
        'Billing & Payments',
        'Technical Support',
        'Account Settings',
        'Feedback'
    ];

    const supportAgent = {
        name: 'Sarah Johnson',
        role: 'Support Specialist',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        status: 'online'
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
        }
    };

    const handleSend = () => {
        if (message.trim()) {
            const newMessage: Message = {
                id: messages.length + 1,
                text: message,
                sender: 'doctor',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: false
            };

            setMessages([...messages, newMessage]);
            setMessage('');

            setIsTyping(true);
            setTimeout(() => {
                const supportResponse: Message = {
                    id: messages.length + 2,
                    text: 'Thank you for your message. Our support team will get back to you shortly. In the meantime, is there anything else I can help you with?',
                    sender: 'support',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    read: true
                };
                setMessages(prev => [...prev, supportResponse]);
                setIsTyping(false);
            }, 1500);
        }
    };

    const handleQuickReply = (option: string) => {
        const newMessage: Message = {
            id: messages.length + 1,
            text: option,
            sender: 'doctor',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false
        };

        setMessages([...messages, newMessage]);

        setIsTyping(true);
        setTimeout(() => {
            let response = '';
            switch (option) {
                case 'Appointment Scheduling':
                    response = 'I can help you with appointment scheduling. Please let me know what specific assistance you need, and I\'ll guide you through the process.';
                    break;
                case 'Patient Management':
                    response = 'For patient management support, please provide more details about your query, and I\'ll connect you with the appropriate team member.';
                    break;
                case 'Billing & Payments':
                    response = 'I can assist with billing and payment questions. Could you please provide more details about your inquiry?';
                    break;
                default:
                    response = 'Thank you for your message. A support specialist will assist you shortly with your request.';
            }

            const supportResponse: Message = {
                id: messages.length + 2,
                text: response,
                sender: 'support',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: true
            };
            setMessages(prev => [...prev, supportResponse]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" backgroundColor="#10B981" />

            {/* Header */}
            <View className="bg-primary px-6 pt-10 pb-4">
                <View className="flex-row items-center justify-center gap-2">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="p-2 -ml-2"
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View className="items-center flex-row flex-1 gap-3">
                        <Image source={Images.doctor} className='w-12 h-12 rounded-full' />
                        <View>
                            <Text className="text-white text-lg font-sans-bold">Stephanie Johnson</Text>
                            <Text className="text-white/80 text-xs font-sans">
                                {isTyping ? 'Typing...' : 'Online'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Chat Area */}
            <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-4 pt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Welcome Message */}
                <View className="items-center mb-6">
                    <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-3">
                        <Ionicons name="medical" size={28} color="#10B981" />
                    </View>
                    <Text className="text-gray-900 font-sans-bold text-lg mb-1">ZydaCare Support</Text>
                    <Text className="text-gray-500 text-center text-sm font-sans max-w-[80%]">
                        We're here to help with any questions or concerns you may have about our services.
                    </Text>
                </View>

                {/* Date Separator */}
                <View className="items-center my-4">
                    <View className="bg-gray-100 px-4 py-1.5 rounded-full">
                        <Text className="text-gray-500 text-xs font-sans">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </Text>
                    </View>
                </View>

                {/* Messages */}
                {messages.map((msg) => (
                    <View
                        key={msg.id}
                        className={`mb-4 ${msg.sender === 'doctor' ? 'items-end' : 'items-start'}`}
                    >
                        <View className="flex-row max-w-[85%] items-end">
                            {msg.sender === 'support' && (
                                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2">
                                    <Ionicons name="medical" size={16} color="#10B981" />
                                </View>
                            )}
                            <View>
                                <View
                                    className={`rounded-2xl px-4 py-3 ${msg.sender === 'doctor'
                                        ? 'bg-primary rounded-br-none'
                                        : 'bg-white border border-gray-100 rounded-tl-none shadow-sm'
                                        }`}
                                >
                                    <Text
                                        className={`text-base font-sans ${msg.sender === 'doctor' ? 'text-white' : 'text-gray-900'
                                            }`}
                                    >
                                        {msg.text}
                                    </Text>
                                </View>
                                <Text
                                    className={`text-xs mt-1 px-1 ${msg.sender === 'doctor' ? 'text-right text-gray-400' : 'text-gray-400'
                                        }`}
                                >
                                    {msg.time} {msg.sender === 'doctor' && (msg.read ? '✓✓' : '✓')}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <View className="flex-row items-center mb-4">
                        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-2">
                            <Ionicons name="medical" size={16} color="#10B981" />
                        </View>
                        <View className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                            <View className="flex-row space-x-1">
                                <View className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0ms' }} />
                                <View className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '200ms' }} />
                                <View className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '400ms' }} />
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Input Area */}
            <View className="px-4 pb-6 pt-3 bg-white border-t border-gray-100">
                {/* Quick Reply Buttons */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-3"
                    contentContainerStyle={{ paddingHorizontal: 4 }}
                >
                    {quickReplyOptions.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            className="bg-primary/5 border border-primary/10 rounded-full px-4 py-2 mr-2"
                            onPress={() => handleQuickReply(option)}
                        >
                            <Text className="text-primary text-sm font-sans-medium">
                                {option}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View className="flex-row items-end bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                    <TouchableOpacity className="p-1.5 mr-1">
                        <Ionicons name="add-circle" size={24} color="#10B981" />
                    </TouchableOpacity>
                    <TextInput
                        placeholder="Type a message..."
                        value={message}
                        onChangeText={setMessage}
                        className="flex-1 text-base font-sans text-gray-900 py-1.5 px-2 max-h-32"
                        placeholderTextColor="#9CA3AF"
                        multiline
                        maxLength={500}
                        style={{ maxHeight: 120 }}
                    />
                    {message.trim() ? (
                        <TouchableOpacity
                            className="p-1.5 ml-1"
                            onPress={handleSend}
                        >
                            <Ionicons name="send" size={20} color="#10B981" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity className="p-1.5 ml-1">
                            <Ionicons name="mic-outline" size={22} color="#6B7280" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}