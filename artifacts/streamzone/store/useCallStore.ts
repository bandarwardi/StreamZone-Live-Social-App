import { create } from 'zustand';

interface CallState {
  activeCallId: string | null;
  callToken: any | null;
  callData: any | null;
  duration: number;
  setActiveCall: (callId: string, token: any, data: any) => void;
  clearActiveCall: () => void;
  incrementDuration: () => void;
}

export const useCallStore = create<CallState>((set) => ({
  activeCallId: null,
  callToken: null,
  callData: null,
  duration: 0,
  setActiveCall: (callId, token, data) => set({ activeCallId: callId, callToken: token, callData: data, duration: 0 }),
  clearActiveCall: () => set({ activeCallId: null, callToken: null, callData: null, duration: 0 }),
  incrementDuration: () => set((state) => ({ duration: state.duration + 1 })),
}));
