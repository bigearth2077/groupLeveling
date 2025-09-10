<template>
  <dialog ref="modalRef" class="modal">
    <div class="modal-box w-11/12 max-w-2xl">
      <h3 class="font-bold text-lg">好友管理</h3>
      
      <!-- Tabs -->
      <div role="tablist" class="tabs tabs-lifted mt-4">
        <!-- Tab 1: 搜索用户 -->
        <input type="radio" name="friend_tabs" role="tab" class="tab-content-bg-base-100 tab" aria-label="搜索用户" checked />
        <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">
          
          <!-- 搜索区域 -->
          <div class="flex gap-2 mb-4">
            <input 
              v-model="modalSearchQuery"
              type="text" 
              placeholder="请输入昵称或邮箱进行搜索..." 
              class="input input-bordered w-full"
              @keyup.enter="performSearch"
            />
            <button class="btn btn-primary" @click="performSearch" :disabled="friendsStore.isSearching">
              <span v-if="friendsStore.isSearching" class="loading loading-spinner"></span>
              搜索
            </button>
          </div>

          <!-- 搜索结果 -->
          <div class="overflow-x-auto">
            <p v-if="!friendsStore.isSearching && friendsStore.searchResults.length === 0" class="text-center text-base-content text-opacity-60 py-4">
              没有搜索结果。
            </p>
            <table v-else class="table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>昵称</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in friendsStore.searchResults" :key="user.id">
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar">
                        <div class="mask mask-squircle w-12 h-12">
                          <img :src="user.avatar" :alt="user.nickname" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{{ user.nickname }}</td>
                  <th>
                    <button 
                      class="btn btn-xs"
                      :class="user.requestSent ? 'btn-disabled' : 'btn-primary'"
                      :disabled="user.requestSent"
                      @click="friendsStore.sendFriendRequest(user.id)"
                    >
                      {{ user.requestSent ? '已发送' : '添加好友' }}
                    </button>
                  </th>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

        <!-- Tab 2: 收到的请求 -->
        <input type="radio" name="friend_tabs" role="tab" class="tab-content-bg-base-100 tab" aria-label="收到的请求" />
        <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">
          <!-- Loading Spinner -->
          <div v-if="friendsStore.isRequestsLoading" class="text-center py-10">
            <span class="loading loading-spinner loading-lg"></span>
          </div>

          <!-- No Requests Message -->
          <div v-else-if="friendsStore.incomingRequests.length === 0" class="text-center text-base-content text-opacity-60 py-10">
            <p>当前没有收到新的好友请求。</p>
          </div>

          <!-- Requests List -->
          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>昵称</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in friendsStore.incomingRequests" :key="request.id">
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar">
                        <div class="mask mask-squircle w-12 h-12">
                          <img :src="request.user.avatar" :alt="request.user.nickname" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{{ request.user.nickname }}</td>
                  <th>
                    <div class="flex gap-2">
                      <button class="btn btn-success btn-xs">同意</button>
                      <button class="btn btn-error btn-outline btn-xs">拒绝</button>
                    </div>
                  </th>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab 3: 已发送的请求 -->
        <input type="radio" name="friend_tabs" role="tab" class="tab-content-bg-base-100 tab" aria-label="已发送的请求" />
        <div role="tabpanel" class="tab-content bg-base-100 border-base-300 rounded-box p-6">
          <div v-if="friendsStore.isRequestsLoading" class="text-center py-10">
            <span class="loading loading-spinner loading-lg"></span>
          </div>
          <div v-else-if="friendsStore.outgoingRequests.length === 0" class="text-center text-base-content text-opacity-60 py-10">
            <p>你还没有发送过好友请求</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>用户</th>
                  <th>昵称</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="request in friendsStore.outgoingRequests" :key="request.id">
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar">
                        <div class="mask mask-squircle w-12 h-12">
                          <img :src="request.friend.avatar" :alt="request.friend.nickname" />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{{ request.friend.nickname }}</td>
                  <th>
                    <span class="badge badge-ghost badge-sm">{{request.status}}</span>
                  </th>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
        
      </div>

      <div class="modal-action">
        <form method="dialog">
          <button class="btn">关闭</button>
        </form>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useFriendsStore } from '../../store/friends';

// --- 获取 Store 实例 ---
const friendsStore = useFriendsStore();

// --- 组件内部状态 ---
const modalRef = ref(null);
const modalSearchQuery = ref(''); // 用于绑定搜索框的输入

// --- 方法 ---
const open = () => {
  if (modalRef.value) {
    // 每次打开弹窗时，清空上一次的搜索结果
    friendsStore.searchResults = [];
    modalSearchQuery.value = '';
    
    // 【新增】同时获取待处理的好友请求
    friendsStore.fetchFriendRequests();
    friendsStore.fetchOutgoingRequests();
    modalRef.value.showModal();
  }
};

const performSearch = () => {
  friendsStore.searchUsers(modalSearchQuery.value.trim());
};

// --- 暴露方法给父组件 ---
defineExpose({
  open,
});
</script>

