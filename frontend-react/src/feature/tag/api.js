import request from '@/lib/request';

// 搜索标签 (或获取热门)
export const searchTags = (q) => {
  return request.get('/tags/search', { params: { q } });
};

// 获取我的标签
export const getMyTags = () => {
  return request.get('/users/me/tags');
};

// 添加/订阅标签
export const addMyTag = (tagName) => {
  return request.post('/users/me/tags', { tagName });
};

// 删除我的标签
export const deleteMyTag = (tagId) => {
  return request.delete(`/users/me/tags/${tagId}`);
};
