import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, User, UserPlus, UserMinus, Trophy, Loader2 } from 'lucide-react';
import { getUserProfile } from '@/feature/user/api';
import { sendFriendRequest, deleteFriend } from '@/feature/friend/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function UserProfileModal({ userId, isOpen, onClose, isFriend: initialIsFriend = false }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(initialIsFriend);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      loadProfile();
      setIsFriend(initialIsFriend);
      setRequestSent(false);
    }
  }, [isOpen, userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getUserProfile(userId);
      setUser(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    try {
      await sendFriendRequest(userId);
      setRequestSent(true);
    } catch (err) {
      alert("Could not send request: " + (err.message || "Unknown error"));
    }
  };

  const handleRemoveFriend = async () => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    try {
      await deleteFriend(userId);
      setIsFriend(false);
      onClose(); // Close modal after action?
    } catch (err) {
      alert("Failed to remove friend");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 text-white rounded-full z-10 transition-colors"
        >
          <X size={18} />
        </button>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" />
          </div>
        ) : user ? (
          <>
            {/* Header / Cover */}
            <div className="h-28 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
            
            {/* Content */}
            <div className="px-6 pb-6 -mt-12 flex flex-col items-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
                 {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-300" />}
              </div>

              {/* Name & Level */}
              <div className="mt-3 text-center space-y-1">
                <h2 className="text-xl font-black text-slate-800">{user.nickname}</h2>
                <div className="flex items-center justify-center gap-2">
                   <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full border border-slate-200">
                     Lv. {user.levelInfo?.level || 0}
                   </span>
                   {/* Optional: Online status if we had it */}
                </div>
              </div>

              {/* Bio */}
              <p className="mt-4 text-sm text-slate-500 text-center leading-relaxed">
                {user.bio || "No bio provided."}
              </p>

              {/* Stats / Tags */}
              {user.topTags && user.topTags.length > 0 && (
                <div className="mt-6 w-full space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Top Skills</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {user.topTags.map(tag => (
                      <span key={tag.tagId} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100">
                        {tag.tagName} Lv.{tag.levelInfo?.level || 0}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 w-full flex gap-3">
                {isFriend ? (
                  <Button 
                    onClick={handleRemoveFriend}
                    variant="outline" 
                    className="w-full rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                  >
                    <UserMinus size={18} className="mr-2" /> Unfriend
                  </Button>
                ) : (
                  <Button 
                    onClick={handleAddFriend}
                    disabled={requestSent}
                    className={cn(
                      "w-full rounded-xl shadow-lg shadow-indigo-200",
                      requestSent ? "bg-emerald-500 hover:bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-700"
                    )}
                  >
                    {requestSent ? "Request Sent" : <><UserPlus size={18} className="mr-2" /> Add Friend</>}
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-slate-500">User not found</div>
        )}
      </div>
    </div>
  );
}
