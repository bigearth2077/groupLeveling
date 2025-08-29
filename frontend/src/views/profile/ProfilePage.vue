<template>
  <div class="p-4 md:p-8 bg-base-200 min-h-screen">
    <NavBar class="z-20"/>
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">个人资料</h1>

      <!-- 用户资料卡片组件 -->
      <UserProfileCard
        :is-loading="isLoading"
        :user-profile="userProfile"
        @save-profile="saveProfile"
        @open-password-modal="openPasswordModal"
      />
      
      <!-- 用户搜索组件 -->
      <UserSearch @view-user="viewUserProfile" />

    </div>

    <!-- 密码修改模态框组件 -->
    <ChangePasswordModal id="password_modal" />

    <!-- 他人资料模态框组件 -->
    <PublicProfileModal 
      id="public_profile_modal"
      :selected-user="selectedUser"
      @close="closeUserProfileModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { get, patch } from '../../utils/request';
import NavBar from '../../components/NavBar.vue';
import UserProfileCard from './UserProfileCard.vue';
import UserSearch from './UserSearch.vue';
import ChangePasswordModal from './ChangePasswordModal.vue';
import PublicProfileModal from './PublicProfileModal.vue'; 

// --- 状态管理 ---
const isLoading = ref(true);
const userProfile = ref(null);
const selectedUser = ref(null);

// --- API 调用方法 ---

// 获取当前用户信息
const fetchUserProfile = async () => {
  isLoading.value = true;
  try {
    userProfile.value = await get('/users/me');
  } catch (error) {
    console.error("获取用户信息失败:", error);
    userProfile.value = null;
  } finally {
    isLoading.value = false;
  }
};

// 保存修改后的用户信息 (由子组件触发)
const saveProfile = async (editForm) => {
  try {
    const payload = {
      nickname: editForm.nickname,
      avatarUrl: editForm.avatarUrl,
      bio: editForm.bio
    };
    await patch('/users/me', payload);
    await fetchUserProfile(); // 重新获取最新信息
    alert('个人信息更新成功！');
    return true; // 返回成功状态
  } catch (error) {
    console.error("更新用户信息失败:", error);
    alert('更新失败，请重试。');
    return false; // 返回失败状态
  }
};

// 查看指定用户的公开资料 (由子组件触发)
const viewUserProfile = async (userId) => {
  selectedUser.value = null;
  public_profile_modal.showModal();
  try {
    selectedUser.value = await get(`/users/${userId}/public`);
  } catch (error) {
    console.error("获取用户公开资料失败:", error);
    alert("无法加载该用户的资料。");
    closeUserProfileModal();
  }
};

// --- 视图控制方法 ---

const openPasswordModal = () => {
  password_modal.showModal();
};

const closeUserProfileModal = () => {
  public_profile_modal.close();
  selectedUser.value = null;
};

// --- 生命周期 ---
onMounted(fetchUserProfile);
</script>
