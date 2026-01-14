import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoomStore } from '@/store/roomStore';
import { validateRoomPassword } from '@/feature/room/api';

export function useRoomJoin() {
  const navigate = useNavigate();
  const { setRoomPassword } = useRoomStore();
  
  const [passwordModalRoom, setPasswordModalRoom] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleJoinAttempt = (room) => {
    if (room.isPrivate || room.hasPassword) {
      setPasswordModalRoom(room);
      setError(null);
    } else {
      setRoomPassword(null);
      navigate(`/room/${room.id}`);
    }
  };

  const submitPassword = async (password) => {
    if (!passwordModalRoom) return;
    
    setLoading(true);
    setError(null);

    try {
      // Pre-flight validation
      await validateRoomPassword({ 
        roomId: passwordModalRoom.id, 
        password 
      });

      // If successful:
      setRoomPassword(password);
      setPasswordModalRoom(null);
      navigate(`/room/${passwordModalRoom.id}`);
      
    } catch (err) {
      // Backend should return 403 or similar
      setError(err.message || 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  const closePasswordModal = () => {
    setPasswordModalRoom(null);
    setError(null);
  };

  return {
    passwordModalRoom,
    loading,
    error,
    handleJoinAttempt,
    submitPassword,
    closePasswordModal
  };
}
