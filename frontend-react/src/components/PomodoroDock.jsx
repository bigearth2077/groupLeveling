import React, { useEffect } from 'react';
import { Play, Square, Coffee, Brain, Timer, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudyStore } from '@/store/studyStore';

export default function PomodoroDock() {
  const { 
    status, 
    mode, 
    timeLeft, 
    checkActiveSession, 
    startFocus, 
    endFocus 
  } = useStudyStore();

  useEffect(() => {
    checkActiveSession();
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // UI Config based on mode
  const isResting = mode === 'rest';
  const themeColor = isResting ? 'text-emerald-400' : 'text-indigo-400';
  const bgColor = isResting ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500';

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className={cn(
        "flex items-center gap-4 px-2 py-2 rounded-full border border-slate-700 shadow-2xl transition-all duration-300",
        "bg-slate-900/90 backdrop-blur-md text-white"
      )}>
        
        {/* Left Section: Icon */}
        <div className={cn("pl-3 pr-1 flex items-center transition-colors", themeColor)}>
           {status === 'idle' ? <Timer size={20} /> : (isResting ? <Coffee size={20} /> : <Brain size={20} />)}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700/50"></div>

        {/* Middle Section: Controls & Time */}
        {status === 'idle' ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => startFocus(25, 'learning')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95"
            >
              <Zap size={16} className="fill-current" />
              <span>25m</span>
            </button>
             <button 
              onClick={() => startFocus(50, 'learning')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-sm transition-all active:scale-95"
            >
              <Brain size={16} />
              <span>50m</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 px-2">
            <div className="flex flex-col items-start leading-none">
              <span className="font-mono text-xl font-bold tracking-widest text-white tabular-nums">
                {formatTime(timeLeft)}
              </span>
              <span className={cn("text-[10px] font-bold uppercase tracking-wider", themeColor)}>
                {isResting ? 'Break Time' : 'Focusing'}
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

        {/* Divider (Optional, keep for layout balance) */}
        {status !== 'idle' && <div className="w-px h-6 bg-slate-700/50"></div>}
      </div>
    </div>
  );
}


