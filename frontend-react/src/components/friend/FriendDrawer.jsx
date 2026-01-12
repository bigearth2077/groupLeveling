import React, { useState, useEffect } from 'react';
import { X, Users, UserPlus, Inbox, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import FriendList from './FriendList';
import UserSearch from './UserSearch';
import RequestList from './RequestList';
import { getMe } from '@/feature/user/api';

export default function FriendDrawer({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'add' | 'requests'
  const [myAvatar, setMyAvatar] = useState(null);

  useEffect(() => {
    // Only fetch if we need to display it inside
    getMe().then(u => {
        if (u) setMyAvatar(u.avatarUrl);
    }).catch(() => {});
  }, []);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="relative z-50">
      {/* Trigger */}
      <div onClick={toggle} className="cursor-pointer">
        {children ? children : (
            <div className={`h-8 w-8 rounded-full bg-slate-200 ring-2 ring-white hover:ring-indigo-100 transition-all overflow-hidden ${isOpen ? 'ring-indigo-200 ring-offset-2' : ''}`}>
                {myAvatar ? <img src={myAvatar} className="w-full h-full object-cover" /> : <User size={20} className="m-1.5 text-slate-500" />}
            </div>
        )}
      </div>

      {/* Floating Panel (Popover) */}
      <div className={cn(
        "absolute top-14 right-0 w-[360px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 transform transition-all duration-200 origin-top-right flex flex-col overflow-hidden",
        isOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible pointer-events-none"
      )}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
           <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
             <Users size={18} className="text-indigo-600" />
             Social Hub
           </h2>
           <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
             <X size={16} />
           </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 border-b border-slate-100 bg-white">
           {[
             { id: 'friends', icon: Users, label: 'Friends' },
             { id: 'add', icon: UserPlus, label: 'Add' },
             { id: 'requests', icon: Inbox, label: 'Requests' }
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

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 bg-white">
           {activeTab === 'friends' && <FriendList />}
           {activeTab === 'add' && <UserSearch />}
           {activeTab === 'requests' && <RequestList />}
        </div>

      </div>
    </div>
  );
}
