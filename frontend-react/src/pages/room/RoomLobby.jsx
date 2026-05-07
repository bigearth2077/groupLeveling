import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Lock, 
  Unlock, 
  ArrowRight, 
  Loader2,
  X,
  Hash
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRooms, createRoom } from '@/feature/room/api';
import { getMyTags, addMyTag } from '@/feature/tag/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRoomJoin } from '@/hooks/useRoomJoin';
import RoomPasswordModal from '@/components/room/RoomPasswordModal';

export default function RoomLobby() {
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [myTags, setMyTags] = useState([]);
  const [tagNameInput, setTagNameInput] = useState('');
  
  // Use Custom Hook for Join Logic
  const { 
    passwordModalRoom, 
    loading: joiningLoading, 
    error: joinError,
    handleJoinAttempt, 
    submitPassword, 
    closePasswordModal 
  } = useRoomJoin();

  // Create Form
  const [newRoom, setNewRoom] = useState({
    name: '',
    description: '',
    tagId: '', // Will be resolved from tagNameInput
    maxMembers: 20,
    isPrivate: false,
    password: ''
  });

  useEffect(() => {
    fetchRooms();
    fetchUserTags();
  }, [searchQuery]); 

  const fetchUserTags = async () => {
    try {
      const res = await getMyTags();
      // res is array of UserTagResponse { tagId, tagName, ... }
      if (Array.isArray(res)) {
        setMyTags(res);
      }
    } catch (err) {
      console.error("Failed to fetch tags", err);
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await getRooms({ page: 1, pageSize: 20, search: searchQuery });
      if (res && res.items) {
        setRooms(res.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Basic validation
      if (!newRoom.name) return;
      
      // Resolve Tag ID
      let finalTagId = null;
      if (tagNameInput.trim()) {
        const existing = myTags.find(t => t.tagName.toLowerCase() === tagNameInput.trim().toLowerCase());
        if (existing) {
          finalTagId = existing.tagId;
        } else {
          // Create new tag (attach to user)
          const tagRes = await addMyTag(tagNameInput.trim());
          if (tagRes && tagRes.tagId) {
            finalTagId = tagRes.tagId;
          }
        }
      }

      const payload = { 
        ...newRoom, 
        maxMembers: Number(newRoom.maxMembers),
        description: newRoom.description || null,
        tagId: finalTagId,
        password: newRoom.password || null
      };
      
      await createRoom(payload);
      setShowCreateModal(false);
      fetchRooms(); // Refresh
      fetchUserTags(); // Refresh tags in case new one was added
    } catch (err) {
      console.error(err);
      alert("Failed to create room");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">自习小组</h1>
            <p className="text-sm text-slate-500 font-medium">加入自习室，开启专注学习之旅</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="搜索自习室..." 
               className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
             />
           </div>
           <Button onClick={() => setShowCreateModal(true)} className="rounded-2xl bg-blue-600 shadow-sm hover:bg-blue-500 hover:shadow-md transition-all py-6 px-6">
             <Plus size={18} className="mr-2" /> 创建
           </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div 
              key={room.id}
              onClick={() => handleJoinAttempt(room)}
              className="group relative bg-white p-6 rounded-3xl border border-slate-100/60 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  {room.isPrivate ? <Lock size={20} /> : <Unlock size={20} />}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-xs font-bold text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  {room.onlineCount} / {room.maxMembers}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{room.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{room.description || "暂无简介。"}</p>

              <div className="flex items-center justify-between mt-auto">
                 <div className="flex-1"></div>
                 <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all transform group-hover:translate-x-1">
                   <ArrowRight size={16} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">创建小组</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">小组名称</label>
                <Input 
                  value={newRoom.name} 
                  onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                  className="rounded-xl" 
                  placeholder="例如：深夜编程"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">小组简介</label>
                <Input 
                  value={newRoom.description} 
                  onChange={e => setNewRoom({...newRoom, description: e.target.value})}
                  className="rounded-xl" 
                  placeholder="介绍一下这个自习室吧"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">最大人数</label>
                <Input 
                  type="number"
                  value={newRoom.maxMembers} 
                  onChange={e => setNewRoom({...newRoom, maxMembers: e.target.value})}
                  className="rounded-xl" 
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="isPrivate"
                      checked={newRoom.isPrivate}
                      onChange={e => setNewRoom({...newRoom, isPrivate: e.target.checked})}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isPrivate" className="text-sm font-bold text-slate-700">私密小组</label>
              </div>

              {newRoom.isPrivate && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">密码</label>
                  <Input 
                    type="password"
                    value={newRoom.password} 
                    onChange={e => setNewRoom({...newRoom, password: e.target.value})}
                    className="rounded-xl" 
                    placeholder="Secret Password"
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50">取消</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-sm">创建</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Password Modal */}
      <RoomPasswordModal
        isOpen={!!passwordModalRoom}
        onClose={closePasswordModal}
        onConfirm={submitPassword}
        isLoading={joiningLoading}
        error={joinError}
      />
    </div>
  );
}
