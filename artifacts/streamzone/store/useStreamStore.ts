import { create } from 'zustand';

type Theme = 'dark' | 'light';
type Tab = 'home' | 'feed' | 'live' | 'messages' | 'profile';

type StreamStore = {
  theme: Theme;
  activeTab: Tab;
  loggedIn: boolean;
  coins: number;
  diamonds: number;
  following: string[];
  likedPosts: string[];
  readConversationIds: string[];
  pkScores: { left: number; right: number };
  sentGiftCount: number;
  toggleTheme: () => void;
  setActiveTab: (tab: Tab) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  toggleFollowing: (id: string) => void;
  togglePostLike: (id: string) => void;
  markConversationRead: (id: string) => void;
  addPkScore: (side: 'left' | 'right', amount: number) => void;
  resetPkScores: () => void;
  sendGift: (price: number) => boolean;
  recharge: (amount: number) => void;
};

export const useStreamStore = create<StreamStore>((set, get) => ({
  theme: 'dark',
  activeTab: 'home',
  loggedIn: true,
  coins: 14690,
  diamonds: 25000,
  following: [],
  likedPosts: [],
  readConversationIds: [],
  pkScores: { left: 15000, right: 6354 },
  sentGiftCount: 0,
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setLoggedIn: (loggedIn) => set({ loggedIn }),
  toggleFollowing: (id) =>
    set((state) => ({
      following: state.following.includes(id)
        ? state.following.filter((item) => item !== id)
        : [...state.following, id],
    })),
  togglePostLike: (id) =>
    set((state) => ({
      likedPosts: state.likedPosts.includes(id)
        ? state.likedPosts.filter((item) => item !== id)
        : [...state.likedPosts, id],
    })),
  markConversationRead: (id) =>
    set((state) => ({
      readConversationIds: state.readConversationIds.includes(id)
        ? state.readConversationIds
        : [...state.readConversationIds, id],
    })),
  addPkScore: (side, amount) =>
    set((state) => ({
      pkScores: { ...state.pkScores, [side]: state.pkScores[side] + amount },
    })),
  resetPkScores: () => set({ pkScores: { left: 15000, right: 6354 } }),
  sendGift: (price) => {
    if (get().coins < price) return false;
    set((state) => ({
      coins: state.coins - price,
      sentGiftCount: state.sentGiftCount + 1,
    }));
    return true;
  },
  recharge: (amount) => set((state) => ({ coins: state.coins + amount })),
}));