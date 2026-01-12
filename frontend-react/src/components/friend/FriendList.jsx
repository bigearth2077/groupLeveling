import React, { useState, useEffect } from 'react';
import { MoreHorizontal, User, Trash2, MessageCircle } from 'lucide-react';
import { getFriendList, deleteFriend } from '@/feature/friend/api';
import { Button } from '@/components/ui/button';
import UserProfileModal from '@/components/user/UserProfileModal';

export default function FriendList() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

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
               <div className="flex items-center gap-3">
                  <div className="relative">
                     <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 font-bold overflow-hidden border border-slate-100">
                       {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <User size={20} />}
                     </div>
                  </div>
                  <div>
                     <div className="font-bold text-slate-800 text-sm">{user.nickname}</div>
                  </div>
               </div>

               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
