import { useState, useEffect, useCallback } from 'react';
import ChatService, { ChatRoom } from '@/api/chat';
import { useAuth } from '@/context/authContext';

export const useChat = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const loadChatRooms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const rooms = await ChatService.getUserChatRooms();
      setChatRooms(rooms);

      // Set initial unread counts
      const counts: Record<string, number> = {};
      rooms.forEach((room: any) => {
        if (user?.role === 'doctor') {
          counts[room._id] = room.unreadCountDoctor;
        } else {
          counts[room._id] = room.unreadCountPatient;
        }
      });
      setUnreadCounts(counts);
    } catch (err) {
      console.error('Error loading chat rooms:', err);
      setError('Failed to load chats');
    } finally {
      setIsLoading(false);
    }
  }, [user?.role]);

  const connectToSocket = useCallback(async () => {
    try {
      await ChatService.connect();

      // Listen for unread count updates
      ChatService.onUnreadCountUpdate((data: any) => {
        setUnreadCounts(prev => ({
          ...prev,
          [data.roomId]: data.count
        }));
      });

      // Listen for new messages to update room list
      ChatService.onNewMessage((message: any) => {
        setChatRooms(prev => {
          const roomIndex = prev.findIndex(r => r._id === message.room);
          if (roomIndex === -1) return prev;

          const updatedRooms = [...prev];
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            lastMessage: message.content,
            lastMessageAt: message.createdAt,
          };

          // Move to top
          const [room] = updatedRooms.splice(roomIndex, 1);
          return [room, ...updatedRooms];
        });
      });
    } catch (err) {
      console.error('Error connecting to socket:', err);
    }
  }, []);

  useEffect(() => {
    loadChatRooms();
    connectToSocket();

    return () => {
      ChatService.removeAllListeners();
    };
  }, [loadChatRooms, connectToSocket]);

  const getTotalUnreadCount = useCallback(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  const createChatRoom = useCallback(async (bookingId: string) => {
    try {
      const room = await ChatService.createChatRoom(bookingId);
      setChatRooms(prev => [room, ...prev]);
      return room;
    } catch (err) {
      console.error('Error creating chat room:', err);
      throw err;
    }
  }, []);

  return {
    chatRooms,
    isLoading,
    error,
    unreadCounts,
    getTotalUnreadCount,
    loadChatRooms,
    createChatRoom,
  };
};