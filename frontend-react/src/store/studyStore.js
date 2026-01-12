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
      
      timerInterval: null,

      // Actions
      
      // Check if there is an active session from backend (e.g. on page reload)
      checkActiveSession: async () => {
        try {
          const session = await getActiveSession();
          if (session && session.id) {
             // Found active session
             const now = new Date();
             const start = new Date(session.startTime);
             const elapsedSec = Math.floor((now - start) / 1000);
             
             // We don't know the intended duration from backend (it just records start). 
             // We must infer or rely on local storage if available.
             // If local storage has matching ID, use local duration.
             // If not, maybe default to 25? Or just assume it's running.
             
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
                 // Expired while away
                 get().stopTimer(); // Just clear interval
                 set({ status: 'idle', sessionId: null }); 
                 // Optionally auto-end?
               }
             } else {
               // New session from another device? or cleared local storage
               // For now, let's sync it.
               set({
                 sessionId: session.id,
                 mode: session.type,
                 status: session.type === 'learning' ? 'focusing' : 'resting',
                 startTime: session.startTime,
                 // duration: ??? Assume 25 if unknown
                 duration: 25,
                 timeLeft: 25 * 60 - elapsedSec
               });
               get().startTimer();
             }
          } else {
             // No active session on backend
             set({ status: 'idle', sessionId: null, timerInterval: null });
          }
        } catch (err) {
          console.error("Failed to check active session", err);
        }
      },

      startFocus: async (minutes, type = 'learning') => {
        try {
          // 1. Call Backend
          const res = await startSession({ type });
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
          timeLeft: 25 * 60 // Reset default
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
        const { mode, endFocus, startFocus } = get();
        
        // Stop current
        endFocus(); 

        // Logic: If learning -> Auto start rest? Or prompt?
        // Prompt Requirement: "自动启动10min的休息计时" (Auto start 10min rest)
        
        if (mode === 'learning') {
          // Alert user or Toast?
          // Since this is in store, we can't easily toast. We'll set a flag or just do it.
          // Let's Trigger Rest
          // NOTE: We need to handle the async nature. 
          setTimeout(() => {
             // Create a rest session
             startFocus(10, 'rest');
             // Maybe dispatch a browser notification here?
             if (Notification.permission === 'granted') {
               new Notification("Focus Complete!", { body: "Starting 10min Break." });
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
        duration: state.duration
        // Don't persist timeLeft directly if we use startTime to recalc, 
        // but for simplicity MVP we can persist it.
      }), 
    }
  )
);
