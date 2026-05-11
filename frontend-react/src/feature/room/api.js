import request from '@/lib/request';

export const getRooms = (params = {}) => {
  //参数：{ page, pageSize, tag, search }
  return request.get('/rooms', { params });
};

export const getRoom = (id) => {
  return request.get(`/rooms/${id}`);
};

export const createRoom = (data) => {
  return request.post('/rooms', data);
};

export const updateRoom = (id, data) => {
  return request.patch(`/rooms/${id}`, data);
};

export const deleteRoom = (id) => {
  return request.delete(`/rooms/${id}`);
};

export const getRoomMembers = (roomId) => {
  return request.get(`/rooms/${roomId}/members`);
};

export const validateRoomPassword = (data) => {
  //数据：{ roomId, password }
  return request.post('/rooms/validate-password', data);
};

export const updateMemberRole = (roomId, userId, role) => {
  return request.patch(`/rooms/${roomId}/members/${userId}/role`, { role });
};
