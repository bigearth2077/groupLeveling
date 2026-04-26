import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { startSession, endSession, sendHeartbeat, getActiveSession } from '@/feature/study/api';

export const useStudyStore = create(
  persist(
    (set, get) => ({
      status: 'idle', // 'idle', 'running', 'paused' (backend doesn't explicitly support pause, but frontend can UI pause -> actually we shouldn't allow pause for strict pomodoro, let's stick to 'running' vs 'idle')
      // Let's support 'idle' | 'focusing' | 'resting'
      
      mode: 'learning', // 'learning' | 'rest'
      sessionId: null,
      startTime: null,
      duration: 25, // minutes
      timeLeft: 25 * 60, // seconds
      
      defaultFocusDuration: 25, // 用户配置的专注时长
      defaultBreakDuration: 10, // 用户配置的休息时长
      
      selectedTag: null, // { id, name } or null
      
      timerInterval: null,

      // Actions
      setDefaultFocusDuration: (val) => set({ defaultFocusDuration: val }),
      setDefaultBreakDuration: (val) => set({ defaultBreakDuration: val }),
      setSelectedTag: (tag) => set({ selectedTag: tag }),
      
      // Check if there is an active session from backend (e.g. on page reload)
      checkActiveSession: async () => {
        try {
          const session = await getActiveSession();
          if (session && session.id) {
             // Found active session
             const now = new Date();
             const start = new Date(session.startTime);
             const elapsedSec = Math.floor((now - start) / 1000);
             
             const currentId = get().sessionId;
             if (currentId === session.id) {
               // Resume local state
               const intendedDurationSec = get().duration * 60;
               const remaining = intendedDurationSec - elapsedSec;
               
               if (remaining > 0) {
                 set({ 
                   status: session.type === 'learning' ? 'focusing' : 'resting',
                   mode: session.type,
                   timeLeft: remaining,
                   startTime: session.startTime
                 });
                 get().startTimer();
               } else {
                 get().stopTimer();
                 set({ status: 'idle', sessionId: null }); 
               }
             } else {
               set({
                 sessionId: session.id,
                 mode: session.type,
                 status: session.type === 'learning' ? 'focusing' : 'resting',
                 startTime: session.startTime,
                 duration: 25,
                 timeLeft: 25 * 60 - elapsedSec
               });
               get().startTimer();
             }
          } else {
             set({ status: 'idle', sessionId: null, timerInterval: null });
          }
        } catch (err) {
          console.error("Failed to check active session", err);
        }
      },

      startFocus: async (minutes, type = 'learning', tagName = null) => {
        try {
          // 1. Call Backend
          const res = await startSession({ type, tagName });
          if (res && res.id) {
            // 2. Set Local State
            set({
              status: type === 'learning' ? 'focusing' : 'resting',
              mode: type,
              sessionId: res.id,
              startTime: new Date().toISOString(),
              duration: minutes,
              timeLeft: minutes * 60
            });
            // 3. Start Interval
            get().startTimer();
          }
        } catch (err) {
          console.error("Start session failed", err);
          throw err;
        }
      },

      endFocus: async () => {
        const { sessionId, timerInterval } = get();
        if (timerInterval) clearInterval(timerInterval);
        
        if (sessionId) {
          try {
            await endSession(sessionId);
          } catch (err) {
            console.error("End session failed", err);
          }
        }
        
        set({
          status: 'idle',
          sessionId: null,
          timerInterval: null,
          timeLeft: get().defaultFocusDuration * 60
        });
      },

      // Internal Timer Logic
      startTimer: () => {
        const { timerInterval } = get();
        if (timerInterval) clearInterval(timerInterval);

        const interval = setInterval(() => {
          const { timeLeft, sessionId } = get();
          
          if (timeLeft <= 0) {
            // Time's up!
            get().handleTimerComplete();
            return;
          }

          // Heartbeat every minute (approx)
          if (timeLeft % 60 === 0 && sessionId) {
             sendHeartbeat(sessionId).catch(console.error);
          }

          set({ timeLeft: timeLeft - 1 });
        }, 1000);

        set({ timerInterval: interval });
      },

      stopTimer: () => {
        const { timerInterval } = get();
        if (timerInterval) clearInterval(timerInterval);
        set({ timerInterval: null });
      },

      handleTimerComplete: () => {
        const { mode, endFocus, startFocus, defaultBreakDuration } = get();
        
        // Stop current
        endFocus(); 

        // Vibration feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        
        if (mode === 'learning') {
          setTimeout(() => {
             // Create a rest session
             startFocus(defaultBreakDuration, 'rest');
             if (Notification.permission === 'granted') {
               new Notification("Focus Complete!", { body: `Starting ${defaultBreakDuration}min Break.` });
             }
          }, 1000);
        } else {
          // Rest over
           if (Notification.permission === 'granted') {
             new Notification("Break Over!", { body: "Ready to focus again?" });
           }
        }
      }
    }),
    {
      name: 'study-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        sessionId: state.sessionId,
        status: state.status, 
        mode: state.mode, 
        startTime: state.startTime,
        duration: state.duration,
        defaultFocusDuration: state.defaultFocusDuration,
        defaultBreakDuration: state.defaultBreakDuration
      }), 
    }
  )
);
