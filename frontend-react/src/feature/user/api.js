import request from '@/lib/request';

export const getMe = () => {
  return request.get('/users/me');
};

export const getUserProfile = (id) => {
  return request.get(`/users/${id}/profile`);
};
