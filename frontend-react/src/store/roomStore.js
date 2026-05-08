import { create } from 'zustand';

export const useRoomStore = create((set, get) => ({
  activeRoomId: null,
  roomPassword: null, // 私人房间密码
  members: [],
  messages: [],
  socketStatus: 'disconnected', // '已断开' | '连接中' | '已连接'
  unreadCount: 0,
  
  // 操作
  setActiveRoomId: (id) => set({ activeRoomId: id }),
  setRoomPassword: (password) => set({ roomPassword: password }),
  
  setMembers: (members) => set({ members }),
  addMember: (member) => set((state) => {
    if (state.members.find(m => m.userId === member.userId)) return state;
    return { members: [...state.members, member] };
  }),
  removeMember: (userId) => set((state) => ({
    members: state.members.filter(m => m.userId !== userId)
  })),
  updateMemberStatus: (userId, status) => set((state) => ({
    members: state.members.map(m => m.userId === userId ? { ...m, status } : m)
  })),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnread: () => set({ unreadCount: 0 }),
  
  setSocketStatus: (status) => set({ socketStatus: status }),
  
  leaveRoom: () => set({ 
    activeRoomId: null, 
    roomPassword: null,
    members: [], 
    messages: [],
    unreadCount: 0,
    socketStatus: 'disconnected'
  })
}));
