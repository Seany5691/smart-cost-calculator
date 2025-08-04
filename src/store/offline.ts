import { create } from 'zustand';
import { OfflineState } from '@/lib/types';

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setOnlineStatus: (status: boolean) => set({ isOnline: status }),
})); 