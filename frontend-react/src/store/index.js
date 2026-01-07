import { create } from 'zustand';

// 创建一个示例 store (类似 Pinia 的 defineStore)
export const useAppStore = create((set) => ({
  count: 0,
  user: null,
  isLoggedIn: false,
  
  // actions
  increment: () => set((state) => ({ count: state.count + 1 })),
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  logout: () => {
    set({ user: null, isLoggedIn: false });
  },
}));

