import request from '@/lib/request';

/**
 * 获取当前用户信息（包含 Profile 和 Tags）
 * 聚合 /users/me 和 /users/me/tags 接口
 */
export const fetchUser = async () => {
  try {
    // 并行请求用户信息和标签列表
    const [userInfo, tags] = await Promise.all([
      request.get('/users/me'),
      request.get('/users/me/tags')
    ]);

    // 确保 tags 是数组
    const tagList = Array.isArray(tags) ? tags : [];

    // 计算专注总时长 (分钟 -> 小时)
    const totalMinutes = tagList.reduce((sum, tag) => sum + (tag.totalMinutes || 0), 0);
    const focusHours = Math.floor(totalMinutes / 60);

    // 转换数据结构以适配前端 ProfileCard
    return {
      ...userInfo,
      avatar: userInfo.avatarUrl, // API 返回 avatarUrl，前端使用 avatar
      focusHours: focusHours,
      tags: tagList.map(tag => tag.tagName), // 将标签对象数组转换为字符串数组供前端展示
      // 保留原始 tags 数据以便后续可能需要扩展 (如等级信息)
      _rawTags: tagList 
    };
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};

/**
 * 更新用户信息
 * @param {Object} data - 前端用户数据模型
 */
export const updateUser = async (data) => {
  // 构造 API 需要的 Payload
  // 前端用 avatar，API 用 avatarUrl
  const payload = {
    nickname: data.nickname,
    avatarUrl: data.avatar,
    bio: data.bio
  };

  const response = await request.patch('/users/me', payload);
  
  // 返回更新后的数据适配前端
  return {
    ...response,
    avatar: response.avatarUrl
  };
};

/**
 * 添加新标签
 * @param {string} tagName - 标签名称
 */
export const addTag = (tagName) => {
  return request.post('/users/me/tags', { tagName });
};

/**
 * 移除标签
 * @param {string} tagId - 标签ID
 */
export const removeTag = (tagId) => {
  return request.delete(`/users/me/tags/${tagId}`);
};

/**
 * 搜索用户
 * @param {Object} params - 搜索参数
 */
export const searchUser = (params) => {
  return request.get('/users/search', { params });
};
