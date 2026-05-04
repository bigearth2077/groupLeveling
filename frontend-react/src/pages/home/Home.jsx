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
import { getRecommendedRooms } from '@/feature/matching/api';
import { getGlobalRankings, getFriendRankings } from '@/feature/ranking/api';
import { getStatsSummary } from '@/feature/study/api';
import { useRoomJoin } from '@/hooks/useRoomJoin';
import RoomPasswordModal from '@/components/room/RoomPasswordModal';
import ActivityHeatmap from '@/feature/analytics/components/ActivityHeatmap';
import TimeMatrix from '@/feature/analytics/components/TimeMatrix';

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

        // 2. Fetch Rooms (Using Algorithm Recommendation)
        const roomsResp = await getRecommendedRooms();
        if (roomsResp && roomsResp.items) {
          // Take top 4 highly matched rooms
          setRooms(roomsResp.items.slice(0, 4));
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
        <div className="col-span-1 md:col-span-12 lg:col-span-8 group relative overflow-hidden rounded-[2rem] bg-white border border-slate-100/60 p-8 sm:p-10 shadow-sm hover:shadow transition-shadow">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap size={120} className="text-indigo-600 rotate-12" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100/50">
                  等级 {userStats.level}
                </span>
                <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                  <Flame size={16} className="fill-current" />
                  <span>已连续学习 {userStats.streak || 0} 天</span>
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                  欢迎回来，{userStats.nickname}
                </h1>
                <p className="text-slate-500 mt-2 font-medium">
                  还差 <span className="text-blue-600 font-bold">{userStats.nextLevelXP - userStats.currentXP} 经验值</span> 升至等级 {userStats.level + 1}。
                </p>
              </div>

              {/* XP Bar */}
              <div className="space-y-2 max-w-lg">
                <div className="flex justify-between text-xs font-semibold text-slate-400">
                  <span>当前经验值</span>
                  <span>目标 {userStats.nextLevelXP}</span>
                </div>
                <div className="h-4 w-full rounded-full bg-slate-50 border border-slate-100 overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-out"
                    style={{ width: `${userStats.progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button 
              onClick={() => navigate('/rooms')}
              className="shrink-0 rounded-2xl bg-blue-600 px-8 py-4 text-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:bg-blue-500 active:translate-y-0 active:scale-95 flex items-center gap-3 group/btn"
            >
              <span className="font-bold text-lg">加入小组</span>
              <div className="rounded-full bg-white/20 p-1.5 transition-transform group-hover/btn:translate-x-1">
                <ArrowRight size={20} />
              </div>
            </button>
          </div>
        </div>

        {/* Mini Stats (Desktop Sidebar Top) */}
        <div className="col-span-1 md:col-span-6 lg:col-span-4 grid grid-cols-2 gap-4">
          <div className="rounded-[2rem] bg-orange-50 p-6 flex flex-col justify-between border border-orange-100/50">
            <div className="rounded-full bg-white/60 w-10 h-10 flex items-center justify-center text-orange-600 mb-2">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">{userStats.todayMinutes}m</div>
              <div className="text-xs font-medium text-orange-700/60 uppercase">今日专注时长</div>
            </div>
          </div>
           <div className="rounded-[2rem] bg-white p-6 flex flex-col justify-between border border-slate-100/60 shadow-sm">
            <div className="rounded-full bg-slate-50 w-10 h-10 flex items-center justify-center text-slate-600 mb-2 border border-slate-100">
              <Trophy size={20} />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-800">{userStats.globalRank}</div>
              <div className="text-xs font-medium text-slate-500 uppercase">全球排名</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section (New Heatmaps) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-12 xl:col-span-5 rounded-[2rem] bg-white border border-slate-100/60 p-8 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-1 text-lg flex items-center gap-2">
              <Zap size={18} className="text-orange-500" />
              活动日历
            </h3>
            <p className="text-xs text-slate-400 mb-4">记录你全年的学习足迹</p>
            <ActivityHeatmap />
         </div>
         <div className="lg:col-span-12 xl:col-span-7 rounded-[2rem] bg-white border border-slate-100/60 p-8 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-1 text-lg flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              专注高峰时段
            </h3>
            <p className="text-xs text-slate-400 mb-4">过去30天内24小时的效率分布图</p>
            <TimeMatrix />
         </div>
      </div>

      {/* 2. Main Layout: Active Rooms vs Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Active Rooms Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-orange-100 rounded-lg">
                <Flame className="text-orange-600" size={18} />
              </span>
              推荐小组
            </h2>
            <button 
              onClick={() => navigate('/rooms')}
              className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              查看全部
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Create Room Card */}
            <div 
              onClick={() => navigate('/rooms')}
              className="group cursor-pointer rounded-3xl border border-dashed border-slate-300 bg-white p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors hover:border-blue-400 hover:bg-blue-50/30"
            >
              <div className="rounded-full bg-blue-50 p-3 group-hover:scale-110 transition-transform text-blue-600">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-700">创建小组</h3>
                <p className="text-xs text-slate-400">开启你的个人自习室</p>
              </div>
            </div>

            {/* Room Cards */}
            {rooms.length === 0 ? (
              <div className="col-span-1 md:col-span-2 p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                暂无活跃自习室。快去创建一个吧！
              </div>
            ) : (
              rooms.map(room => (
                <div 
                  key={room.id} 
                  onClick={() => handleJoinAttempt(room)}
                  className="group relative rounded-3xl bg-white p-5 border border-slate-100/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      <div className="p-2 rounded-2xl bg-blue-50 text-blue-600">
                         {room.isPrivate ? <Lock size={20} /> : <Code2 size={20} />}
                      </div>
                      {room.matchScore > 0 && (
                        <div className="flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">匹配度</span>
                          <span className="text-sm font-black text-orange-500 leading-none">{Math.round(room.matchScore)}%</span>
                        </div>
                      )}
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
                    <div className="rounded-full bg-blue-50 p-2 text-blue-600">
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
          <div className="rounded-[2rem] bg-white border border-slate-100/60 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-500" />
                全球排行
              </h3>
              <button 
                onClick={() => navigate('/rankings')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg"
              >
                查看全部
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {leaderboard.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-400">暂无排行数据</div>
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
          <div className="rounded-[2rem] bg-white border border-slate-100/60 shadow-sm overflow-hidden">
             <div className="p-5 border-b border-slate-50 flex justify-between items-center">
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                 <Users size={16} /> 好友排行
               </h3>
             </div>
             <div className="divide-y divide-slate-50">
                {friendRankings.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">添加好友一起竞赛吧！</div>
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