import request from '@/lib/request';

export const getMe = () => {
  return request.get('/users/me');
};

// 获取公开资料 (含 LevelInfo)
export const getUserProfile = (id) => {
  return request.get(`/users/${id}/public`);
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

export const searchUsers = (query, page = 1) => {
  return request.get('/users/search', { params: { query, page } });
};
