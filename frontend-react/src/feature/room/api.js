import request from '@/lib/request';

export const getRooms = (params = {}) => {
  return request.get('/rooms', { params });
};

export const createRoom = (data) => {
  return request.post('/rooms', data);
};

export const getRoomMembers = (roomId) => {
  return request.get(`/rooms/${roomId}/members`);
};
