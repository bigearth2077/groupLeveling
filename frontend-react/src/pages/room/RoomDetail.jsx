import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  User, 
  Brain, 
  Coffee, 
  Loader2,
  LogOut
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useRoomStore } from '@/store/roomStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import UserProfileModal from '@/components/user/UserProfileModal';

export default function RoomDetail() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  
  const { 
    activeRoomId, 
    members, 
    messages, 
    setActiveRoomId, 
    leaveRoom 
  } = useRoomStore();

  const [inputMsg, setInputMsg] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Initialize Room
  useEffect(() => {
    // Only join if we are not already in this room (or in no room)
    // We access activeRoomId from store via closure or ref if needed, 
    // but here we trust that on mount (new roomId) we want to join.
    // We check the store value directly or assume if we are here, we want to be here.
    // To be safe against strict mode double-invoke or store lag, we can check inside.
    // Using the value from the hook scope is fine as long as we don't depend on it for re-running.
    if (activeRoomId !== roomId) {
      setActiveRoomId(roomId);
    }
  }, [roomId]); // Removed activeRoomId dependency

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/rooms');
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('send_message', JSON.stringify({
        roomId,
        content: inputMsg
      }));
      setInputMsg('');
    }
  };

  if (activeRoomId !== roomId) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        <span className="ml-3 text-slate-500 font-medium">Connecting to room...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 pb-24">
      
      {/* Main Area: Members Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/rooms')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Room #{roomId.slice(0, 4)}
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">Live</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
              <Users size={18} />
              {members.length} Online
            </div>
            <Button 
              size="sm" 
              variant="destructive" 
              className="rounded-xl h-9"
              onClick={handleLeave}
            >
              <LogOut size={16} className="mr-2" /> Leave
            </Button>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {members.map(m => {
              const isLearning = m.status === 'learning';
              const isResting = m.status === 'rest';
              
              return (
                <div 
                  key={m.userId} 
                  onClick={() => setSelectedUserId(m.userId)}
                  className="flex flex-col items-center animate-in zoom-in duration-300 cursor-pointer hover:scale-105 transition-transform"
                >
                  <div className={cn(
                    "relative w-20 h-20 rounded-full border-4 transition-all duration-500 flex items-center justify-center bg-white shadow-sm overflow-hidden",
                    isLearning ? "border-indigo-500 shadow-indigo-200 shadow-lg scale-105" : 
                    isResting ? "border-emerald-400 shadow-emerald-200" : 
                    "border-slate-200 grayscale-[0.5]"
                  )}>
                    {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <User size={32} className="text-slate-300" />}
                    
                    {/* Status Icon Overlay */}
                    {(isLearning || isResting) && (
                      <div className={cn(
                        "absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px] transition-opacity",
                      )}>
                         {isLearning ? <Brain className="text-white drop-shadow-md animate-pulse" size={28} /> : <Coffee className="text-white drop-shadow-md" size={28} />}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-center">
                    <div className="font-bold text-slate-700 text-sm truncate w-24">{m.nickname}</div>
                    <div className={cn(
                      "text-[10px] uppercase font-bold tracking-wider mt-0.5",
                      isLearning ? "text-indigo-600" : isResting ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {isLearning ? 'Focusing' : isResting ? 'Resting' : 'Idle'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar: Chat */}
      <div className="w-full md:w-80 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[400px] md:h-auto">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
          <MessageSquare size={18} /> Chat
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
          {messages.map((msg, i) => (
            <div key={i} className={cn("text-sm", msg.isSystem ? "text-center text-xs text-slate-400 my-2 italic" : "")}>
              {msg.isSystem ? (
                <span>{msg.content}</span>
              ) : (
                <div className="flex flex-col animate-in slide-in-from-left-2 duration-300">
                  <span className="text-[10px] font-bold text-slate-500 mb-0.5">{msg.sender?.nickname}</span>
                  <div className="bg-white p-2 rounded-lg rounded-tl-none border border-slate-100 shadow-sm text-slate-700 inline-block self-start">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        <form onSubmit={sendMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
          <Input 
            value={inputMsg}
            onChange={e => setInputMsg(e.target.value)}
            placeholder="Say hi..." 
            className="rounded-xl border-slate-200 text-sm"
          />
          <Button type="submit" size="icon" className="rounded-xl bg-slate-900 shrink-0">
            <Send size={16} />
          </Button>
        </form>
      </div>

      <UserProfileModal 
        userId={selectedUserId} 
        isOpen={!!selectedUserId} 
        onClose={() => setSelectedUserId(null)}
        isFriend={false} 
      />

    </div>
  );
}
