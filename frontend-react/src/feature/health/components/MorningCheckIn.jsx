import React, { useState, useEffect } from 'react';
import { checkInHealth } from '../api';

const MorningCheckIn = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 判断是否应显示模态框
    const checkVisibility = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // 查找清醒时段（例如凌晨4:00至中午12:00）
      if (hour >= 4 && hour <= 12) {
        const todayStr = now.toISOString().slice(0, 10);
        const lastCheckIn = localStorage.getItem('lastMorningCheckIn');
        
        // 若今日尚未签到则显示
        if (lastCheckIn !== todayStr) {
          setIsVisible(true);
        }
      }
    };

    checkVisibility();
  }, []);

  if (!isVisible) return null;

  const handleStatusClick = async (quality) => {
    if (loading) return;
    setLoading(true);
    try {
      await checkInHealth({
        sleepHours: parseFloat(sleepHours),
        sleepQuality: quality
      });
      // 保存本地状态以防止今日再次弹出
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('lastMorningCheckIn', todayStr);
      
      // 冰川消失动画由css处理，此处仅为简化而卸载
      setIsVisible(false);
    } catch (err) {
      console.error("Health check-in failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem('lastMorningCheckIn', todayStr);
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="backdrop-blur-xl bg-white/70 border border-white max-w-sm rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        
        {/* 标题*/}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">Good Morning! ☀️</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">How did you sleep last night?</p>
          </div>
          <button 
            onClick={handleSkip} 
            className="text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-full transition-colors"
          >
            Skip
          </button>
        </div>

        {/* 交互式滑块*/}
        <div className="mb-6">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Duration</span>
            <span className="text-xl font-black text-indigo-600">{sleepHours} <span className="text-sm font-medium text-indigo-400">hours</span></span>
          </div>
          <input
            type="range"
            min="3"
            max="14"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-1 px-1">
            <span>3h</span>
            <span>14h</span>
          </div>
        </div>

        {/* 自动提交表情按钮*/}
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => handleStatusClick('bad')}
            disabled={loading}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">😴</span>
            <span className="text-xs font-bold text-slate-400 group-hover:text-red-500">Not enough</span>
          </button>

          <button 
            onClick={() => handleStatusClick('okay')}
            disabled={loading}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-amber-50 hover:border-amber-200 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">👌</span>
            <span className="text-xs font-bold text-slate-400 group-hover:text-amber-500">Just right</span>
          </button>

          <button 
            onClick={() => handleStatusClick('great')}
            disabled={loading}
            className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-green-50 hover:border-green-200 transition-all active:scale-95 disabled:opacity-50 relative overflow-hidden"
          >
            <span className="text-3xl mb-1 group-hover:scale-110 transition-transform relative z-10">🔋</span>
            <span className="text-xs font-bold text-slate-400 group-hover:text-green-600 relative z-10">Fully charged</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-green-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default MorningCheckIn;
