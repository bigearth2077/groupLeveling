<template>
  <!-- 右栏: 好友资料展示 -->
  <div class="lg:col-span-2 card bg-base-200 shadow-xl">
    <div class="card-body items-center justify-center">
      <!-- 未选择好友时的占位符 -->
      <div v-if="!friendsStore.selectedFriend" class="text-center text-base-content text-opacity-60">
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
                <img :src="friendsStore.selectedFriend.avatar" :alt="friendsStore.selectedFriend.nickname" />
              </div>
            </div>
            <h2 class="card-title text-2xl mt-4">{{ friendsStore.selectedFriend.nickname }}</h2>
            <p class="text-base-content text-opacity-70 italic my-2">"{{ friendsStore.selectedFriend.bio || '这位朋友很酷，什么也没留下。' }}"</p>
            
            <div class="card-actions justify-end w-full mt-auto">
              <button class="btn btn-primary">发起学习</button>
              <button class="btn btn-error btn-outline" @click="friendsStore.deleteFriend">删除好友</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFriendsStore } from '../../store/friends';

// 直接从 store 获取 selectedFriend 的状态
const friendsStore = useFriendsStore();
</script>

