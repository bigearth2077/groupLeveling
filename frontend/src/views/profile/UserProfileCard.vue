<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <span class="loading loading-lg loading-spinner text-primary"></span>
      </div>

      <!-- 加载完成后的内容 -->
      <div v-else-if="userProfile">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
          <div class="avatar">
            <div class="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <input v-if="isEditing" type="text" v-model="editForm.avatarUrl" placeholder="输入图片 URL" class="input input-bordered w-full h-full text-center" />
              <template v-else>
                <img v-if="userProfile.avatarUrl" :src="userProfile.avatarUrl" />
                <UserCircleIcon v-else class="text-base-content/20" />
              </template>
            </div>
          </div>
          <div class="flex-grow text-center md:text-left">
            <input v-if="isEditing" type="text" v-model="editForm.nickname" class="input input-bordered w-full max-w-xs text-2xl font-bold" />
            <h2 v-else class="text-3xl font-bold">{{ userProfile.nickname }}</h2>
            <p class="text-base-content/60 mt-1">{{ userProfile.email }}</p>
            <textarea v-if="isEditing" v-model="editForm.bio" class="textarea textarea-bordered w-full max-w-xs mt-4" placeholder="个人简介..."></textarea>
            <p v-else class="mt-4 text-base-content/80">{{ userProfile.bio || '暂无简介' }}</p>
          </div>
        </div>
        <div class="card-actions justify-end">
          <template v-if="isEditing">
            <button @click="cancelEditing" class="btn btn-ghost">取消</button>
            <button @click="handleSave" class="btn btn-primary">保存</button>
          </template>
          <template v-else>
            <button @click="$emit('openPasswordModal')" class="btn btn-outline">修改密码</button>
            <button @click="startEditing" class="btn btn-primary">编辑资料</button>
          </template>
        </div>
      </div>
      
      <!-- 错误状态 -->
      <div v-else class="text-center text-error">
        <p>无法加载用户信息，请稍后重试。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { UserCircleIcon } from '@heroicons/vue/24/solid';

const props = defineProps({
  isLoading: Boolean,
  userProfile: Object,
});

const emit = defineEmits(['saveProfile', 'openPasswordModal']);

const isEditing = ref(false);
const editForm = ref({});

const startEditing = () => {
  editForm.value = { ...props.userProfile };
  isEditing.value = true;
};

const cancelEditing = () => {
  isEditing.value = false;
};

const handleSave = async () => {
  const success = await emit('saveProfile', editForm.value);
  if (success) {
    isEditing.value = false;
  }
};
</script>
