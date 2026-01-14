import { create } from 'zustand';

export const useTimerStore = create((set) => ({
  isFocusMode: false,
  setFocusMode: (isFocus) => set({ isFocusMode: isFocus }),
}));
