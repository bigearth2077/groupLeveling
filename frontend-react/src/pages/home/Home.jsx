import React, { useState } from 'react';
import { 
  Flame, 
  Zap, 
  Users, 
  ArrowRight, 
  Plus, 
  Trophy, 
  Clock, 
  MoreHorizontal,
  Code2,
  BookOpen,
  Coffee
} from 'lucide-react';

// Mock Data
const USER_STATS = {
  level: 42,
  xp: 2450,
  nextLevelXp: 3000,
  streak: 12,
  todayMinutes: 45
};

const ACTIVE_ROOMS = [
  { id: 1, name: "Deep Work Protocol", tag: "Code", icon: Code2, members: 12, max: 20, color: "bg-blue-500" },
  { id: 2, name: "Late Night Readers", tag: "Study", icon: BookOpen, members: 5, max: 8, color: "bg-emerald-500" },
  { id: 3, name: "Chill & Lofi", tag: "Focus", icon: Coffee, members: 28, max: 50, color: "bg-amber-500" },
];

const LEADERBOARD = [
  { rank: 1, name: "Sarah Chen", xp: 12500, avatar: "bg-indigo-100" },
  { rank: 2, name: "Mike Ross", xp: 11200, avatar: "bg-green-100" },
  { rank: 3, name: "Jessica L", xp: 9800, avatar: "bg-purple-100" },
];

const ACTIVITIES = [
  { id: 1, user: "Alex", action: "reached Lvl 10", time: "2m ago" },
  { id: 2, user: "Sam", action: "focused for 2h", time: "15m ago" },
];

const Home = () => {
  const [activeTab, setActiveTab] = useState('all');

  const xpPercentage = (USER_STATS.xp / USER_STATS.nextLevelXp) * 100;

  return (
    <div className="space-y-6">
      
      {/* 1. Hero Section: Level & Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-1 md:col-span-12 lg:col-span-8 group relative overflow-hidden rounded-3xl bg-white border border-slate-100 p-8 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:shadow-indigo-200/50">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={120} className="text-indigo-600 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                  Level {USER_STATS.level}
                </span>
                <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                  <Flame size={16} className="fill-current" />
                  <span>{USER_STATS.streak} Day Streak</span>
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  Ready to evolve, User?
                </h1>
                <p className="text-slate-500 mt-1">
                  You are <span className="text-indigo-600 font-bold">{USER_STATS.nextLevelXp - USER_STATS.xp} XP</span> away from Level {USER_STATS.level + 1}.
                </p>
              </div>

              {/* XP Bar */}
              <div className="space-y-2 max-w-lg">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Current XP</span>
                  <span>Target</span>
                </div>
                <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${xpPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button className="shrink-0 rounded-2xl bg-slate-900 px-8 py-5 text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-95 flex items-center gap-3 group/btn">
              <span className="font-bold text-lg">Quick Start</span>
              <div className="rounded-lg bg-white/20 p-1 transition-transform group-hover/btn:translate-x-1">
                <ArrowRight size={20} />
              </div>
            </button>
          </div>
        </div>

        {/* Mini Stats (Desktop Sidebar Top) */}
        <div className="col-span-1 md:col-span-6 lg:col-span-4 grid grid-cols-2 gap-4">
          <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-orange-100 p-6 flex flex-col justify-between border border-orange-200">
            <div className="rounded-full bg-white/60 w-10 h-10 flex items-center justify-center text-orange-600 mb-2">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">{USER_STATS.todayMinutes}m</div>
              <div className="text-xs font-medium text-orange-700/60 uppercase">Today's Focus</div>
            </div>
          </div>
           <div className="rounded-3xl bg-white p-6 flex flex-col justify-between border border-slate-100 shadow-sm">
            <div className="rounded-full bg-slate-50 w-10 h-10 flex items-center justify-center text-slate-600 mb-2">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">#42</div>
              <div className="text-xs font-medium text-slate-500 uppercase">Global Rank</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Layout: Active Rooms vs Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Active Rooms Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users className="text-indigo-600" size={20} />
              Active Squads
            </h2>
            <div className="flex gap-2">
              {['all', 'study', 'code'].map(tab => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeTab === tab 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                  }`}
                 >
                   {tab.charAt(0).toUpperCase() + tab.slice(1)}
                 </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Room Card */}
            <div className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50/10">
              <div className="rounded-full bg-white p-3 shadow-sm group-hover:scale-110 transition-transform text-indigo-600">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-700">Create Squad</h3>
                <p className="text-xs text-slate-400">Host your own session</p>
              </div>
            </div>

            {/* Room Cards */}
            {ACTIVE_ROOMS.map(room => (
              <div key={room.id} className="group relative rounded-2xl bg-white p-5 border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded-xl ${room.color} bg-opacity-10 text-opacity-100`}>
                     <room.icon size={20} className={room.color.replace('bg-', 'text-')} />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {room.members}/{room.max}
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{room.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span>#{room.tag}</span>
                </div>
                
                <div className="absolute bottom-4 right-4 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  <div className="rounded-full bg-slate-900 p-2 text-white">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Leaderboard & Feed */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Leaderboard Card */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                Top Focus
              </h3>
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All</button>
            </div>
            <div className="divide-y divide-slate-50">
              {LEADERBOARD.map((user, idx) => (
                <div key={idx} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="font-bold text-slate-300 text-sm w-4">{user.rank}</div>
                  <div className={`h-8 w-8 rounded-full ${user.avatar} flex items-center justify-center text-xs font-bold text-slate-600`}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-700">{user.name}</div>
                    <div className="text-xs text-slate-400">{user.xp} XP</div>
                  </div>
                  {idx === 0 && <div className="text-lg">🥇</div>}
                  {idx === 1 && <div className="text-lg">🥈</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-2xl bg-white/50 border border-slate-100 p-5">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Live Activity</h3>
             <div className="space-y-4">
                {ACTIVITIES.map(act => (
                  <div key={act.id} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                    <p className="text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-800">{act.user}</span> {act.action}
                      <span className="block text-xs text-slate-400 mt-0.5">{act.time}</span>
                    </p>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Home;