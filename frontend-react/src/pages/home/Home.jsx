import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Flame, 
  Zap, 
  Users, 
  ArrowRight, 
  Plus, 
  Trophy, 
  Clock, 
  Code2, 
  Lock, 
  Unlock,
  Loader2,
  User
} from 'lucide-react';
import { getMe, getUserProfile } from '@/feature/user/api';
import { getRooms } from '@/feature/room/api';
import { getGlobalRankings, getFriendRankings } from '@/feature/ranking/api';
import { getStatsSummary } from '@/feature/study/api';
import { useRoomJoin } from '@/hooks/useRoomJoin';
import RoomPasswordModal from '@/components/room/RoomPasswordModal';

const Home = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [userStats, setUserStats] = useState({
    level: 0,
    currentXP: 0,
    nextLevelXP: 100,
    levelFloorXP: 0,
    progress: 0,
    nickname: 'Guest',
    streak: 0,
    todayMinutes: 0,
    globalRank: '-'
  });
  
  const [rooms, setRooms] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [friendRankings, setFriendRankings] = useState([]);

  // Use Custom Hook for Join Logic
  const { 
    passwordModalRoom, 
    loading: joiningLoading, 
    error: joinError,
    handleJoinAttempt, 
    submitPassword, 
    closePasswordModal 
  } = useRoomJoin();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch User Info & Profile
        const me = await getMe();
        let myId = null;
        
        if (me && me.id) {
          myId = me.id;
          const profile = await getUserProfile(me.id);
          
          // Get Today's Stats
          const stats = await getStatsSummary({ range: '1' }); // Assuming backend handles '1' as today or last 1 day
          
          setUserStats(prev => ({
            ...prev,
            ...(profile && profile.levelInfo ? profile.levelInfo : {}),
            nickname: me.nickname,
            streak: stats?.currentStreak || 0, // If backend stats summary has streak, use it
            todayMinutes: stats?.totalMinutes || 0
          }));
        }

        // 2. Fetch Rooms
        const roomsResp = await getRooms({ page: 1, pageSize: 4 });
        if (roomsResp && roomsResp.items) {
          setRooms(roomsResp.items);
        }

        // 3. Fetch Leaderboards
        const [globalRes, friendRes] = await Promise.all([
          getGlobalRankings('week', 50), // Fetch more to find self
          getFriendRankings('week', 5)
        ]);

        if (globalRes && globalRes.items) {
          setLeaderboard(globalRes.items.slice(0, 5)); // Only show top 5 in UI
          
          // Calculate Rank
          if (myId) {
            const myRankIndex = globalRes.items.findIndex(u => u.userId === myId);
            setUserStats(prev => ({
              ...prev,
              globalRank: myRankIndex !== -1 ? `#${myRankIndex + 1}` : '50+'
            }));
          }
        }
        
        if (friendRes && friendRes.items) setFriendRankings(friendRes.items);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
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
                  Level {userStats.level}
                </span>
                <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                  <Flame size={16} className="fill-current" />
                  <span>{userStats.streak || 0} Day Streak</span>
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  Welcome back, {userStats.nickname}
                </h1>
                <p className="text-slate-500 mt-1">
                  You are <span className="text-indigo-600 font-bold">{userStats.nextLevelXP - userStats.currentXP} XP</span> away from Level {userStats.level + 1}.
                </p>
              </div>

              {/* XP Bar */}
              <div className="space-y-2 max-w-lg">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>Current XP</span>
                  <span>Target {userStats.nextLevelXP}</span>
                </div>
                <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${userStats.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button 
              onClick={() => navigate('/rooms')}
              className="shrink-0 rounded-2xl bg-slate-900 px-8 py-5 text-white shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:scale-95 flex items-center gap-3 group/btn"
            >
              <span className="font-bold text-lg">Join Squad</span>
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
              <div className="text-3xl font-bold text-slate-800">{userStats.todayMinutes}m</div>
              <div className="text-xs font-medium text-orange-700/60 uppercase">Today's Focus</div>
            </div>
          </div>
           <div className="rounded-3xl bg-white p-6 flex flex-col justify-between border border-slate-100 shadow-sm">
            <div className="rounded-full bg-slate-50 w-10 h-10 flex items-center justify-center text-slate-600 mb-2">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">{userStats.globalRank}</div>
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
            <button 
              onClick={() => navigate('/rooms')}
              className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Room Card */}
            <div 
              onClick={() => navigate('/rooms')}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors hover:border-indigo-400 hover:bg-indigo-50/10"
            >
              <div className="rounded-full bg-white p-3 shadow-sm group-hover:scale-110 transition-transform text-indigo-600">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-700">Create Squad</h3>
                <p className="text-xs text-slate-400">Host your own session</p>
              </div>
            </div>

            {/* Room Cards */}
            {rooms.length === 0 ? (
              <div className="col-span-1 md:col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                No active rooms found. Be the first to create one!
              </div>
            ) : (
              rooms.map(room => (
                <div 
                  key={room.id} 
                  onClick={() => handleJoinAttempt(room)}
                  className="group relative rounded-2xl bg-white p-5 border border-slate-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                       {room.isPrivate ? <Lock size={20} /> : <Code2 size={20} />}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {room.onlineCount || 0}/{room.maxMembers}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{room.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <span>#{room.tagName || 'General'}</span>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 opacity-0 transform translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    <div className="rounded-full bg-slate-900 p-2 text-white">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Leaderboard & Feed */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Global Leaderboard Card */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                Global Top
              </h3>
              <button 
                onClick={() => navigate('/rankings')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {leaderboard.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">No rankings yet.</div>
              ) : (
                leaderboard.map((user, idx) => (
                  <div key={user.id || idx} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                    <div className="font-bold text-slate-300 text-sm w-4">{idx + 1}</div>
                    <div className={`h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 overflow-hidden`}>
                      {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : user.nickname?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-700 truncate w-24">{user.nickname}</div>
                      <div className="text-xs text-slate-400">{user.minutes} min</div>
                    </div>
                    {idx === 0 && <div className="text-lg">🥇</div>}
                    {idx === 1 && <div className="text-lg">🥈</div>}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Friends Leaderboard Card */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-50 flex justify-between items-center">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <Users size={16} /> Top Friends
               </h3>
             </div>
             <div className="divide-y divide-slate-50">
                {friendRankings.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">Add friends to compete!</div>
                ) : (
                  friendRankings.map((user, idx) => (
                    <div key={user.id || idx} className="p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></div>
                      <div className={`h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden`}>
                         {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <User size={16} className="text-slate-400"/>}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-700">{user.nickname}</div>
                        <div className="text-xs text-slate-400">{user.minutes} min</div>
                      </div>
                    </div>
                  ))
                )}
             </div>
          </div>

        </div>
      </div>

      {/* Password Modal */}
      <RoomPasswordModal
        isOpen={!!passwordModalRoom}
        onClose={closePasswordModal}
        onConfirm={submitPassword}
        isLoading={joiningLoading}
        error={joinError}
      />
    </div>
  );
};

export default Home;