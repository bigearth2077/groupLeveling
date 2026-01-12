import React, { useState, useEffect } from 'react';
import { Trophy, Users, Globe, Search, Crown, Medal, User } from 'lucide-react';
import { getGlobalRankings, getFriendRankings } from '@/feature/ranking/api';
import { getMe } from '@/feature/user/api';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function Leaderboard() {
  const [scope, setScope] = useState('week'); // 'week' | 'all'
  const [type, setType] = useState('global'); // 'global' | 'friends'
  const [tag, setTag] = useState(''); // Tag filter for global
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    // Load my info to highlight myself
    getMe().then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    fetchRankings();
  }, [scope, type]); // Tag changes require manual submit or debounce

  const fetchRankings = async () => {
    setLoading(true);
    try {
      let res;
      if (type === 'global') {
        res = await getGlobalRankings(scope, 50, tag || null);
      } else {
        res = await getFriendRankings(scope, 50);
      }
      
      if (res && res.items) {
        setData(res.items);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTagSearch = (e) => {
    e.preventDefault();
    fetchRankings();
  };

  const topThree = data.slice(0, 3);
  const restList = data.slice(3);

  // Helper to get crown color
  const getRankColor = (index) => {
    if (index === 0) return "text-yellow-500 bg-yellow-50 border-yellow-200";
    if (index === 1) return "text-slate-400 bg-slate-50 border-slate-200";
    if (index === 2) return "text-amber-700 bg-orange-50 border-orange-200";
    return "text-slate-600 bg-white border-slate-100";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Leaderboard</h1>
            <p className="text-sm text-slate-500 font-medium">Compete with the best</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
           {/* Scope Toggle */}
           <div className="flex bg-slate-100 p-1 rounded-xl">
             {['week', 'all'].map(s => (
               <button
                 key={s}
                 onClick={() => setScope(s)}
                 className={cn(
                   "px-4 py-2 rounded-lg text-xs font-bold transition-all capitalize",
                   scope === s ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700"
                 )}
               >
                 {s === 'week' ? 'This Week' : 'All Time'}
               </button>
             ))}
           </div>

           {/* Type Toggle */}
           <div className="flex bg-slate-100 p-1 rounded-xl">
             <button
               onClick={() => setType('global')}
               className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2", type === 'global' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500")}
             >
               <Globe size={14} /> Global
             </button>
             <button
               onClick={() => setType('friends')}
               className={cn("px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2", type === 'friends' ? "bg-white shadow-sm text-emerald-600" : "text-slate-500")}
             >
               <Users size={14} /> Friends
             </button>
           </div>
        </div>
      </div>

      {/* Tag Filter (Global Only) */}
      {type === 'global' && (
        <form onSubmit={handleTagSearch} className="relative max-w-md mx-auto">
          <input 
            type="text" 
            placeholder="Filter by skill tag (e.g. Code, Math)..."
            value={tag}
            onChange={e => setTag(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Podium */}
          {data.length > 0 && (
            <div className="flex justify-center items-end gap-4 md:gap-8 min-h-[240px] pt-8">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-200 overflow-hidden shadow-lg">
                      {topThree[1].avatarUrl ? <img src={topThree[1].avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"><User /></div>}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                      #2
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="font-bold text-slate-700 truncate w-24">{topThree[1].nickname}</div>
                    <div className="text-xs text-slate-400 font-mono">{topThree[1].minutes}m</div>
                  </div>
                  <div className="w-24 h-32 bg-gradient-to-b from-slate-100 to-slate-200 rounded-t-xl shadow-inner border-t border-white/50"></div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 z-10">
                  <Crown size={32} className="text-yellow-500 mb-2 fill-yellow-200 animate-bounce" />
                  <div className="relative mb-3">
                    <div className="w-24 h-24 rounded-full border-4 border-yellow-400 overflow-hidden shadow-xl shadow-yellow-200">
                      {topThree[0].avatarUrl ? <img src={topThree[0].avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"><User /></div>}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-white px-3 py-0.5 rounded-full text-sm font-black shadow-sm">
                      #1
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="font-bold text-slate-800 text-lg truncate w-32">{topThree[0].nickname}</div>
                    <div className="text-sm text-yellow-600 font-mono font-bold">{topThree[0].minutes}m</div>
                  </div>
                  <div className="w-28 h-40 bg-gradient-to-b from-yellow-50 to-yellow-100 rounded-t-xl shadow-md border-t border-white/50 flex items-center justify-center">
                     <Medal className="text-yellow-300 opacity-50 w-12 h-12" />
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
                  <div className="relative mb-3">
                    <div className="w-20 h-20 rounded-full border-4 border-orange-200 overflow-hidden shadow-lg">
                      {topThree[2].avatarUrl ? <img src={topThree[2].avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"><User /></div>}
                    </div>
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm">
                      #3
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="font-bold text-slate-700 truncate w-24">{topThree[2].nickname}</div>
                    <div className="text-xs text-slate-400 font-mono">{topThree[2].minutes}m</div>
                  </div>
                  <div className="w-24 h-24 bg-gradient-to-b from-orange-50 to-orange-100 rounded-t-xl shadow-inner border-t border-white/50"></div>
                </div>
              )}
            </div>
          )}

          {/* Rank List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-500 mt-8">
            {restList.length === 0 && topThree.length === 0 && (
              <div className="p-12 text-center text-slate-400">No ranking data available yet.</div>
            )}
            
            {restList.map((item, index) => {
              const rank = index + 4;
              const isMe = me?.id === item.userId;
              
              return (
                <div 
                  key={item.userId} 
                  className={cn(
                    "flex items-center p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors",
                    isMe ? "bg-indigo-50/50 hover:bg-indigo-50" : ""
                  )}
                >
                  <div className="w-12 font-bold text-slate-400 text-center">{rank}</div>
                  
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                       {item.avatarUrl ? <img src={item.avatarUrl} className="w-full h-full object-cover"/> : <User size={18} className="text-slate-400" />}
                    </div>
                    <div className="font-bold text-slate-700">
                      {item.nickname}
                      {isMe && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full uppercase">You</span>}
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold text-slate-600 w-24">
                    {item.minutes} <span className="text-xs text-slate-400 font-sans font-normal">min</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
