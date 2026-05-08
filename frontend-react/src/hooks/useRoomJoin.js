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
      //预检验证
      await validateRoomPassword({ 
        roomId: passwordModalRoom.id, 
        password 
      });

      //如果成功：
      setRoomPassword(password);
      setPasswordModalRoom(null);
      navigate(`/room/${passwordModalRoom.id}`);
      
    } catch (err) {
      //后端应返回403或类似状态
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
