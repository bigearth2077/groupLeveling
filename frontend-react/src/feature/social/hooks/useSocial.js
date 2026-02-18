import { useState, useEffect } from 'react';
import { 
  fetchFriendList, 
  fetchPendingRequests,
  handleFriendRequest,
  deleteFriend,
  searchFriends,
  sendFriendRequest
} from '../api';

export const useSocial = (isOpen) => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('friends');

  // 加载好友列表和请求列表
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        fetchFriendList(),
        fetchPendingRequests()
      ]);
      setFriends(friendsData || []);
      setRequests(requestsData || []);
    } catch (error) {
      console.error('Failed to load social data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理好友请求
  const handleRequest = async (requestId, action) => {
    try {
      await handleFriendRequest(requestId, action);
      // 乐观更新：移除已处理的请求
      setRequests(prev => prev.filter(req => req.id !== requestId));
      // 如果是接受，重新加载好友列表
      if (action === 'accept') {
        const friendsData = await fetchFriendList();
        setFriends(friendsData || []);
      }
    } catch (error) {
      console.error('Failed to handle friend request:', error);
    }
  };

  // 删除好友
  const removeFriend = async (friendId) => {
    if (!confirm('确定要解除好友关系吗？')) return;
    
    try {
      await deleteFriend(friendId);
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('Failed to delete friend:', error);
    }
  };

  // 搜索好友
  const handleSearch = async (query) => {
    setSearchQuery(query);
    // 这里可以添加防抖逻辑
  };

  // 发送好友请求
  const sendRequest = async (userId) => {
    try {
      await sendFriendRequest(userId);
      alert('好友请求已发送');
    } catch (error) {
      console.error('Failed to send friend request:', error);
      alert('发送失败，请稍后重试');
    }
  };

  return {
    friends,
    requests,
    loading,
    searchQuery,
    activeTab,
    setActiveTab,
    handleSearch,
    handleRequest,
    removeFriend,
    sendRequest,
    refreshData: loadData
  };
};
