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
    tags: '',
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
        tags: room.tags || '',
        maxMembers: room.maxMembers || 50,
        isPrivate: room.isPrivate || false,
        password: '' // 出于安全考虑，不要填写密码，仅在更改时填写
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
        tags: formData.tags || "",
        password: formData.password || null
      };
      
      if (!payload.isPrivate) {
          payload.password = null; // 公开时清空密码
      } else if (!payload.password) {
          delete payload.password; // 若为私有且为空，则不更新密码（保留原值）
      }

      await updateRoom(room.id, payload);
      onUpdate(); // 刷新父级
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
          <h2 className="text-xl font-bold text-slate-800">房间设置</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">房间名称</label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="rounded-xl" 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">简介</label>
            <Input 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="rounded-xl" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">标签 (逗号分隔)</label>
            <Input 
              value={formData.tags} 
              onChange={e => setFormData({...formData, tags: e.target.value})}
              className="rounded-xl" 
              placeholder="例如: 前端, 考研"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">最大人数</label>
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
                <label htmlFor="isPrivateEdit" className="text-sm font-bold text-slate-700">私密小组</label>
             </div>
          </div>

          {formData.isPrivate && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">新密码 (可选)</label>
              <Input 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="rounded-xl" 
                placeholder="留空则保持当前密码"
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
               取消
             </Button>
             <Button 
               type="submit" 
               className="flex-1 rounded-xl bg-slate-900"
               disabled={loading}
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '保存更改'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
