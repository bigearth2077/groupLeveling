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
  LogOut,
  Trash2,
  Settings,
  Trophy,
  LayoutGrid
} from 'lucide-react';
import { getSocket } from '@/lib/socket';
import { useRoomStore } from '@/store/roomStore';
import { getRoom, deleteRoom } from '@/feature/room/api';
import { getMe } from '@/feature/user/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import UserProfileModal from '@/components/user/UserProfileModal';
import RoomSettingsModal from '@/components/room/RoomSettingsModal';
import { useRoomSimulation } from '@/hooks/useRoomSimulation';

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
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'ranking'
  
  // 房间元数据及主持人检查
  const [roomInfo, setRoomInfo] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 🎭 AI 驱动的房间氛围模拟器
  useRoomSimulation(roomInfo, !!roomInfo);

  // 初始化房间并获取元数据
  useEffect(() => {
    if (activeRoomId !== roomId) {
      setActiveRoomId(roomId);
    }
    
    fetchRoomDetails();
  }, [roomId]); // 移除activeRoomId依赖

  const fetchRoomDetails = async () => {
    try {
      const [roomData, me] = await Promise.all([
        getRoom(roomId),
        getMe()
      ]);
      
      setRoomInfo(roomData);
      if (roomData && me && roomData.creatorId === me.id) {
        setIsHost(true);
      }
    } catch (err) {
      console.error("Failed to fetch room details:", err);
    }
  };

  // 新消息时滚动到底部（仅当有消息时）
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this room? This cannot be undone.")) return;
    try {
      await deleteRoom(roomId);
      leaveRoom(); // 清理存储
      navigate('/rooms');
    } catch (err) {
      alert("Failed to delete room");
    }
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
        <span className="ml-3 text-slate-500 font-medium">正在连接房间...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 pb-6">
      
      {/* 主区域：成员网格*/}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* 头部*/}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/rooms')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft size={20} className="text-slate-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {roomInfo ? roomInfo.name : `房间 #${roomId.slice(0, 4)}`}
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">进行中</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
              <Users size={18} />
              {members.length} 人在线
            </div>
            
            {isHost && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-xl h-9 border-slate-200 text-slate-600 hover:bg-slate-50"
                  onClick={() => setShowSettings(true)}
                  title="房间设置"
                >
                  <Settings size={16} className="mr-2" /> 设置
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="rounded-xl h-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={handleDelete}
                  title="Delete Room"
                >
                  <Trash2 size={16} />
                </Button>
              </>
            )}

            <Button 
              size="sm" 
              variant="destructive" 
              className="rounded-xl h-9"
              onClick={handleLeave}
            >
              <LogOut size={16} className="mr-2" /> 退出
            </Button>
          </div>
        </div>

        {/* 视图切换标签栏 */}
        <div className="px-6 pt-4 pb-0 bg-slate-50/50 flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-bold transition-all",
              viewMode === 'grid'
                ? "bg-white text-slate-800 shadow-sm border border-b-0 border-slate-100"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <LayoutGrid size={15} /> 成员动态
          </button>
          <button
            onClick={() => setViewMode('ranking')}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-bold transition-all",
              viewMode === 'ranking'
                ? "bg-white text-slate-800 shadow-sm border border-b-0 border-slate-100"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Trophy size={15} /> 等级排行
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-6 overflow-y-auto bg-white border-t-0">

          {/* ===== 视图 A：成员动态（原始网格） ===== */}
          {viewMode === 'grid' && (
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
                      {(isLearning || isResting) && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                          {isLearning ? <Brain className="text-white drop-shadow-md animate-pulse" size={28} /> : <Coffee className="text-white drop-shadow-md" size={28} />}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 text-center w-full px-2">
                      <div className="font-bold text-slate-700 text-sm truncate w-full flex items-center justify-center gap-1">
                        {m.role === 'owner' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-sm whitespace-nowrap">房主</span>}
                        {m.role === 'admin' && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm whitespace-nowrap">管理</span>}
                        <span className="truncate">{m.nickname}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-0.5">
                        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded-full">Lv.{m.level || 1}</div>
                        <div className={cn(
                          "text-[10px] uppercase font-bold tracking-wider",
                          isLearning ? "text-indigo-600" : isResting ? "text-emerald-600" : "text-slate-400"
                        )}>
                          {isLearning ? '专注中' : isResting ? '休息中' : '空闲'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===== 视图 B：等级排行榜 ===== */}
          {viewMode === 'ranking' && (
            <div>
              {/* 🏆 领奖台：前三名 */}
              {members.length >= 3 && (
                <div className="flex items-end justify-center gap-3 mb-8 pt-4">
                  {/* 第2名 */}
                  {(() => { const m = members[1]; const isLearning = m.status === 'learning'; return (
                    <div onClick={() => setSelectedUserId(m.userId)} className="flex flex-col items-center cursor-pointer group">
                      <div className="relative">
                        <div className={cn("w-16 h-16 rounded-full border-[3px] border-slate-300 overflow-hidden bg-white shadow-md transition-transform group-hover:scale-110", isLearning && "ring-2 ring-indigo-400 ring-offset-2")}>
                          {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <User size={24} className="text-slate-300" />}
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 text-white text-xs font-black flex items-center justify-center shadow">2</div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-xs font-bold text-slate-700 truncate max-w-[80px]">{m.nickname}</div>
                        <div className="text-[10px] font-bold text-slate-400">Lv.{m.level || 1}</div>
                      </div>
                      <div className="w-20 h-16 bg-gradient-to-t from-slate-200 to-slate-100 rounded-t-xl mt-1 flex items-center justify-center">
                        <span className="text-lg">🥈</span>
                      </div>
                    </div>
                  );})()}

                  {/* 第1名 */}
                  {(() => { const m = members[0]; const isLearning = m.status === 'learning'; return (
                    <div onClick={() => setSelectedUserId(m.userId)} className="flex flex-col items-center cursor-pointer group -mt-4">
                      <div className="relative">
                        <div className={cn("w-20 h-20 rounded-full border-[3px] border-yellow-400 overflow-hidden bg-white shadow-lg transition-transform group-hover:scale-110", isLearning && "ring-2 ring-indigo-400 ring-offset-2")}>
                          {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <User size={32} className="text-slate-300" />}
                        </div>
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-white text-sm font-black flex items-center justify-center shadow-lg">1</div>
                        {m.role === 'owner' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap border border-yellow-200">房主</div>}
                      </div>
                      <div className="mt-3 text-center">
                        <div className="text-sm font-black text-slate-800 truncate max-w-[100px]">{m.nickname}</div>
                        <div className="text-xs font-bold text-amber-500">Lv.{m.level || 1}</div>
                      </div>
                      <div className="w-24 h-24 bg-gradient-to-t from-amber-200 to-yellow-50 rounded-t-xl mt-1 flex items-center justify-center">
                        <span className="text-3xl">🏆</span>
                      </div>
                    </div>
                  );})()}

                  {/* 第3名 */}
                  {(() => { const m = members[2]; const isLearning = m.status === 'learning'; return (
                    <div onClick={() => setSelectedUserId(m.userId)} className="flex flex-col items-center cursor-pointer group">
                      <div className="relative">
                        <div className={cn("w-16 h-16 rounded-full border-[3px] border-amber-600/60 overflow-hidden bg-white shadow-md transition-transform group-hover:scale-110", isLearning && "ring-2 ring-indigo-400 ring-offset-2")}>
                          {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <User size={24} className="text-slate-300" />}
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 text-white text-xs font-black flex items-center justify-center shadow">3</div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-xs font-bold text-slate-700 truncate max-w-[80px]">{m.nickname}</div>
                        <div className="text-[10px] font-bold text-slate-400">Lv.{m.level || 1}</div>
                      </div>
                      <div className="w-20 h-12 bg-gradient-to-t from-amber-200/60 to-orange-50 rounded-t-xl mt-1 flex items-center justify-center">
                        <span className="text-lg">🥉</span>
                      </div>
                    </div>
                  );})()}
                </div>
              )}

              {/* 第4名起的列表 */}
              <div className="space-y-2">
                {(members.length >= 3 ? members.slice(3) : members).map((m, idx) => {
                  const rank = members.length >= 3 ? idx + 4 : idx + 1;
                  const isLearning = m.status === 'learning';
                  const isResting = m.status === 'rest';
                  return (
                    <div key={m.userId} onClick={() => setSelectedUserId(m.userId)}
                      className="flex items-center gap-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">{rank}</div>
                      <div className={cn("relative w-10 h-10 rounded-full border-2 overflow-hidden bg-white shrink-0",
                        isLearning ? "border-indigo-400" : isResting ? "border-emerald-400" : "border-slate-200"
                      )}>
                        {m.avatarUrl ? <img src={m.avatarUrl} className="w-full h-full object-cover" /> : <User size={18} className="text-slate-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-slate-800 truncate">{m.nickname}</span>
                          {m.role === 'owner' && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold shrink-0 border border-yellow-200">房主</span>}
                          {m.role === 'admin' && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold shrink-0 border border-blue-200">管理</span>}
                        </div>
                        <span className={cn("text-[10px] font-bold", isLearning ? "text-indigo-500" : isResting ? "text-emerald-500" : "text-slate-400")}>
                          {isLearning ? '🔥 专注中' : isResting ? '☕ 休息中' : '💤 空闲'}
                        </span>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200">
                        <span className="text-xs font-black text-slate-600">Lv.{m.level || 1}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {members.length === 0 && (
            <div className="text-center text-slate-400 py-20 text-sm">暂无成员在线</div>
          )}
        </div>
      </div>

      {/* 侧边栏：聊天*/}
      <div className="w-full md:w-80 flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-[400px] md:h-auto">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-700 flex items-center gap-2">
          <MessageSquare size={18} /> 聊天室
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
            placeholder="聊点什么吧..." 
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

      <RoomSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        room={roomInfo}
        onUpdate={fetchRoomDetails}
      />
    </div>
  );
}
