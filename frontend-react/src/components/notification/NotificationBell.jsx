import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Loader2, DoorOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import request from '@/lib/request';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    
    // Close popover on outside click
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewNotif = (data) => {
      setUnreadCount(prev => prev + 1);
      if (isOpen) {
        // If open, add to list top
        setNotifications(prev => [data.notification, ...prev]);
      }
    };

    socket.on('new_notification', handleNewNotif);
    return () => socket.off('new_notification', handleNewNotif);
  }, [isOpen]);

  // When opened, fetch the list
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchUnreadCount = async () => {
    try {
      const res = await request.get('/notifications/unread');
      setUnreadCount(res.unread);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await request.get('/notifications', { params: { page: 1, pageSize: 20 } });
      if (res && res.items) {
        setNotifications(res.items);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await request.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await request.patch(`/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (n) => {
    // If it's an invite, join the room
    if (n.type === 'invite' && n.relatedId) {
      navigate(`/room/${n.relatedId}`);
      setIsOpen(false);
    }
    // Mark as read automatically when clicked
    if (!n.isRead) {
      await handleMarkAsRead(n.id, { stopPropagation: () => {} });
    }
  };

  return (
    <div className="relative z-50" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      {/* Popover */}
      <div className={cn(
        "absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 transform transition-all duration-200 origin-top-right flex flex-col overflow-hidden",
        isOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible pointer-events-none"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin text-indigo-400" size={24} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-8 text-slate-400 text-sm">
              All caught up!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleAction(n)}
                  className={cn(
                    "p-4 hover:bg-slate-50 cursor-pointer transition-colors relative flex gap-3",
                    !n.isRead ? "bg-indigo-50/30" : ""
                  )}
                >
                  <div className="mt-1">
                    {n.type === 'invite' ? (
                       <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                         <DoorOpen size={14} />
                       </div>
                    ) : (
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                         <Bell size={14} />
                       </div>
                    )}
                  </div>
                  
                  <div className="flex-1 pr-4">
                    <div className="text-sm font-bold text-slate-800 mb-0.5">{n.title}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">{n.content}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                       {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {!n.isRead && (
                    <button 
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="absolute right-4 top-4 text-slate-300 hover:text-indigo-500 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
