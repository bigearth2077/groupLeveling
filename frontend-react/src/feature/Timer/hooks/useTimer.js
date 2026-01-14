import { useState, useEffect, useCallback, useRef } from 'react';
import { sessionApi } from '../api/session';
import { useTimerStore } from '../../../store/timerStore';

// 定义模式配置，包含类型、时长、标签
const MODES = {
  focus: { type: 'learning', minutes: 25, label: '专注' },
  focus_50: { type: 'learning', minutes: 50, label: '深潜' },
  short: { type: 'short_break', minutes: 5, label: '短休' },
  long: { type: 'long_break', minutes: 15, label: '长休' },
};

// 辅助：判断是否为学习类模式
export const isLearningMode = (modeKey) => MODES[modeKey]?.type === 'learning';

export const useTimer = () => {
  const [mode, setMode] = useState('focus'); 
  const [timeLeft, setTimeLeft] = useState(MODES.focus.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // 新增暂停状态
  const [sessionId, setSessionId] = useState(null);
  
  const timerRef = useRef(null);
  const setFocusMode = useTimerStore((state) => state.setFocusMode);



  // 心跳机制
  useEffect(() => {
    let heartbeatInterval = null;

    if (isActive && !isPaused && sessionId) {
      // 每 60 秒发送一次心跳
      heartbeatInterval = setInterval(() => {
        sessionApi.sendHeartbeat(sessionId).catch(err => {
            console.error('Heartbeat failed:', err);
        });
      }, 60000); // 1分钟
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isActive, isPaused, sessionId]);

  // 切换模式（仅在未开始时允许）
  const switchMode = useCallback((newMode) => {
    if (isActive) return; 
    if (MODES[newMode]) {
        setMode(newMode);
        setTimeLeft(MODES[newMode].minutes * 60);
    }
  }, [isActive]);


  // 暂停计时
  const pauseTimer = useCallback(() => {
    if (isActive && !isPaused) {
      setIsPaused(true);
      setFocusMode(false); // 暂时退出专注模式
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isActive, isPaused, setFocusMode]);

  // 恢复计时
  const resumeTimer = useCallback(() => {
    if (isActive && isPaused) {
      setIsPaused(false);
      setFocusMode(true); // 恢复全局专注状态
    }
  }, [isActive, isPaused, setFocusMode]);

  // 放弃/重置 (Cancel)
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setFocusMode(false);
    setSessionId(null);
    setTimeLeft(MODES[mode].minutes * 60);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [mode, setFocusMode]);

  // 重新实现 startTimer 以包含 API 调用
  const handleStart = useCallback(async () => {
    if (timeLeft <= 0) return;

    try {
      // 仅在首次开始时创建 session
      if (!sessionId) {
        const config = MODES[mode];
        // 乐观更新 UI
        setIsActive(true);
        setIsPaused(false);
        setFocusMode(true);
        
        const res = await sessionApi.startSession({
            type: config.type,
            tagName: 'Default'
        });
        if (res && res.id) {
            setSessionId(res.id);
        }
      } else {
        // 从暂停恢复
        resumeTimer();
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      // 如果 API 失败，是否回滚 UI？暂时保留本地体验。
    }
  }, [timeLeft, mode, sessionId, resumeTimer, setFocusMode]);

  // 重新实现 complete 以使用真实 sessionId
  const handleComplete = useCallback(async () => {
    if (sessionId) {
        try {
            await sessionApi.endSession(sessionId);
        } catch (e) {
            console.error(e);
        }
    }
    resetTimer(); // 无论成功失败都重置 UI
  }, [sessionId, resetTimer]);


  // 使用 ref 来保存 handleComplete，以便在 interval 中调用且不作为依赖
  const handleCompleteRef = useRef(handleComplete);
  useEffect(() => {
    handleCompleteRef.current = handleComplete;
  }, [handleComplete]);

  // 倒计时 Ticker
  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // 在 setState 回调中，状态更新是同步的，但副作用最好分离
            // 但为了简单，可以在这里直接触发完成逻辑，或者设置为 0 后通过 effect 触发（但要注意死循环）
            // 最安全的方式：
            handleCompleteRef.current(); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
        if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused]); // 移除 timeLeft 依赖，防止每秒重建 interval

  // 格式化时间 mm:ss
  const formattedTime = (() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  })();

  const progress = (() => {
      const totalSeconds = MODES[mode].minutes * 60;
      return ((totalSeconds - timeLeft) / totalSeconds) * 100;
  })();

  return {
    timeLeft,
    formattedTime,
    isActive,
    isPaused, // 导出暂停状态
    mode,
    isLearning: isLearningMode(mode), // 导出是否为学习模式 (用于 UI 判断实心/镂空)
    progress,
    startTimer: handleStart, // 使用带 API 的 start
    pauseTimer,
    resumeTimer,
    resetTimer, // 放弃
    completeSession: handleComplete, // 手动完成
    switchMode,
    MODE_CONFIG: MODES
  };
};
