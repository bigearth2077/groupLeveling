import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
// 1. 引入 post 和 patch 方法，因为添加和处理好友请求会用到
import { get, del, post, patch } from '../utils/request';

export const useFriendsStore = defineStore('friends', () => {
  // --- Section 1: 好友列表相关状态 (已完成) ---
  const friends = ref([]);
  const selectedFriend = ref(null);
  const listSearchQuery = ref(''); // 和弹窗内的搜索区分开
  const currentPage = ref(1);
  const friendsPerPage = ref(10);
  const totalFriends = ref(0);
  const isListLoading = ref(true);
  let listSearchTimeout = null;

  // --- Section 2: 好友管理弹窗所需的新状态 ---
  const searchResults = ref([]); // 搜索用户的结果
  const isSearching = ref(false);
  const incomingRequests = ref([]); // 收到的好友请求
  const outgoingRequests = ref([]); // 发出的好友请求
  const isRequestsLoading = ref(false);


  // --- Getters (计算属性) ---
  const totalPages = computed(() => {
    if (totalFriends.value === 0) return 1;
    return Math.ceil(totalFriends.value / friendsPerPage.value);
  });

  // --- Actions (所有的方法) ---

  // --- Actions for Friend List (已完成) ---
  const fetchFriends = async () => {
    isListLoading.value = true;
    try {
      const params = {
        page: currentPage.value,
        pageSize: friendsPerPage.value,
      };
      if (listSearchQuery.value) {
        params.nickname = listSearchQuery.value;
      }
      const responseData = await get('/friends', params);
      
      friends.value = responseData.items.map(friend => ({
        ...friend,
        avatar: friend.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.nickname}`,
      }));
      totalFriends.value = responseData.total;
    } catch (error) {
      console.error("获取好友列表失败:", error);
      friends.value = [];
      totalFriends.value = 0;
    } finally {
      isListLoading.value = false;
    }
  };
  const selectFriend = (friend) => { selectedFriend.value = friend; };
  const changePage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page;
      fetchFriends();
    }
  };
  const handleListSearch = () => {
    clearTimeout(listSearchTimeout);
    listSearchTimeout = setTimeout(() => {
      currentPage.value = 1;
      fetchFriends();
    }, 500);
  };
  watch(listSearchQuery, handleListSearch);
  const deleteFriend = async () => {
    if (!selectedFriend.value) return;
    const friendToDelete = selectedFriend.value;
    try {
      const url = `/friends/${friendToDelete.id}`;
      const response = await del(url);
      const isSuccess = response.ok || (typeof response === 'object' && Object.keys(response).length === 0);
      if (isSuccess) {
        console.log(`好友 ${friendToDelete.nickname} 删除成功`);
        selectedFriend.value = null;
        await fetchFriends();
      } else { console.error('删除好友失败 (业务错误):', response); }
    } catch (error) { console.error('删除好友时发生错误:', error.response ? error.response.data : error.message); }
  };

  // --- Actions for AddFriendModal  ---

  // 搜索用户
  const searchUsers = async (query) => {
    if (!query || query.trim() === '') {
      searchResults.value = [];
      return;
    }
    isSearching.value = true;
    searchResults.value = [];
    try {
      const params = { query };
      const response = await get('/users/search/q', params);

      searchResults.value = response.items.map(user => ({
        ...user,
        avatar: user.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.nickname}`,
      }));

    } catch (error) {
      console.error(`搜索用户 ${query} 失败:`, error);
      searchResults.value = [];
    } finally {
      isSearching.value = false;
    }
  };

  // 发送好友请求
  const sendFriendRequest = async (friendId) => {
    try {
      await post('/friends/requests', { friendId: friendId });
      // 可以在这里更新UI状态，比如将被添加的用户按钮变为“已发送”
      const userInResults = searchResults.value.find(user => user.id === friendId);
      if (userInResults) {
        userInResults.requestSent = true; // 标记为已发送请求
      }
      console.log(`已向用户 ${friendId} 发送好友请求`);
    } catch (error) {
      console.error("发送好友请求失败:", error.response ? error.response.data : error.message);
    }
  };
  
  // 获取所有好友请求（收到的和发出的）
  const fetchFriendRequests = async () => {
    isRequestsLoading.value = true;
    try {
      // 假设 API 是 GET /friend-requests/pending
      const response = await get('/friends/requests/incoming');
      incomingRequests.value = response.items.map(req => ({
        ...req,
        user: {
          ...req.user,
          avatar: req.user.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${req.user.nickname}`,
        }
        }));
    } catch (error) {
      console.error("获取好友请求列表失败:", error);
      incomingRequests.value = []; // 失败时清空
    } finally {
      isRequestsLoading.value = false;
    }
  };

  //获取已发送的好友请求
  const fetchOutgoingRequests = async () => {
    isRequestsLoading.value = true;
    try {
      const response = await get('/friends/requests/outgoing');
      outgoingRequests.value = response.items.map(req => ({
        ...req,
        friend:{
          ...req.friend,
          avatar: req.friend.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${req.friend.nickname}`,
        }
      }));
    } catch (error) {
      console.error("获取已发送好友请求列表失败:", error);
      outgoingRequests.value = []; // 失败时清空
    } finally {
      isRequestsLoading.value = false;
    }
  };

  // 处理好友请求 (同意或拒绝)
  const handleFriendRequest = async (requestId, action) => {
    try {
      // 假设 API 是 PATCH /friend-requests/{id}
      await patch(`/friend-requests/${requestId}`, { action }); // action: 'accept' or 'reject'
      // 成功后，从列表中移除该请求
      incomingRequests.value = incomingRequests.value.filter(req => req.id !== requestId);
      // 如果是同意，需要刷新好友列表
      if (action === 'accept') {
        fetchFriends();
      }
    } catch (error) {
      console.error(`处理好友请求 ${requestId} 失败:`, error);
    }
  };
  
  // 暴露所有 state, getters, 和 actions
  return {
    // Section 1
    friends,
    selectedFriend,
    searchQuery: listSearchQuery,
    currentPage,
    totalFriends,
    isLoading: isListLoading,
    totalPages,
    fetchFriends,
    selectFriend,
    changePage,
    deleteFriend,
    // Section 2
    searchResults,
    isSearching,
    incomingRequests,
    outgoingRequests,
    isRequestsLoading,
    searchUsers,
    sendFriendRequest,
    fetchFriendRequests,
    fetchOutgoingRequests,
    handleFriendRequest,
  };
});

