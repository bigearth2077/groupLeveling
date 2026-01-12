import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Headphones, Settings, Timer as TimerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PomodoroDock() {
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'paused'
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds

  useEffect(() => {
    let interval;
    if (status === 'running' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setStatus('idle');
      setTimeLeft(25 * 60);
    }
    return () => clearInterval(interval);
  }, [status, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (status === 'idle' || status === 'paused') setStatus('running');
    else setStatus('paused');
  };

  const stopTimer = () => {
    setStatus('idle');
    setTimeLeft(25 * 60);
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
      <div className={cn(
        "flex items-center gap-4 px-2 py-2 rounded-full border border-slate-700 shadow-2xl transition-all duration-300",
        "bg-slate-900/90 backdrop-blur-md text-white"
      )}>
        
        {/* Left Section: Icon */}
        <div className="pl-3 pr-1 flex items-center text-indigo-400">
           <TimerIcon size={20} />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700/50"></div>

        {/* Middle Section: Controls & Time */}
        {status === 'idle' ? (
          <button 
            onClick={toggleTimer}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95"
          >
            <Play size={16} className="fill-current" />
            <span>Start Session</span>
          </button>
        ) : (
          <div className="flex items-center gap-4 px-2">
            <span className="font-mono text-xl font-bold tracking-widest text-white tabular-nums">
              {formatTime(timeLeft)}
            </span>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={toggleTimer}
                className="p-2 rounded-full hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                {status === 'running' ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current" />}
              </button>
              <button 
                onClick={stopTimer}
                className="p-2 rounded-full hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors"
              >
                <Square size={16} className="fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700/50"></div>

        {/* Right Section: Extras */}
        <div className="flex items-center gap-1 pr-1">
          <button className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <Headphones size={18} />
          </button>
          <button className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}


