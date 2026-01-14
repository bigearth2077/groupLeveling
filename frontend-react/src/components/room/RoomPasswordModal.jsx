import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export default function RoomPasswordModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading, 
  error 
}) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-lg font-bold text-slate-800 mb-4 text-center">Locked Room</h2>
        <p className="text-sm text-slate-500 text-center mb-6">Enter password to join this squad.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            type="password"
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="rounded-xl text-center tracking-widest" 
            placeholder="••••••"
            autoFocus
          />
          
          {error && (
            <div className="text-red-500 text-xs text-center font-bold animate-pulse">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
             <Button 
               type="button" 
               variant="ghost" 
               onClick={onClose} 
               className="flex-1 rounded-xl hover:bg-slate-100"
               disabled={isLoading}
             >
               Cancel
             </Button>
             <Button 
               type="submit" 
               className="flex-1 rounded-xl bg-slate-900"
               disabled={isLoading || !password}
             >
               {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
