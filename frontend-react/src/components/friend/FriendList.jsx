import React, { useState, useEffect } from 'react';
import { MoreHorizontal, User, Trash2, MessageCircle } from 'lucide-react';
import { getFriendList, deleteFriend } from '@/feature/friend/api';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // Assuming standard shadcn path, if not I will mock or use simple html select
import { Button } from '@/components/ui/button';

export default function FriendList() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);

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
      // Refresh
      loadFriends();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-2 overflow-y-auto pr-1">
      {friends.map(item => {
        // item might be the Friend relation object. 
        // We expect item.friendUser to be the profile.
        // Or if backend returns a user list directly. 
        // Let's assume item.friendUser based on GORM structure.
        const user = item.friendUser || item; 

        return (
          <div key={item.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
             <div className="flex items-center gap-3">
                <div className="relative">
                   <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-400 font-bold overflow-hidden border border-slate-100">
                     {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <User size={20} />}
                   </div>
                   {/* Online Status Dot (Mock for now) */}
                   {/* <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-slate-300 rounded-full border-2 border-white"></div> */}
                </div>
                <div>
                   <div className="font-bold text-slate-800 text-sm">{user.nickname}</div>
                   {/* <div className="text-[10px] text-slate-400 font-medium">Offline</div> */}
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
  );
}
