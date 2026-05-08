import React, { useState, useEffect } from 'react';
import { getAmbientBuddies } from '../api';
import { sendFriendRequest } from '@/feature/friend/api';
import { Users, PartyPopper, UserPlus } from 'lucide-react';

const AmbientBuddyRing = () => {
  const [buddies, setBuddies] = useState([]);
  const [highFived, setHighFived] = useState({});

  useEffect(() => {
    const fetchBuddies = async () => {
      try {
        const res = await getAmbientBuddies(5);
        if (res && res.items) setBuddies(res.items);
      } catch (err) {
        console.error("Failed to load ambient buddies", err);
      }
    };
    fetchBuddies();
    
    //每5分钟定期刷新圆环
    const interval = setInterval(fetchBuddies, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!buddies || buddies.length === 0) return null;

  const handleHighFive = (userId) => {
    if (highFived[userId]) return; //已击掌
    
    //设置本地视觉状态
    setHighFived(prev => ({ ...prev, [userId]: true }));
    
    //未来待办：通过Socket.IO广播
    //socket.emit('ambient_high_five', { targetUserId: userId });

    //短暂延迟后重置动画锁定
    setTimeout(() => {
      setHighFived(prev => ({ ...prev, [userId]: false }));
    }, 2000);
  };

  const handleAddFriend = async (e, userId) => {
    e.stopPropagation(); //阻止击掌
    try {
      await sendFriendRequest(userId);
      alert('Friend request sent!');
    } catch (err) {
      alert('Could not send request: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="absolute right-full mr-4 top-4 z-40 hidden md:flex flex-col gap-4 transition-all">
      <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-full py-3 px-2 flex flex-col items-center gap-3 shadow-sm hover:shadow transition-shadow">
        
        <div className="p-1.5 rounded-full bg-blue-50 text-blue-500 mb-1" title="Top Algorithm Matches">
          <Users size={16} />
        </div>

        {buddies.map((buddy, index) => {
          const isHighFiving = highFived[buddy.id];
          
          return (
            <div key={buddy.id} className="relative group perspective-1000">
              
              {/*为极高匹配度突出显示徽章*/}
              {buddy.matchScore > 0.8 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10 animate-pulse"></div>
              )}

              {/*头像气泡*/}
              <button 
                onClick={() => handleHighFive(buddy.id)}
                className={`w-10 h-10 rounded-full border-2 focus:outline-none transition-all duration-300 transform
                  ${isHighFiving ? 'border-orange-400 scale-110 shadow-lg shadow-orange-200/50' : 'border-slate-100 group-hover:border-indigo-400 group-hover:shadow-md'}`}
              >
                {buddy.avatarUrl ? (
                  <img src={buddy.avatarUrl} alt={buddy.nickname} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                    {buddy.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>

              {/*击掌弹出动画*/}
              {isHighFiving && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-in zoom-in spin-in-12 fade-in duration-500">
                  <PartyPopper size={28} className="text-orange-500" />
                </div>
              )}

              {/*悬停工具提示菜单*/}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <div className="bg-slate-900 text-white text-xs whitespace-nowrap py-2 px-3 rounded-xl shadow-xl flex flex-col gap-1 items-start">
                  <div className="font-bold">{buddy.nickname}</div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <span className="text-orange-400">⚡ {Math.round(buddy.matchScore * 100)}%</span> 匹配度
                  </div>
                  {buddy.sharedTags && buddy.sharedTags.length > 0 && (
                    <div className="bg-slate-800 text-emerald-400 rounded px-1.5 py-0.5 mt-0.5 max-w-[160px] truncate">
                      {buddy.sharedTags[0]}
                    </div>
                  )}
                  <div className="text-[10px] text-indigo-300 mt-1 font-medium bg-white/10 px-2 py-0.5 rounded-full w-full text-center">
                    点击击掌 👏
                  </div>
                  <button 
                    onClick={(e) => handleAddFriend(e, buddy.id)}
                    className="mt-1 w-full flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 rounded-md transition-colors"
                  >
                    <UserPlus size={12} /> 加为好友
                  </button>
                </div>
              </div>

            </div>
          );
        })}

      </div>
    </div>
  );
};

export default AmbientBuddyRing;
