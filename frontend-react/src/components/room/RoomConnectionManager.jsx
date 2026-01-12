import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { connectSocket, getSocket } from '@/lib/socket';
import { useRoomStore } from '@/store/roomStore';
import { useStudyStore } from '@/store/studyStore';
import { getRoomMembers } from '@/feature/room/api';
import { getMe } from '@/feature/user/api';

export default function RoomConnectionManager() {
  const { 
    activeRoomId, 
    setMembers, 
    addMember, 
    removeMember, 
    updateMemberStatus, 
    addMessage,
    setSocketStatus,
    incrementUnread
  } = useRoomStore();

  const { status: studyStatus } = useStudyStore();
  const location = useLocation();
  const locationRef = useRef(location);
  
  const socketRef = useRef(null);
  const myIdRef = useRef(null);

  // Keep location ref sync
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // 1. Get My ID once
  useEffect(() => {
    getMe().then(u => { if(u) myIdRef.current = u.id });
  }, []);

  const checkUnread = () => {
    // If not in the specific room page, increment unread
    if (!activeRoomId) return;
    const inRoom = locationRef.current.pathname.includes(`/room/${activeRoomId}`);
    if (!inRoom) {
      incrementUnread();
    }
  };

  // 2. Manage Connection & Room Join/Leave
  useEffect(() => {
    if (!activeRoomId) {
      return;
    }

    // Connect
    const socket = connectSocket();
    socketRef.current = socket;
    setSocketStatus('connecting');

    const handleConnect = () => {
      console.log('[RoomManager] Connected');
      setSocketStatus('connected');
      
      // Join
      socket.emit('join_room', JSON.stringify({ roomId: activeRoomId }), (ack) => {
        console.log('[RoomManager] Joined Ack:', ack);
        // Load Snapshot on join success
        loadSnapshot(activeRoomId);
      });
    };

    const handleUserJoined = (data) => {
      // Ignore self
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

    // Attach Listeners
    socket.on('connect', handleConnect);
    socket.on('user_joined', handleUserJoined);
    socket.on('user_left', handleUserLeft);
    socket.on('status_updated', handleStatusUpdated);
    socket.on('new_message', handleNewMessage);

    // If already connected
    if (socket.connected) {
      handleConnect();
    }

    // Cleanup: Leave Room when activeRoomId changes or unmount
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

  // 3. Sync Study Status
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

  return null; // Invisible component
}
