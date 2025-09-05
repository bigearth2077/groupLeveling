<template>
  <div class="flex h-screen bg-base-100 text-base-content">
    <NavBar />
    
    <div class="flex-1 flex flex-col overflow-hidden pl-28">
      <div class="p-4 sm:p-6 lg:p-8 flex flex-col h-full overflow-y-auto">
        
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-bold text-base-content">好友中心</h1>
          <!-- 添加好友按钮的功能需要重新规划，暂时放在这里 -->
           <button class="btn btn-primary btn-sm" @click="openAddFriendModal">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 11a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-1z" />
            </svg>
            添加
          </button>
        </div>

        <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          <!-- 模块化加载子组件 -->
          <FriendListPanel />
          <FriendDetailCard />
        </div>
      </div>
    </div>

    <AddFriendModal ref="addFriendModalRef" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import NavBar from '../../components/NavBar.vue';
import AddFriendModal from './AddFriendModal.vue';

// 导入新的子组件
import FriendListPanel from './FriendListPanel.vue';
import FriendDetailCard from './FriendDetailCard.vue';

// 主页面只保留与自身UI相关的逻辑，例如弹窗的控制
const addFriendModalRef = ref(null);

const openAddFriendModal = () => {
  if (addFriendModalRef.value) {
    addFriendModalRef.value.open();
  }
};
</script>

