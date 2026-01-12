import request from '@/lib/request';

export const getMe = () => {
  return request.get('/users/me');
};

export const getUserProfile = (id) => {
  return request.get(`/users/${id}/profile`);
};

export const updateProfile = (data) => {
  return request.patch('/users/me', data);
};

export const changePassword = (data) => {
  return request.patch('/users/me/password', data);
};

export const getMyTags = () => {
  return request.get('/users/me/tags');
};