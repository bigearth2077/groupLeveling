import React, { useEffect, useState } from 'react';
import { Play, Square, Coffee, Brain, Timer, Zap, Tag as TagIcon, ChevronUp, ChevronDown, Plus, Search, Users, X, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useStudyStore } from '@/store/studyStore';
import { useRoomStore } from '@/store/roomStore';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PomodoroDock({ isEmbedded = false }) {
  const {
    status,
    mode,
    timeLeft,
    checkActiveSession,
    startFocus,
    endFocus,
    defaultFocusDuration,
    defaultBreakDuration,
    setDefaultFocusDuration,
    setDefaultBreakDuration
  } = useStudyStore();

  const { activeRoomId, unreadCount, resetUnread, leaveRoom } = useRoomStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [showSettings, setShowSettings] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 检查是否在房间中但未查看
  const isRoomBackground = activeRoomId && !location.pathname.includes(`/room/${activeRoomId}`);

  useEffect(() => {
    checkActiveSession();

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleStart = (mins) => {
    startFocus(mins, 'learning', null);
    setShowSettings(false);
    setIsCollapsed(true);
  };

  const handleReturnToRoom = () => {
    resetUnread();
    navigate(`/room/${activeRoomId}`);
  };

  const handleLeaveRoom = (e) => {
    e.stopPropagation();
    leaveRoom();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isResting = mode === 'rest';
  const themeColor = isEmbedded
    ? 'text-blue-600'
    : (isResting ? 'text-emerald-400' : 'text-indigo-400');
  const glowColor = isResting ? 'shadow-emerald-500/20' : 'shadow-indigo-500/20';
  const borderColor = isResting ? 'border-emerald-500/30' : 'border-indigo-500/30';

  // --- 折叠视图 ---
  if (status !== 'idle' && isCollapsed && !isEmbedded) {
    return (
      <div className="flex flex-col items-end gap-2">
        {/* 房间标识（后台模式）*/}
        {isRoomBackground && (
          <div
            onClick={handleReturnToRoom}
            className="cursor-pointer animate-in slide-in-from-bottom-2 fade-in"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm hover:shadow transition-all group">
              <Users size={12} className={unreadCount > 0 ? "text-red-500 animate-pulse" : "text-emerald-500"} />
              <span>{t('pomodoro.roomLive')}</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}

              <button
                onClick={handleLeaveRoom}
                className="ml-1 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <div
          onClick={() => setIsCollapsed(false)}
          className={cn(
            "relative cursor-pointer group",
            "flex items-center gap-3 px-4 py-2 rounded-full border bg-white/90 backdrop-blur-md text-slate-800 shadow-md transition-all hover:scale-105 hover:-translate-y-1",
            "border-slate-100" // 最小边框
          )}
        >
          <div className={cn("flex items-center justify-center transition-colors", themeColor)}>
            {isResting ? <Coffee size={14} /> : <Brain size={14} className="animate-pulse" />}
          </div>
          <span className="font-mono text-xs font-bold tracking-widest tabular-nums">
            {formatTime(timeLeft)}
          </span>

          {/* 进度条背景*/}
          <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-blue-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-1000", isResting ? "bg-emerald-500" : "bg-blue-600")}
              style={{ width: `${(timeLeft / (useStudyStore.getState().duration * 60)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // --- 展开视图 ---
  return (
    <div className={cn(
      "relative flex flex-col items-center gap-3",
      !isEmbedded && "items-end"
    )}>

      {/* 房间标识（后台模式）*/}
      {isRoomBackground && (
        <div
          onClick={handleReturnToRoom}
          className="cursor-pointer animate-in slide-in-from-bottom-2 fade-in mb-1"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-sm hover:shadow transition-all">
            <Users size={12} className={unreadCount > 0 ? "text-red-500 animate-pulse" : "text-emerald-500"} />
            <span>{t('pomodoro.backToRoom')}</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}

            <button
              onClick={handleLeaveRoom}
              className="ml-1 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}


      {/* 设置气泡*/}
      {status === 'idle' && showSettings && (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-100 rounded-3xl p-5 shadow-xl w-64 animate-in fade-in slide-in-from-bottom-4 duration-200 mb-2">
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Brain size={14} />{t('pomodoro.focusTime')}</span>
              <span className="text-xs text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">{defaultFocusDuration}m</span>
            </div>
            <input
              type="range"
              min="10" max="120" step="5"
              value={defaultFocusDuration}
              onChange={(e) => setDefaultFocusDuration(parseInt(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
              <span>10m</span><span>120m</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5"><Coffee size={14} />{t('pomodoro.breakTime')}</span>
              <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{defaultBreakDuration}m</span>
            </div>
            <input
              type="range"
              min="5" max="30" step="1"
              value={defaultBreakDuration}
              onChange={(e) => setDefaultBreakDuration(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
              <span>5m</span><span>30m</span>
            </div>
          </div>
        </div>
      )}

      {/* 主停靠栏*/}
      <div className={cn(
        "relative flex items-center gap-3 transition-all duration-300",
        isEmbedded
          ? "bg-transparent w-full text-slate-700 justify-between"
          : "bg-white/95 backdrop-blur-xl border border-slate-200 shadow-lg text-slate-800 rounded-full px-3 py-2.5"
      )}>

        {/* 切换折叠按钮（仅当运行且未嵌入时）*/}
        {status !== 'idle' && !isEmbedded && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-slate-500 rounded-full p-0.5 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm"
          >
            <ChevronDown size={12} />
          </button>
        )}

        {/* 左侧区域：图标和当前标签*/}
        <div className={cn(
          "pl-2 pr-1 flex items-center gap-2 transition-colors",
          themeColor
        )}>
          {status !== 'idle' && (
            isResting ? <Coffee size={20} /> : <Brain size={20} />
          )}
          {status === 'idle' && <Timer size={18} />}
        </div>

        {/* 分隔线*/}
        <div className={cn("w-px h-6", isEmbedded ? "bg-slate-200" : "bg-slate-200")}></div>

        {/* 中间区域：控件和时间*/}
        {status === 'idle' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStart(defaultFocusDuration)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all active:scale-95 shadow-sm"
            >
              <Play size={14} className="fill-current" />
              <span>{defaultFocusDuration}m</span>
            </button>
            <button
              onClick={() => {
                setShowSettings(!showSettings);
              }}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full transition-all active:scale-95",
                showSettings
                  ? "bg-slate-100 text-slate-700"
                  : "bg-transparent hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              )}
            >
              <Settings size={16} className={showSettings ? "animate-spin-slow" : ""} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 px-2">
            <div className="flex flex-col items-start leading-none min-w-[60px]">
              <span className="font-mono text-xl font-bold tracking-widest text-slate-800 tabular-nums">
                {formatTime(timeLeft)}
              </span>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", themeColor)}>
                {isResting ? '休息中' : '专注中'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={endFocus}
                className="p-2 rounded-full hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
                title="Stop Session"
              >
                <Square size={16} className="fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* 分隔线（可选）*/}
        {status !== 'idle' && <div className="w-px h-6 bg-slate-200"></div>}
      </div>
    </div>
  );
}

