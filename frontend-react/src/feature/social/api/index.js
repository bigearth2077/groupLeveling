import request from '@/lib/request';

/**
 * 搜索用户
 * @param {string} query - 搜索关键词
 */
export const searchFriends = async (query) => {
  return request.get('/friend/search', { params: { query } });
};

/**
 * 发送好友请求
 * @param {string} userId - 目标用户ID
 */
export const sendFriendRequest = async (userId) => {
  return request.post('/friend/request/send', { userId });
};

/**
 * 获取好友列表
 */
export const fetchFriendList = async () => {
  return request.get('/friend/list');
};

/**
 * 获取待处理的好友请求
 */
export const fetchPendingRequests = async () => {
  return request.get('/friend/request/pending');
};

/**
 * 处理好友请求
 * @param {string} requestId - 请求ID
 * @param {string} action - 'accept' 或 'reject'
 */
export const handleFriendRequest = async (requestId, action) => {
  return request.post('/friend/request/handle', { requestId, action });
};

/**
 * 删除好友
 * @param {string} friendId - 好友ID
 */
export const deleteFriend = async (friendId) => {
  return request.delete(`/friend/delete/${friendId}`);
};

/**
 * 查看他人公开资料
 * @param {string} userId - 用户ID
 */
export const fetchUserProfile = async (userId) => {
  return request.get(`/user/profile/public/${userId}`);
};

/**
 * 创建房间并邀请好友
 * @param {string} friendId - 好友ID
 */
export const createRoomAndInvite = async (friendId) => {
  return request.post('/room/create', { friendId });
};
