import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { connectSocket, getSocket } from '@/lib/socket';
import { useRoomStore } from '@/store/roomStore';
import { useStudyStore } from '@/store/studyStore';
import { getRoomMembers } from '@/feature/room/api';
import { getMe } from '@/feature/user/api';

export default function RoomConnectionManager() {
  const {
    activeRoomId,
    roomPassword,
    setMembers,
    addMember,
    removeMember,
    updateMemberStatus,
    addMessage,
    setSocketStatus,
    incrementUnread,
    leaveRoom
  } = useRoomStore();

  const { status: studyStatus } = useStudyStore();
  const location = useLocation();
  const locationRef = useRef(location);
  const navigate = useNavigate(); // 需要 import useNavigate

  const socketRef = useRef(null);
  const myIdRef = useRef(null);

  // 保持 location ref 同步
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // 1. 获取 My ID
  useEffect(() => {
    getMe().then(u => { if (u) myIdRef.current = u.id });
  }, []);

  const checkUnread = () => {
    // 如果不在这个特定的房间页面，增加 unread 计数
    if (!activeRoomId) return;
    const inRoom = locationRef.current.pathname.includes(`/room/${activeRoomId}`);
    if (!inRoom) {
      incrementUnread();
    }
  };

  // 2. 管理连接&房间加入/离开
  useEffect(() => {
    if (!activeRoomId) {
      return;
    }

    // 连接
    const socket = connectSocket();
    socketRef.current = socket;
    setSocketStatus('connecting');

    const handleConnect = () => {
      console.log('[RoomManager] Connected');
      setSocketStatus('connected');

      // 加入
      const payload = { roomId: activeRoomId };
      if (roomPassword) {
        payload.password = roomPassword;
      }

      socket.emit('join_room', JSON.stringify(payload), (ack) => {
        console.log('[RoomManager] Joined Ack:', ack);
        const ackData = typeof ack === 'string' ? JSON.parse(ack) : ack;

        if (ackData && ackData.error) {
          alert("Failed to join room: " + ackData.error);
          leaveRoom(); // 重置store state
          navigate('/rooms'); // 返回大厅
          return;
        }

        // 加入成功，加载快照
        loadSnapshot(activeRoomId);
      });
    };

    const handleUserJoined = (data) => {
      // 忽略自己的加入
      if (myIdRef.current && data.user.id === myIdRef.current) return;

      const newUser = {
        userId: data.user.id,
        nickname: data.user.nickname,
        avatarUrl: data.user.avatarUrl,
        status: 'idle',
        joinedAt: new Date().toISOString()
      };
      addMember(newUser);
      addMessage({ id: Date.now(), isSystem: true, content: `${newUser.nickname} joined.` });
      checkUnread();
    };

    const handleUserLeft = (data) => {
      if (myIdRef.current && data.userId === myIdRef.current) return;

      removeMember(data.userId);
      addMessage({ id: Date.now(), isSystem: true, content: `User left.` });
      checkUnread();
    };

    const handleStatusUpdated = (data) => {
      updateMemberStatus(data.userId, data.status);
    };

    const handleNewMessage = (data) => {
      addMessage(data);
      checkUnread();
    };

    // 附加监听器
    socket.on('connect', handleConnect);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('status_updated', handleStatusUpdated);
    socket.on('new_message', handleNewMessage);

    // 如果已经连接
    if (socket.connected) {
      handleConnect();
    }

    // 清理
    return () => {
      if (socket) {
        socket.emit('leave_room', JSON.stringify({ roomId: activeRoomId }));
        socket.off('connect', handleConnect);
        socket.off('user_joined', handleUserJoined);
        socket.off('user_left', handleUserLeft);
        socket.off('status_updated', handleStatusUpdated);
        socket.off('new_message', handleNewMessage);
      }
    };
  }, [activeRoomId]);

  // 3. 同步学习状态
  useEffect(() => {
    if (!activeRoomId || !socketRef.current || !socketRef.current.connected) return;

    let backendStatus = 'idle';
    if (studyStatus === 'focusing') backendStatus = 'learning';
    if (studyStatus === 'resting') backendStatus = 'rest';

    socketRef.current.emit('update_status', JSON.stringify({
      roomId: activeRoomId,
      status: backendStatus
    }));
  }, [studyStatus, activeRoomId]);

  const loadSnapshot = async (roomId) => {
    try {
      const res = await getRoomMembers(roomId);
      if (res && res.items) {
        setMembers(res.items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return null; // 无ui组件
}
