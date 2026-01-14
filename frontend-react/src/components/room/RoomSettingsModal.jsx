import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X } from 'lucide-react';
import { updateRoom } from '@/feature/room/api';

export default function RoomSettingsModal({ 
  isOpen, 
  onClose, 
  room, 
  onUpdate 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxMembers: 50,
    isPrivate: false,
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        maxMembers: room.maxMembers || 50,
        isPrivate: room.isPrivate || false,
        password: '' // Don't fill password for security, only if changing
      });
    }
  }, [room, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        maxMembers: Number(formData.maxMembers),
        description: formData.description || null,
        password: formData.password || null // Send null if empty to keep existing or clear? 
        // Backend logic: if pointer is nil, it ignores? 
        // Wait, if I want to clear password, I might need explicit action.
        // For now, let's assume empty password input means "no change" if private, or "remove" if public.
        // Actually, let's just send what we have. 
        // If isPrivate is false, password should be cleared.
      };
      
      if (!payload.isPrivate) {
          payload.password = null; // Clear password if public
      } else if (!payload.password) {
          delete payload.password; // If private and empty, don't update password (keep existing)
      }

      await updateRoom(room.id, payload);
      onUpdate(); // Refresh parent
      onClose();
    } catch (err) {
      alert("Failed to update room settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Room Settings</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Room Name</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="rounded-xl" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <Input 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="rounded-xl" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Max Members</label>
                <Input 
                  type="number"
                  value={formData.maxMembers} 
                  onChange={e => setFormData({...formData, maxMembers: e.target.value})}
                  className="rounded-xl" 
                />
             </div>
             <div className="flex items-center space-x-2 pt-8">
                <input 
                  type="checkbox" 
                  id="isPrivateEdit"
                  checked={formData.isPrivate}
                  onChange={e => setFormData({...formData, isPrivate: e.target.checked})}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="isPrivateEdit" className="text-sm font-bold text-slate-700">Private Room</label>
             </div>
          </div>

          {formData.isPrivate && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">New Password (Optional)</label>
              <Input 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="rounded-xl" 
                placeholder="Leave empty to keep current"
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
             <Button 
               type="button" 
               variant="ghost" 
               onClick={onClose} 
               className="flex-1 rounded-xl"
               disabled={loading}
             >
               Cancel
             </Button>
             <Button 
               type="submit" 
               className="flex-1 rounded-xl bg-slate-900"
               disabled={loading}
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
