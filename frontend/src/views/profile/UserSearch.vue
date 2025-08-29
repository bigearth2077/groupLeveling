<template>
  <div class="mt-8 card bg-base-100 shadow-xl">
    <div class="card-body">
      <h2 class="text-xl font-bold">探索其他用户</h2>
      <!-- 搜索表单 -->
      <form @submit.prevent="handleSearch" class="form-control flex-row gap-2 mt-4">
        <input 
          type="text" 
          v-model="searchQuery"
          placeholder="按昵称或邮箱搜索..." 
          class="input input-bordered w-full" 
          required
        />
        <button type="submit" class="btn btn-primary" :disabled="isSearching">
          <span v-if="isSearching" class="loading loading-spinner"></span>
          搜索
        </button>
      </form>

      <!-- 搜索结果 -->
      <div class="mt-4">
        <div v-if="isSearching && !searchResults" class="text-center p-4">正在搜索中...</div>
        <div v-else-if="searchResults">
          <p class="text-sm text-base-content/60 mb-2">找到 {{ searchResults.total }} 条结果</p>
          <div v-if="searchResults.items.length > 0" class="space-y-2">
            <!-- 用户列表 -->
            <div 
              v-for="user in searchResults.items" 
              :key="user.id" 
              @click="$emit('viewUser', user.id)"
              class="flex items-center gap-4 p-2 rounded-lg hover:bg-base-200 cursor-pointer transition-colors"
            >
              <div class="avatar">
                <div class="w-12 rounded-full">
                  <img v-if="user.avatarUrl" :src="user.avatarUrl" />
                  <UserCircleIcon v-else class="text-base-content/20" />
                </div>
              </div>
              <div>
                <div class="font-bold">{{ user.nickname }}</div>
                <div class="text-sm text-base-content/60">{{ user.email }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-center p-4">没有找到匹配的用户。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { get } from '../../utils/request';
import { UserCircleIcon } from '@heroicons/vue/24/solid';

const emit = defineEmits(['viewUser']);

const searchQuery = ref('');
const isSearching = ref(false);
const searchResults = ref(null);

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return;
  isSearching.value = true;
  searchResults.value = null;
  try {
    searchResults.value = await get('/users/search/q', {
      params: {
        query: searchQuery.value,
        page: 1,
        pageSize: 20
      }
    });
  } catch (error) {
    console.error("搜索用户失败:", error);
    alert("搜索失败，请稍后重试。");
  } finally {
    isSearching.value = false;
  }
};
</script>
