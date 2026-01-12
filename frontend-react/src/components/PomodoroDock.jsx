import React, { useEffect, useState } from 'react';
import { Play, Square, Coffee, Brain, Timer, Zap, Tag as TagIcon, ChevronUp, Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStudyStore } from '@/store/studyStore';
import { getMyTags } from '@/feature/tag/api';

export default function PomodoroDock() {
  const { 
    status, 
    mode, 
    timeLeft, 
    checkActiveSession, 
    startFocus, 
    endFocus,
    selectedTag,
    setSelectedTag
  } = useStudyStore();

  const [showTagPicker, setShowTagPicker] = useState(false);
  const [myTags, setMyTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    checkActiveSession();
    loadTags();
    
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const loadTags = async () => {
    try {
      const tags = await getMyTags();
      if (tags) setMyTags(tags);
    } catch (err) {
      console.error("Failed to load tags", err);
    }
  };

  const handleStart = (mins) => {
    startFocus(mins, 'learning', selectedTag?.name || null);
    setShowTagPicker(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isResting = mode === 'rest';
  const themeColor = isResting ? 'text-emerald-400' : 'text-indigo-400';

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3">
      
      {/* Tag Picker Bubble (Only in Idle) */}
      {status === 'idle' && showTagPicker && (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-3 shadow-2xl w-64 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex flex-wrap gap-2 mb-3">
            {myTags.slice(0, 6).map(t => (
              <button
                key={t.tagId}
                onClick={() => { setSelectedTag({ id: t.tagId, name: t.tagName }); setShowTagPicker(false); }}
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold transition-all",
                  selectedTag?.name === t.tagName 
                    ? "bg-indigo-600 text-white" 
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                #{t.tagName}
              </button>
            ))}
          </div>
          <div className="relative">
            <input 
              type="text"
              placeholder="Custom tag..."
              className="w-full bg-slate-800 border-none rounded-lg py-1.5 pl-8 pr-3 text-xs text-white focus:ring-1 focus:ring-indigo-500"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newTagName.trim()) {
                  setSelectedTag({ id: null, name: newTagName.trim() });
                  setNewTagName('');
                  setShowTagPicker(false);
                }
              }}
            />
            <Search size={12} className="absolute left-2.5 top-2 text-slate-500" />
          </div>
        </div>
      )}

      {/* Main Dock */}
      <div className={cn(
        "flex items-center gap-4 px-2 py-2 rounded-full border border-slate-700 shadow-2xl transition-all duration-300",
        "bg-slate-900/90 backdrop-blur-md text-white"
      )}>
        
        {/* Left Section: Icon & Current Tag */}
        <button 
          onClick={() => status === 'idle' && setShowTagPicker(!showTagPicker)}
          className={cn(
            "pl-3 pr-1 flex items-center gap-2 transition-colors", 
            themeColor,
            status === 'idle' ? "hover:opacity-80" : ""
          )}
        >
           {status === 'idle' ? (
             <>
               <TagIcon size={18} className={selectedTag ? "fill-current" : ""} />
               {selectedTag && <span className="text-[10px] font-black uppercase max-w-[60px] truncate">{selectedTag.name}</span>}
             </>
           ) : (
             isResting ? <Coffee size={20} /> : <Brain size={20} />
           )}
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-700/50"></div>

        {/* Middle Section: Controls & Time */}
        {status === 'idle' ? (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleStart(25)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95"
            >
              <Zap size={16} className="fill-current" />
              <span>25m</span>
            </button>
             <button 
              onClick={() => handleStart(50)}
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

        {/* Divider */}
        {status !== 'idle' && <div className="w-px h-6 bg-slate-700/50"></div>}
      </div>
    </div>
  );
}


