import React, { useState, useEffect } from 'react';
import { MoreHorizontal, User, Trash2, MessageCircle, DoorOpen, Send } from 'lucide-react';
import { getFriendList, deleteFriend } from '@/feature/friend/api';
import { Button } from '@/components/ui/button';
import UserProfileModal from '@/components/user/UserProfileModal';
import { useRoomStore } from '@/store/roomStore';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';

export default function FriendList({ onChat }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { activeRoomId } = useRoomStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const resp = await getFriendList();
      if (resp && resp.items) {
        setFriends(resp.items);
      } else {
        setFriends([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    try {
      await deleteFriend(friendId);
      loadFriends();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleInvite = (user) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('invite_to_room', JSON.stringify({
        targetUserId: user.id,
        roomId: activeRoomId
      }));
      alert(`Invited ${user.nickname} to your room!`);
    } else {
      alert("Not connected to server");
    }
  };

  return (
    <>
      <div className="h-full flex flex-col space-y-2 overflow-y-auto pr-1">
        {friends.map(item => {
          const user = item.friendUser || item; 

          return (
              <div 
              key={item.id} 
              onClick={() => setSelectedUserId(user.id)}
              className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
            >
               <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative shrink-0">
                     <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 font-bold overflow-hidden border border-slate-100">
                       {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <User size={20} />}
                     </div>
                     {/* Online Indicator */}
                     {user.isOnline && (
                       <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                     )}
                  </div>
                  <div className="overflow-hidden">
                     <div className="font-bold text-slate-800 text-sm truncate">{user.nickname}</div>
                     {user.status === 'learning' ? (
                       <div className="text-xs text-indigo-600 font-medium truncate">
                         📖 Focusing in {user.roomName || 'a room'}
                       </div>
                     ) : (
                       <div className="text-xs text-slate-400 truncate">
                         {user.bio || 'No bio provided'}
                       </div>
                     )}
                  </div>
               </div>

               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1 shrink-0">
                  {/* Action Buttons */}
                  {user.roomId && user.roomId !== activeRoomId && (
                     <Button 
                       size="icon" 
                       variant="ghost" 
                       className="h-8 w-8 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700" 
                       title="Join Room"
                       onClick={(e) => { e.stopPropagation(); navigate(`/room/${user.roomId}`); }}
                     >
                       <DoorOpen size={14} />
                     </Button>
                  )}

                  {!user.roomId && activeRoomId && user.isOnline && (
                     <Button 
                       size="icon" 
                       variant="ghost" 
                       className="h-8 w-8 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700" 
                       title="Invite to Room"
                       onClick={(e) => { 
                         e.stopPropagation(); 
                         handleInvite(user);
                       }}
                     >
                       <Send size={14} />
                     </Button>
                  )}

                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-blue-500 hover:bg-blue-50 hover:text-blue-600" 
                    title="Chat"
                    onClick={(e) => { e.stopPropagation(); onChat && onChat(user); }}
                  >
                    <MessageCircle size={14} />
                  </Button>

                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}>
                    <Trash2 size={16} />
                  </Button>
               </div>
            </div>
          )
        })}

        {!loading && friends.length === 0 && (
          <div className="text-center text-slate-400 py-10 text-sm">
            No friends yet. <br/> Go to "Add" tab to find some!
          </div>
        )}
      </div>

      <UserProfileModal 
        userId={selectedUserId} 
        isOpen={!!selectedUserId} 
        onClose={() => { setSelectedUserId(null); loadFriends(); }} // Reload list on close in case of unfriend
        isFriend={true}
      />
    </>
  );
}
