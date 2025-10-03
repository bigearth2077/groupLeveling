<template>
  <div class="flex h-screen bg-base-200 text-base-content">
    <!-- 1. 左侧固定导航栏 -->
    <NavBar />
    
    <!-- 2. 主内容区域 -->
    <div class="flex-1 flex flex-col overflow-hidden pl-28">
      <div class="p-4 sm:p-6 lg:p-8 flex flex-col h-full">
        
        <!-- 页面头部：标题和操作按钮 -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-bold text-base-content">在线自习室</h1>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" @click="studyRoomStore.fetchRooms" :disabled="studyRoomStore.isLoading">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" :class="{'animate-spin': studyRoomStore.isLoading}" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 20h5v-5M20 4h-5v5" /></svg>
              刷新列表
            </button>
            <button class="btn btn-primary btn-sm" @click="openCreateRoomModal">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
              创建房间
            </button>
          </div>
        </div>

        <!-- 3. 房间列表区域 -->
        <div class="flex-1 overflow-y-auto pr-2">
          <!-- 加载状态 -->
          <div v-if="studyRoomStore.isLoading" class="text-center py-20">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
          <!-- 空状态 -->
          <div v-else-if="studyRoomStore.rooms.length === 0" class="text-center py-20 text-base-content/60">
            <p>当前没有公开的自习室</p>
            <p>点击右上角“创建房间”来创建一个吧！</p>
          </div>
          <!-- 房间网格 -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <!-- 房间卡片示例 (使用 v-for 遍历真实数据) -->
            <div v-for="room in studyRoomStore.rooms" :key="room.id" class="card card-compact bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div class="card-body">
                <h2 class="card-title truncate">{{ room.name }}</h2>
                <div class="flex items-center gap-2 mt-2">

                  <div class="flex items-center gap-1 text-sm text-base-content/70">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5-3.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <span>{{ room.userCount || 10 }} / 20</span>
                  </div>
                  
                </div>
                
                <div class="card-actions justify-between mt-4">
                  <div class="badge badge-outline badge-sm">{{ room.createdAt  }}</div>
                  <button class="btn btn-primary btn-sm">加入房间</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 创建房间弹窗组件 -->
    <CreateRoomModal ref="createRoomModalRef" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavBar from '../../components/NavBar.vue';
import CreateRoomModal from './CreateRoomModal.vue';
import { useStudyRoomStore } from '../../store/studyRoom';

const studyRoomStore = useStudyRoomStore();

// --- 状态 ---
const createRoomModalRef = ref(null);

// --- 方法 ---
const openCreateRoomModal = () => {
  if (createRoomModalRef.value) {
    createRoomModalRef.value.open();
  }
};

onMounted(() => {
  studyRoomStore.fetchRooms();
});
</script>
