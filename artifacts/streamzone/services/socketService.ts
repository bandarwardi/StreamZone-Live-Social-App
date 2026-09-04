import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect = async () => {
    if (this.socket?.connected) return;

    const token = await AsyncStorage.getItem('livewave-access-token');
    if (!token) return;

    this.socket = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', async (err) => {
      console.log('Socket connect error:', err.message);
      if (err.message.includes('jwt expired') || err.message.includes('Unauthorized')) {
        try {
          // Trigger api to refresh token
          const { api } = await import('./api');
          await api.get('/users/me');
          const newToken = await AsyncStorage.getItem('livewave-access-token');
          if (newToken && this.socket) {
            this.socket.auth = { token: newToken };
            this.socket.connect();
          }
        } catch (e) {
          console.error('Socket token refresh failed', e);
        }
      }
    });

    this.socket.onAny((event, ...args) => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach((cb) => cb(...args));
      }
    });
  };

  disconnect = () => {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  };

  on = (event: string, callback: Function) => {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  };

  off = (event: string, callback: Function) => {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      this.listeners.set(event, callbacks.filter((cb) => cb !== callback));
    }
  };

  isConnected = () => {
    return !!this.socket?.connected;
  };

  ensureConnected = async () => {
    if (!this.socket?.connected) {
      await this.connect();
    }
  };

  joinRoom = async (broadcastId: string) => {
    await this.ensureConnected();
    this.socket?.emit('joinRoom', { broadcastId });
  };

  leaveRoom = (broadcastId: string) => {
    this.socket?.emit('leaveRoom', { broadcastId });
  };

  sendMessage = async (broadcastId: string, text: string) => {
    await this.ensureConnected();
    this.socket?.emit('sendMessage', { broadcastId, text });
  };

  sendGift = async (broadcastId: string, gift: any) => {
    await this.ensureConnected();
    this.socket?.emit('sendGift', { broadcastId, gift });
  };

  sendReaction = async (broadcastId: string) => {
    await this.ensureConnected();
    this.socket?.emit('sendReaction', { broadcastId });
  };

  joinConversation = async (conversationId: string) => {
    await this.ensureConnected();
    this.socket?.emit('joinConversation', { conversationId });
  };

  leaveConversation = (conversationId: string) => {
    this.socket?.emit('leaveConversation', { conversationId });
  };

  sendDirectMessage = async (payload: {
    conversationId: string;
    type: string;
    text?: string;
    mediaUrl?: string;
    giftData?: any;
  }) => {
    await this.ensureConnected();
    this.socket?.emit('sendDirectMessage', payload);
  };
}

export const socketService = new SocketService();
