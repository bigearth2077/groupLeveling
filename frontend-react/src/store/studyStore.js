import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { startSession, endSession, sendHeartbeat, getActiveSession } from '@/feature/study/api';

export const useStudyStore = create(
  persist(
    (set, get) => ({
      status: 'idle', // '空闲', '运行中', '暂停'（后端未明确支持暂停，但前端可通过UI暂停 -> 实际上严格番茄钟不应允许暂停，我们应坚持仅用'运行中'和'空闲'）
      // 支持'空闲' | '专注中' | '休息中'
      
      mode: 'learning', // '学习' | '休息'
      sessionId: null,
      startTime: null,
      duration: 25, // 分钟
      timeLeft: 25 * 60, // 秒
      
      defaultFocusDuration: 25, // 用户配置的专注时长
      defaultBreakDuration: 10, // 用户配置的休息时长
      
      selectedTag: null, // { id, name } 或 null
      
      timerInterval: null,

      // 操作
      setDefaultFocusDuration: (val) => set({ defaultFocusDuration: val }),
      setDefaultBreakDuration: (val) => set({ defaultBreakDuration: val }),
      setSelectedTag: (tag) => set({ selectedTag: tag }),
      
      // 检查后端是否存在活跃会话（例如页面重载时）
      checkActiveSession: async () => {
        try {
          const session = await getActiveSession();
          if (session && session.id) {
             // 发现活跃会话
             const now = new Date();
             const start = new Date(session.startTime);
             const elapsedSec = Math.floor((now - start) / 1000);
             
             const currentId = get().sessionId;
             if (currentId === session.id) {
               // 恢复本地状态
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
          // 1. 调用后端
          const res = await startSession({ type, tagName });
          if (res && res.id) {
            // 2. 设置本地状态
            set({
              status: type === 'learning' ? 'focusing' : 'resting',
              mode: type,
              sessionId: res.id,
              startTime: new Date().toISOString(),
              duration: minutes,
              timeLeft: minutes * 60
            });
            // 3. 启动计时器
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

      // 内部计时逻辑
      startTimer: () => {
        const { timerInterval } = get();
        if (timerInterval) clearInterval(timerInterval);

        const interval = setInterval(() => {
          const { timeLeft, sessionId } = get();
          
          if (timeLeft <= 0) {
            // 时间到！
            get().handleTimerComplete();
            return;
          }

          // 每分钟心跳（约）
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
        
        // 停止当前
        endFocus(); 

        // 震动反馈
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
        
        if (mode === 'learning') {
          setTimeout(() => {
             // 创建休息会话
             startFocus(defaultBreakDuration, 'rest');
             if (Notification.permission === 'granted') {
               new Notification("Focus Complete!", { body: `Starting ${defaultBreakDuration}min Break.` });
             }
          }, 1000);
        } else {
          // 休息结束
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
