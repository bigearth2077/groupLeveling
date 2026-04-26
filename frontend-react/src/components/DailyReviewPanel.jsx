import React, { useState, useEffect } from 'react';
import { ClipboardCheck, X, Check, Activity, Smile, Brain, Moon } from 'lucide-react';
import { getHealthToday, checkInHealth } from '@/feature/health/api';

const DailyReviewPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [sleepHours, setSleepHours] = useState('');
  const [studyQuality, setStudyQuality] = useState('');
  const [moodScore, setMoodScore] = useState('');
  const [exerciseMinutes, setExerciseMinutes] = useState('');
  const [fatigueLevel, setFatigueLevel] = useState('');

  useEffect(() => {
    // 检查今天是否已打卡
    getHealthToday()
      .then(res => {
        if (res.checkedIn) {
          setHasSubmitted(true);
        }
      })
      .catch(err => console.error('Failed to fetch today status:', err));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    
    // 构建 payload，只传有值的字段
    const payload = {};
    if (sleepHours !== '') payload.sleepHours = Number(sleepHours);
    if (studyQuality !== '') payload.studyQuality = Number(studyQuality);
    if (moodScore !== '') payload.moodScore = Number(moodScore);
    if (exerciseMinutes !== '') payload.exerciseMinutes = Number(exerciseMinutes);
    if (fatigueLevel !== '') payload.fatigueLevel = Number(fatigueLevel);
    
    try {
      await checkInHealth(payload);
      setHasSubmitted(true);
      setTimeout(() => setIsOpen(false), 800);
    } catch (err) {
      console.error('Submit failed:', err);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // Slider 组件，初始最左侧（未设置时值为空）
  const CustomSlider = ({ icon: Icon, label, value, onChange, min, max, step, leftLabel, rightLabel, unit = '' }) => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
          <Icon size={16} className="text-indigo-500" />
          {label}
        </div>
        <span className={`text-xs font-bold ${value === '' ? 'text-slate-300' : 'text-indigo-600'}`}>
          {value === '' ? '未填' : `${value}${unit}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value === '' ? min : value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-600 transition-all"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end justify-end">
      {/* 展开面板 */}
      <div 
        className={`absolute bottom-0 right-0 w-80 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-2xl transition-all duration-500 origin-bottom-right overflow-hidden ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-indigo-500" />
            <h3 className="font-bold text-slate-800">今日自评</h3>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <CustomSlider
            icon={Moon}
            label="睡眠时长"
            value={sleepHours}
            onChange={setSleepHours}
            min={3} max={14} step={0.5}
            leftLabel="3h" rightLabel="14h" unit="h"
          />
          
          <CustomSlider
            icon={Brain}
            label="今日学习质量"
            value={studyQuality}
            onChange={setStudyQuality}
            min={1} max={5} step={1}
            leftLabel="很差" rightLabel="超棒"
          />
          
          <CustomSlider
            icon={Smile}
            label="今日心情"
            value={moodScore}
            onChange={setMoodScore}
            min={1} max={5} step={1}
            leftLabel="低落" rightLabel="开心"
          />
          
          <CustomSlider
            icon={Activity}
            label="运动时长"
            value={exerciseMinutes}
            onChange={setExerciseMinutes}
            min={0} max={120} step={10}
            leftLabel="0" rightLabel="120m" unit="m"
          />
          
          <CustomSlider
            icon={Activity}
            label="疲劳感"
            value={fatigueLevel}
            onChange={setFatigueLevel}
            min={1} max={5} step={1}
            leftLabel="精力充沛" rightLabel="非常疲惫"
          />

          <div className="mt-8 mb-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {submitting ? '提交中...' : <><Check size={18} strokeWidth={3} /> 完成今日记录</>}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
              *所有项目均可选，空白也可提交，多次提交将覆盖当日记录
            </p>
          </div>
        </div>
      </div>

      {/* 悬浮按钮 (收起状态) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-300 hover:-translate-y-1 ${
          hasSubmitted 
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:shadow-emerald-100/50' 
            : 'bg-white text-slate-700 border border-slate-200 hover:shadow-slate-200/50 hover:border-slate-300'
        } ${isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}`}
      >
        {hasSubmitted ? (
          <>
            <Check size={16} strokeWidth={3} />
            <span className="text-sm font-bold">已完成</span>
          </>
        ) : (
          <>
            <ClipboardCheck size={16} className="text-indigo-500" />
            <span className="text-sm font-bold">日终</span>
          </>
        )}
      </button>
    </div>
  );
};

export default DailyReviewPanel;
