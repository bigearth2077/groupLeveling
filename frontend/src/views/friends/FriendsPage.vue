<template>
  <div class="flex h-screen bg-base-100 text-base-content">
    <!-- NavBar -->
    <NavBar />
    
    <!-- 主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden pl-28">
      <div class="p-4 sm:p-6 lg:p-8 flex flex-col h-full overflow-y-auto">
        <h1 class="text-3xl font-bold mb-6 text-base-content">好友中心</h1>
        <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          
          <!-- 左栏: 好友列表 -->
          <div class="lg:col-span-1 flex flex-col card bg-base-200 shadow-xl">
            <div class="card-body p-4">
              <h2 class="card-title mb-4">我的好友</h2>
              <!-- 搜索框 -->
              <div class="form-control mb-4">
                <input 
                  type="text" 
                  placeholder="搜索好友昵称..." 
                  class="input input-bordered w-full"
                  v-model="searchQuery"
                  @input="handleSearch"
                />
              </div>
    
              <!-- 好友列表 -->
              <div class="flex-1 space-y-2 overflow-y-auto pr-2">
                <p v-if="friends.length === 0" class="text-base-content text-opacity-60 text-center py-4">
                  {{ isLoading ? '正在加载...' : '沒有找到好友。' }}
                </p>
                <ul v-else class="menu bg-base-100 rounded-box">
                  <li v-for="friend in friends" :key="friend.id" @click="selectFriend(friend)">
                    <a :class="{'active': selectedFriend && selectedFriend.id === friend.id}">
                      <div class="avatar online">
                        <div class="w-10 rounded-full">
                          <img :src="friend.avatar" :alt="friend.nickname" />
                        </div>
                      </div>
                      <span class="font-semibold">{{ friend.nickname }}</span>
                    </a>
                  </li>
                </ul>
              </div>
    
              <!-- 分页器 -->
              <div class="card-actions justify-center mt-4">
                <div class="join">
                  <button 
                    class="join-item btn" 
                    v-for="page in totalPages" 
                    :key="page" 
                    :class="{'btn-active': currentPage === page}"
                    @click="changePage(page)"
                  >
                    {{ page }}
                  </button>
                </div>
              </div>
            </div>
          </div>
    
          <!-- 右栏: 好友资料展示 -->
          <div class="lg:col-span-2 card bg-base-200 shadow-xl">
            <div class="card-body items-center justify-center">
              <!-- 未选择好友时的占位符 -->
              <div v-if="!selectedFriend" class="text-center text-base-content text-opacity-60">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5-3.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <p>从左侧选择一位好友</p>
                <p>查看他们的详细资料</p>
              </div>
              
              <!-- 好友资料卡片 -->
              <div v-else class="w-full h-full">
                <div class="card bg-base-100 shadow-lg h-full flex flex-col">
                  <div class="card-body items-center text-center flex-1">
                    <div class="avatar online">
                      <div class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <img :src="selectedFriend.avatar" :alt="selectedFriend.nickname" />
                      </div>
                    </div>
                    <h2 class="card-title text-2xl mt-4">{{ selectedFriend.nickname }}</h2>
                    <!-- 根据API响应，这里显示 bio -->
                    <p class="text-base-content text-opacity-70 italic my-2">"{{ selectedFriend.bio || '这位朋友很酷，什么也没留下。' }}"</p>
                    
                    <!-- 学习统计部分已根据你的要求删除 -->

                    <div class="card-actions justify-end w-full mt-auto">
                      <button class="btn btn-primary">发起学习</button>
                      <button class="btn btn-ghost">删除好友</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { get } from '../../utils/request'; 
import NavBar from '../../components/NavBar.vue';

// --- Reactive State ---
const friends = ref([]); // 只存储当前页的好友
const selectedFriend = ref(null);
const searchQuery = ref('');
const currentPage = ref(1);
const friendsPerPage = ref(10); // 可以根据后端调整
const totalFriends = ref(0); // 好友总数
const isLoading = ref(true); // 加载状态
let searchTimeout = null; // 用于搜索防抖

// --- API Call ---
const fetchFriends = async () => {
  isLoading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: friendsPerPage.value,
    };
    if (searchQuery.value) {
      params.nickname = searchQuery.value;
    }

    // 根据你的描述，接口路径是 /friends
    const responseData = await get('/friends', params);
    
    // 从后端获取好友列表和总数
    const apiFriends = responseData.items.map(friend => ({
      ...friend,
      // 使用后端返回的 avatarUrl，如果没有则使用 DiceBear 作为备用
      avatar: friend.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.nickname}`,
    }));

    friends.value = apiFriends;
    totalFriends.value = responseData.total;

  } catch (error) {
    console.error("获取好友列表失败:", error);
    friends.value = [];
    totalFriends.value = 0;
    // 这里可以添加用户友好的错误提示
  } finally {
    isLoading.value = false;
  }
};

// --- Computed Properties ---
// 总页数现在由后端的 total 数据计算得出
const totalPages = computed(() => {
  if (totalFriends.value === 0) return 1;
  return Math.ceil(totalFriends.value / friendsPerPage.value);
});

// --- Methods ---
const selectFriend = (friend) => {
  selectedFriend.value = friend;
};

// 切换页面时，重新获取数据
const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    // currentPage 的变化会通过 watch 自动触发 fetchFriends
  }
};

// 搜索输入处理（防抖）
const handleSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage.value = 1; // 搜索时回到第一页
        fetchFriends();
    }, 500); // 停止输入500毫秒后执行搜索
};


// --- Watchers ---
// 监听 currentPage 的变化，自动获取新一页的数据
watch(currentPage, (newPage, oldPage) => {
    if (newPage !== oldPage) {
        fetchFriends();
    }
});

// --- Lifecycle Hook ---
onMounted(() => {
  fetchFriends();
});

</script>

