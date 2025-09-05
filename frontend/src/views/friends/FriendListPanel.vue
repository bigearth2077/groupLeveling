<template>
  <!-- 左栏: 好友列表 -->
  <div class="lg:col-span-1 flex flex-col card bg-base-200 shadow-xl">
    <div class="card-body p-4">
      <div class="flex justify-between items-center mb-6">
        <h2 class="card-title">我的好友</h2>
        <!-- 暂时移除添加按钮，因为它需要与父组件通信 -->
      </div>
      
      <!-- 搜索框 -->
      <div class="form-control mb-4">
        <input 
          type="text" 
          placeholder="搜索好友昵称..." 
          class="input input-bordered w-full"
          v-model="friendsStore.searchQuery"
        />
      </div>

      <!-- 好友列表 -->
      <div class="flex-1 space-y-2 overflow-y-auto pr-2">
        <p v-if="friendsStore.friends.length === 0" class="text-base-content text-opacity-60 text-center py-4">
          {{ friendsStore.isLoading ? '正在加载...' : '沒有找到好友。' }}
        </p>
        <ul v-else class="menu bg-base-100 rounded-box">
          <li v-for="friend in friendsStore.friends" :key="friend.id" @click="friendsStore.selectFriend(friend)">
            <a :class="{'active': friendsStore.selectedFriend && friendsStore.selectedFriend.id === friend.id}">
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
            v-for="page in friendsStore.totalPages" 
            :key="page" 
            :class="{'btn-active': friendsStore.currentPage === page}"
            @click="friendsStore.changePage(page)"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useFriendsStore } from '../../store/friends';

// 1. 直接获取 store 实例
const friendsStore = useFriendsStore();

// 2. 在组件挂载时，让 store 去获取初始数据
onMounted(() => {
  friendsStore.fetchFriends();
});
</script>

