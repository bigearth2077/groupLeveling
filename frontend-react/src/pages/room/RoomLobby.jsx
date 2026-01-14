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
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Study Squads</h1>
            <p className="text-sm text-slate-500 font-medium">Join a room and focus together</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search rooms..." 
               className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
             />
           </div>
           <Button onClick={() => setShowCreateModal(true)} className="rounded-xl bg-slate-900 shadow-lg hover:bg-slate-800">
             <Plus size={18} className="mr-2" /> Create
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
              className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all cursor-pointer overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-slate-50 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  {room.isPrivate ? <Lock size={20} /> : <Unlock size={20} />}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-xs font-bold text-slate-600">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  {room.onlineCount} / {room.maxMembers}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{room.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">{room.description || "No description provided."}</p>

              <div className="flex items-center justify-between mt-auto">
                 <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                   #{room.tagName || 'General'}
                 </span>
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                   <ArrowRight size={16} />
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Create Squad</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Room Name</label>
                <Input 
                  value={newRoom.name} 
                  onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                  className="rounded-xl" 
                  placeholder="e.g. Late Night Coding"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Description</label>
                <Input 
                  value={newRoom.description} 
                  onChange={e => setNewRoom({...newRoom, description: e.target.value})}
                  className="rounded-xl" 
                  placeholder="What's this room for?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Max Members</label>
                    <Input 
                      type="number"
                      value={newRoom.maxMembers} 
                      onChange={e => setNewRoom({...newRoom, maxMembers: e.target.value})}
                      className="rounded-xl" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Topic Tag</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <Input 
                        list="my-tags-list"
                        value={tagNameInput}
                        onChange={e => setTagNameInput(e.target.value)}
                        placeholder="Select or type tag..."
                        className="pl-9 rounded-xl"
                      />
                      <datalist id="my-tags-list">
                        {myTags.map(tag => (
                          <option key={tag.tagId} value={tag.tagName} />
                        ))}
                      </datalist>
                    </div>
                 </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                    <input 
                      type="checkbox" 
                      id="isPrivate"
                      checked={newRoom.isPrivate}
                      onChange={e => setNewRoom({...newRoom, isPrivate: e.target.checked})}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isPrivate" className="text-sm font-bold text-slate-700">Private Room</label>
              </div>

              {newRoom.isPrivate && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Password</label>
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
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button type="submit" className="flex-1 rounded-xl bg-slate-900">Create</Button>
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
