import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Inbox, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import FriendList from './FriendList';
import UserSearch from './UserSearch';
import RequestList from './RequestList';
import ChatPanel from './ChatPanel';
import AmbientBuddyRing from '@/feature/matching/components/AmbientBuddyRing';
import { getMe } from '@/feature/user/api';
import { getSocket } from '@/lib/socket';
import request from '@/lib/request';

export default function FriendDrawer({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'add' | 'requests' | 'chat'
  const [myAvatar, setMyAvatar] = useState(null);
  const [chatFriend, setChatFriend] = useState(null);

  useEffect(() => {
    // Only fetch if we need to display it inside
    getMe().then(u => {
        if (u) setMyAvatar(u.avatarUrl);
    }).catch(() => {});
    
    // Fetch initial global unread counts (messages + requests)
    fetchBadges();
  }, []);

  const [hasUnread, setHasUnread] = useState(false);

  const fetchBadges = async () => {
    try {
      // 1. messages
      const msgRes = await request.get('/messages/unread/per-friend');
      const totalMsg = Object.values(msgRes).reduce((a, b) => a + b, 0);
      
      // 2. pending requests (we could make an api for count, or just fetch requests)
      const reqRes = await request.get('/friends/requests/incoming', { params: { page: 1, pageSize: 1 } });
      const totalReq = reqRes.total || 0;
      
      setHasUnread(totalMsg > 0 || totalReq > 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    
    const handleNewMessage = () => {
      setHasUnread(true);
    };
    
    socket.on('receive_private_message', handleNewMessage);
    return () => socket.off('receive_private_message', handleNewMessage);
  }, []);

  // When drawer opens, maybe refresh badges
  useEffect(() => {
    if (isOpen) {
      fetchBadges();
    }
  }, [isOpen]);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="relative z-50">
      {/* Trigger */}
      <div onClick={toggle} className="cursor-pointer relative">
        {children ? children : (
            <div className={`h-8 w-8 rounded-full bg-slate-200 ring-2 ring-white hover:ring-indigo-100 transition-all overflow-hidden ${isOpen ? 'ring-indigo-200 ring-offset-2' : ''}`}>
                {myAvatar ? <img src={myAvatar} className="w-full h-full object-cover" /> : <User size={20} className="m-1.5 text-slate-500" />}
            </div>
        )}
        {hasUnread && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </div>

      {/* Floating Panel (Popover Wrapper) */}
      <div className={cn(
        "absolute top-14 right-0 transform transition-all duration-200 origin-top-right z-50",
        isOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible pointer-events-none"
      )}>
        
        {/* Ambient Buddies (Floating Left) */}
        <AmbientBuddyRing />

        {/* Drawer Content */}
        <div className="w-[360px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        {activeTab !== 'chat' && (
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
             <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
               <Users size={18} className="text-indigo-600" />
               社交中心
             </h2>
             <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
               <X size={16} />
             </button>
          </div>
        )}

        {/* Tabs */}
        {activeTab !== 'chat' && (
          <div className="flex p-2 gap-2 border-b border-slate-100 bg-white">
             {[
               { id: 'friends', icon: Users, label: '好友' },
               { id: 'add', icon: UserPlus, label: '添加' },
               { id: 'requests', icon: Inbox, label: '申请' }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={cn(
                   "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                   activeTab === tab.id 
                     ? "bg-slate-800 text-white shadow-md" 
                     : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                 )}
               >
                 <tab.icon size={14} />
                 {tab.label}
               </button>
             ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 bg-white">
           {activeTab === 'friends' && <FriendList onChat={(user) => { setChatFriend(user); setActiveTab('chat'); }} />}
           {activeTab === 'add' && <UserSearch />}
           {activeTab === 'requests' && <RequestList />}
           {activeTab === 'chat' && <ChatPanel friend={chatFriend} onBack={() => { setActiveTab('friends'); setChatFriend(null); }} />}
        </div>

        </div>
      </div>
    </div>
  );
}
