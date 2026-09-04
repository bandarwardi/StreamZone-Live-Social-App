import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare var process: any;

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  async (config: any) => {
    const token = await AsyncStorage.getItem('livewave-access-token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;

    // Avoid infinite loops if refresh fails
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await AsyncStorage.getItem('livewave-refresh-token');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        await AsyncStorage.setItem('livewave-access-token', data.accessToken);
        await AsyncStorage.setItem('livewave-refresh-token', data.refreshToken);

        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        processQueue(null, data.accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await AsyncStorage.removeItem('livewave-access-token');
        await AsyncStorage.removeItem('livewave-refresh-token');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export const createBroadcast = async (title: string, category: string, description?: string) => {
  const res = await api.post('/broadcasts', { title, category, description });
  return res.data;
};

export const getAgoraToken = async (broadcastId: string) => {
  const res = await api.get(`/broadcasts/${broadcastId}/token`);
  return res.data;
};

export const sendHeartbeat = async (broadcastId: string) => {
  const res = await api.post(`/broadcasts/${broadcastId}/heartbeat`);
  return res.data;
};

export const endBroadcast = async (broadcastId: string) => {
  const res = await api.patch(`/broadcasts/${broadcastId}/end`);
  return res.data;
};

export const getMyActiveBroadcast = async () => {
  const res = await api.get('/broadcasts/my-active');
  return res.data;
};

export const getBroadcastById = async (id: string) => {
  const res = await api.get(`/broadcasts/${id}`);
  return res.data;
};

export const getLiveBroadcasts = async () => {
  const res = await api.get('/broadcasts?status=live');
  return res.data.data;
};

// --- Users & Follows ---
export const searchUsers = async (query: string) => {
  const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return res.data;
};

export const getUserProfile = async (id: string) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

export const followUser = async (id: string) => {
  const res = await api.post(`/users/follow/${id}`);
  return res.data;
};

export const unfollowUser = async (id: string) => {
  const res = await api.delete(`/users/follow/${id}`);
  return res.data;
};

export const getFollowStatus = async (id: string) => {
  const res = await api.get(`/users/follow/${id}/status`);
  return res.data;
};

export const startConversation = async (userId: string) => {
  const res = await api.post(`/chat/conversations/${userId}`);
  return res.data;
};
export const initiateCall = async (calleeId: string, type: 'voice' | 'video') => {
  const res = await api.post('/calls', { calleeId, type });
  return res.data;
};

export const answerCall = async (callId: string) => {
  const res = await api.patch(`/calls/${callId}/answer`);
  return res.data;
};

export const rejectCall = async (callId: string) => {
  const res = await api.patch(`/calls/${callId}/reject`);
  return res.data;
};

export const endCall = async (callId: string) => {
  const res = await api.patch(`/calls/${callId}/end`);
  return res.data;
};

export const getCallToken = async (callId: string) => {
  const res = await api.get(`/calls/${callId}/token`);
  return res.data;
};

// --- Gifts, Store & Wallet ---
export const getActiveGifts = async () => {
  const res = await api.get('/gifts');
  return res.data;
};

export const getStoreItems = async () => {
  const res = await api.get('/store');
  return res.data;
};

export const getMyProfile = async () => {
  const res = await api.get('/users/me');
  return res.data;
};

export const rechargeCoins = async (coins: number, price?: string) => {
  const res = await api.post('/transactions/recharge', { coins, price });
  return res.data;
};

export const convertDiamonds = async (diamonds: number) => {
  const res = await api.post('/transactions/convert-diamonds', { diamonds });
  return res.data;
};

// --- Store: Buy, Equip, Unequip ---
export const buyStoreItem = async (itemId: string) => {
  const res = await api.post(`/store/buy/${itemId}`);
  return res.data;
};

export const equipStoreItem = async (itemId: string) => {
  const res = await api.post(`/store/equip/${itemId}`);
  return res.data;
};

export const unequipStoreItem = async (type: 'frame' | 'entry_effect' | 'chat_bubble') => {
  const res = await api.post(`/store/unequip/${type}`);
  return res.data;
};

// --- Levels ---
export const getLevels = async () => {
  const res = await api.get('/levels');
  return res.data as Array<{
    _id: string;
    level: number;
    name: string;
    emoji: string;
    minXP: number;
    maxXP: number;
    color: string;
    badgeUrl?: string;
    rewardCoins: number;
    rewardDiamonds: number;
    rewardStoreItem?: string;
    perks?: string[];
  }>;
};

export const getMyProgress = async () => {
  const res = await api.get('/levels/my-progress');
  return res.data as {
    userId: string;
    xp: number;
    currentLevel: {
      level: number;
      name: string;
      emoji: string;
      color: string;
      badgeUrl?: string;
      minXP: number;
      maxXP: number;
      rewardCoins: number;
      rewardDiamonds: number;
    };
    nextLevel: {
      level: number;
      name: string;
      minXP: number;
      rewardCoins: number;
      rewardDiamonds: number;
    } | null;
    progressPercent: number;
    xpToNextLevel: number;
    inventory: Array<{
      itemId: string;
      name: string;
      type: string;
      imageUrl?: string;
      animationUrl?: string;
      unlockedAt: string;
      source: string;
    }>;
  };
};
