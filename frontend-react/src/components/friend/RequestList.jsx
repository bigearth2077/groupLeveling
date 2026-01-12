import React, { useState, useEffect } from 'react';
import { Check, X, ArrowUpRight, ArrowDownLeft, Loader2, User } from 'lucide-react';
import { getIncomingRequests, getOutgoingRequests, handleFriendRequest } from '@/feature/friend/api';
import { Button } from '@/components/ui/button';

export default function RequestList() {
  const [type, setType] = useState('incoming'); // 'incoming' | 'outgoing'
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchList();
  }, [type]);

  const fetchList = async () => {
    setLoading(true);
    try {
      const api = type === 'incoming' ? getIncomingRequests : getOutgoingRequests;
      const resp = await api();
      if (resp && resp.items) {
        setList(resp.items);
      } else {
        setList([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAct = async (reqId, action) => {
    try {
      await handleFriendRequest(reqId, action);
      // Remove from list
      setList(prev => prev.filter(item => item.id !== reqId));
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
        <button 
          onClick={() => setType('incoming')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${type === 'incoming' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ArrowDownLeft size={14} /> Received
        </button>
        <button 
          onClick={() => setType('outgoing')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${type === 'outgoing' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ArrowUpRight size={14} /> Sent
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" /></div>}
        
        {!loading && list.length === 0 && (
          <div className="text-center text-slate-400 py-8 text-sm">No requests found.</div>
        )}

        {list.map(req => {
          // For incoming: req.user is the sender.
          // For outgoing: req.friend is the receiver (Fixed).
          const target = type === 'incoming' ? req.user : req.friend;
          
          return (
            <div key={req.id} className="p-3 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    {target?.avatarUrl ? <img src={target.avatarUrl} className="w-full h-full object-cover"/> : <User size={20} className="text-slate-400" />}
                 </div>
                 <div>
                   <div className="font-bold text-slate-800 text-sm">{target?.nickname || 'Unknown'}</div>
                   <div className="text-xs text-slate-400">{type === 'incoming' ? 'Wants to add you' : 'Pending...'}</div>
                 </div>
               </div>

               {type === 'incoming' && (
                 <div className="flex gap-1">
                   <Button size="icon" variant="ghost" onClick={() => handleAct(req.id, 'accept')} className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-full">
                     <Check size={18} />
                   </Button>
                   <Button size="icon" variant="ghost" onClick={() => handleAct(req.id, 'reject')} className="h-8 w-8 text-red-400 hover:bg-red-50 rounded-full">
                     <X size={18} />
                   </Button>
                 </div>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
