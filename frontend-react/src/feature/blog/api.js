import request from '@/lib/request';

// --- 博客增删改查 ---

export const createBlog = (data) => {
  // 数据: { 标题, 内容, 格式, 状态 }
  return request.post('/blogs', data);
};

export const getBlogs = (params = {}) => {
  // 参数: { 页码, 每页数量, 标签, 搜索, 排序 }
  return request.get('/blogs', { params });
};

export const getMyBlogs = (params = {}) => {
  return request.get('/blogs/my', { params });
};

export const getBlog = (id) => {
  return request.get(`/blogs/${id}`);
};

export const updateBlog = (id, data) => {
  return request.patch(`/blogs/${id}`, data);
};

export const deleteBlog = (id) => {
  return request.delete(`/blogs/${id}`);
};

// --- 社交互动 ---

export const likeBlog = (id) => {
  return request.post(`/blogs/${id}/like`);
};

export const unlikeBlog = (id) => {
  return request.delete(`/blogs/${id}/like`);
};

export const bookmarkBlog = (id) => {
  return request.post(`/blogs/${id}/bookmark`);
};

export const unbookmarkBlog = (id) => {
  return request.delete(`/blogs/${id}/bookmark`);
};

// --- 用户博客 ---

export const getUserBlogs = (userId, params = {}) => {
  return request.get(`/users/${userId}/blogs`, { params });
};
