import React, { useState } from 'react';
import { Search, UserPlus, Check, Loader2, User } from 'lucide-react';
import { searchUsers } from '@/feature/user/api';
import { sendFriendRequest } from '@/feature/friend/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentMap, setSentMap] = useState({}); // { userId: true }

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const resp = await searchUsers(query);
      if (resp && resp.items) {
        setResults(resp.items);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (user) => {
    try {
      await sendFriendRequest(user.id);
      setSentMap(prev => ({ ...prev, [user.id]: true }));
    } catch (err) {
      alert('Failed to send request: ' + err.message);
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by nickname..."
          className="rounded-xl"
        />
        <Button type="submit" disabled={loading} size="icon" className="rounded-xl shrink-0">
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {results.length === 0 && !loading && query && (
          <div className="text-center text-slate-400 py-8 text-sm">No users found.</div>
        )}
        
        {results.map(user => (
          <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                 {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover"/> : <User size={20} />}
               </div>
               <div>
                 <div className="font-bold text-slate-800 text-sm">{user.nickname}</div>
                 <div className="text-xs text-slate-400 truncate w-32">{user.email}</div>
               </div>
             </div>
             
             {sentMap[user.id] ? (
               <Button size="sm" variant="ghost" className="text-emerald-600 h-8 w-8 p-0" disabled>
                 <Check size={18} />
               </Button>
             ) : (
               <Button size="sm" variant="ghost" onClick={() => handleAdd(user)} className="text-indigo-600 hover:bg-indigo-50 h-8 w-8 p-0">
                 <UserPlus size={18} />
               </Button>
             )}
          </div>
        ))}
      </div>
    </div>
  );
}
