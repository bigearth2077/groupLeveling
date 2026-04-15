import React, { useState, useEffect } from 'react';
import { getAmbientBuddies } from '../api';
import { Users, PartyPopper } from 'lucide-react';

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
    
    // Periodically refresh the ring every 5 mins
    const interval = setInterval(fetchBuddies, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!buddies || buddies.length === 0) return null;

  const handleHighFive = (userId) => {
    if (highFived[userId]) return; // Already high-fived
    
    // Set local visual state
    setHighFived(prev => ({ ...prev, [userId]: true }));
    
    // To-Do for future: Broadcast via Socket.IO
    // socket.emit('ambient_high_five', { targetUserId: userId });

    // Reset the animation lock after a short delay
    setTimeout(() => {
      setHighFived(prev => ({ ...prev, [userId]: false }));
    }, 2000);
  };

  return (
    <div className="fixed top-1/3 right-4 z-40 hidden xl:flex flex-col gap-4">
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full py-3 px-2 flex flex-col items-center gap-3 shadow-lg shadow-indigo-100/50">
        
        <div className="p-1.5 rounded-full bg-indigo-50 text-indigo-500 mb-1" title="Top Algorithm Matches">
          <Users size={16} />
        </div>

        {buddies.map((buddy, index) => {
          const isHighFiving = highFived[buddy.id];
          
          return (
            <div key={buddy.id} className="relative group perspective-1000">
              
              {/* Highlight Badge for extremely high matches */}
              {buddy.matchScore > 0.8 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white z-10 animate-pulse"></div>
              )}

              {/* Avatar Bubble */}
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

              {/* High-Five Pop Animation */}
              {isHighFiving && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-in zoom-in spin-in-12 fade-in duration-500">
                  <PartyPopper size={28} className="text-orange-500" />
                </div>
              )}

              {/* Hover Tooltip Menu */}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                <div className="bg-slate-900 text-white text-xs whitespace-nowrap py-2 px-3 rounded-xl shadow-xl flex flex-col gap-1 items-start">
                  <div className="font-bold">{buddy.nickname}</div>
                  <div className="text-slate-400 flex items-center gap-1">
                    <span className="text-orange-400">⚡ {Math.round(buddy.matchScore * 100)}%</span> Match
                  </div>
                  {buddy.sharedTags && buddy.sharedTags.length > 0 && (
                    <div className="bg-slate-800 rounded px-1.5 py-0.5 mt-0.5 max-w-[120px] truncate">
                      {buddy.sharedTags[0]}
                    </div>
                  )}
                  <div className="text-[10px] text-indigo-300 mt-1 font-medium bg-white/10 px-2 py-0.5 rounded-full w-full text-center">
                    Click to High Five 👏
                  </div>
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
