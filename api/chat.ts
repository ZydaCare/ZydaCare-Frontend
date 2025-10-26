// services/ChatService.ts
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/config';

export interface Message {
  _id: string;
  room: string;
  sender: {
    _id: string;
    name: string;
    photo?: string;
    title?: string;
  };
  content: string;
  seen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatRoom {
  _id: string;
  booking: string;
  doctor: string;
  patient: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCountDoctor: number;
  unreadCountPatient: number;
  createdAt: string;
  updatedAt: string;
}

class ChatService {
  private socket: Socket | null = null;
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.initializeConnection();
    return this.connectionPromise;
  }

  private async initializeConnection(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const socketUrl = BASE_URL.replace('/api/v1', '');

      return new Promise((resolve, reject) => {
        this.socket = io(socketUrl, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
          console.log('✅ Socket connected:', this.socket?.id);
          this.connectionPromise = null;
          resolve();
        });

        this.socket.on('connect_error', (error: any) => {
          console.error('❌ Socket connection error:', error.message);
          this.connectionPromise = null;
          reject(error);
        });

        this.socket.on('disconnect', (reason: any) => {
          console.log('🔌 Socket disconnected:', reason);
          this.connectionPromise = null;
        });

        // Set timeout for connection
        setTimeout(() => {
          if (!this.socket?.connected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      this.connectionPromise = null;
      throw error;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionPromise = null;
    }
  }

  async joinRoom(roomId: string): Promise<{ success: boolean; unreadCount?: number; error?: string }> {
    await this.connect();

    return new Promise((resolve) => {
      if (!this.socket) {
        resolve({ success: false, error: 'Socket not connected' });
        return;
      }

      this.socket.emit('join_room', roomId, (response: any) => {
        if (response.success) {
          console.log('✅ Joined room:', roomId);
          resolve({ success: true, unreadCount: response.unreadCount });
        } else {
          console.error('❌ Failed to join room:', response.error);
          resolve({ success: false, error: response.error });
        }
      });
    });
  }

  leaveRoom(roomId: string): void {
    if (this.socket) {
      this.socket.emit('leave_room', roomId);
    }
  }

  onNewMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  onMessageSeen(callback: (data: { messageId: string; roomId: string; seenBy: string; seenAt: string }) => void): void {
    if (this.socket) {
      this.socket.on('message_seen', callback);
    }
  }

  onUserTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserOnline(callback: (data: { userId: string; timestamp: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_online', callback);
    }
  }

  onUserOffline(callback: (data: { userId: string }) => void): void {
    if (this.socket) {
      this.socket.on('user_offline', callback);
    }
  }

  onUnreadCountUpdate(callback: (data: { roomId: string; count: number }) => void): void {
    if (this.socket) {
      this.socket.on('unread_count_update', callback);
    }
  }

  emitTyping(roomId: string, isTyping: boolean): void {
    if (this.socket) {
      this.socket.emit('typing', { roomId, isTyping });
    }
  }

  markAsSeen(messageId: string, roomId: string): void {
    if (this.socket) {
      this.socket.emit('mark_as_seen', { messageId, roomId });
    }
  }

  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // API methods for HTTP requests
  async getChatMessages(roomId: string): Promise<Message[]> {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/chat/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      return data.data.messages || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(roomId: string, content: string): Promise<Message> {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/chat/send-message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId, content }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.data.message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async createChatRoom(bookingId: string): Promise<ChatRoom> {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/chat/create/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create chat room');
      }

      const data = await response.json();
      return data.data.chatRoom;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  async getUserChatRooms(): Promise<ChatRoom[]> {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/chat/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat rooms');
      }

      const data = await response.json();
      return data.data.rooms || [];
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw error;
    }
  }
}

export default new ChatService();