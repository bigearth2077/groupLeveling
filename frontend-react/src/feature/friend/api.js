import request from '@/lib/request';

// 发送好友请求
export const sendFriendRequest = (friendId) => {
  return request.post('/friends/requests', { friendId });
};

// 获取收到的请求
export const getIncomingRequests = (params) => {
  return request.get('/friends/requests/incoming', { params });
};

// 获取发出的请求
export const getOutgoingRequests = (params) => {
  return request.get('/friends/requests/outgoing', { params });
};

// 处理请求 (accept/reject)
export const handleFriendRequest = (requestId, action) => {
  return request.post(`/friends/requests/${requestId}/act`, { action });
};

// 获取好友列表
export const getFriendList = (params) => {
  return request.get('/friends', { params });
};

// 删除好友
export const deleteFriend = (friendId) => {
  return request.delete(`/friends/${friendId}`);
};
