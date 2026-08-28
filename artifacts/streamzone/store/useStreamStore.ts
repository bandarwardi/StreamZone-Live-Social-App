import { create } from 'zustand';

type Theme = 'dark' | 'light';
type Tab = 'home' | 'feed' | 'live' | 'messages' | 'profile';

type StreamStore = {
  theme: Theme;
  activeTab: Tab;
  coins: number;
  diamonds: number;
  following: string[];
  likedPosts: string[];
  sentGiftCount: number;
  toggleTheme: () => void;
  setActiveTab: (tab: Tab) => void;
  toggleFollowing: (id: string) => void;
  togglePostLike: (id: string) => void;
  sendGift: (price: number) => boolean;
  recharge: (amount: number) => void;
};

export const useStreamStore = create<StreamStore>((set, get) => ({
  theme: 'dark',
  activeTab: 'home',
  coins: 14690,
  diamonds: 25000,
  following: [],
  likedPosts: [],
  sentGiftCount: 0,
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  setActiveTab: (activeTab) => set({ activeTab }),
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