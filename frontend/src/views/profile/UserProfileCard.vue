<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <span class="loading loading-lg loading-spinner text-primary"></span>
      </div>

      <div v-else-if="userProfile">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
          <div class="avatar relative group">
            <div class="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <template v-if="isEditing">
                <input
                  type="file"
                  ref="fileInput"
                  @change="onFileChange"
                  accept="image/*"
                  class="hidden"
                />
                <img v-if="avatarPreview || editForm.avatarUrl" :src="avatarPreview || editForm.avatarUrl" alt="Avatar" />
                <UserCircleIcon v-else class="text-base-content/20" />

                <div
                  @click="triggerFileInput"
                  class="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span v-if="!isUploading">点击上传</span>
                  <span v-else class="loading loading-spinner loading-sm"></span>
                </div>
              </template>
              
              <template v-else>
                <img v-if="userProfile.avatarUrl" :src="userProfile.avatarUrl" alt="Avatar" />
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
            <button @click="handleSave" class="btn btn-primary" :disabled="isUploading">
              <span v-if="isUploading" class="loading loading-spinner loading-xs"></span>
              保存
            </button>
          </template>
          <template v-else>
            <button @click="$emit('openPasswordModal')" class="btn btn-outline">修改密码</button>
            <button @click="startEditing" class="btn btn-primary">编辑资料</button>
          </template>
        </div>
      </div>
      
      <div v-else class="text-center text-error">
        <p>无法加载用户信息，请稍后重试。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { UserCircleIcon } from '@heroicons/vue/24/solid';

// --- 步骤 1: 替换为你的真实上传API ---
// 导入你的API函数, 例如:
// import { uploadAvatarAPI } from '@/api/user'; 

/**
 * 模拟的上传API函数
 * @param {File} file - 用户选择的图片文件
 * @returns {Promise<{ url: string }>} - 返回一个包含新图片URL的对象
 * @description
 * 这是一个模拟函数。在你的实际项目中，你需要调用真实的后端上传接口。
 * 你的后端需要一个接口来接收 FormData 格式的文件，
 * 保存文件后，返回一个可以公开访问的URL。
 */
const uploadAvatarAPI = async (file) => {
  console.log('开始上传文件:', file.name);
  const formData = new FormData();
  formData.append('avatar', file); // 'avatar' 是后端接收文件时使用的字段名

  // === 在这里替换成你真实的 API 请求 ===
  // 例如使用 axios:
  // try {
  //   const response = await axios.post('/api/upload/avatar', formData, {
  //     headers: { 'Content-Type': 'multipart/form-data' }
  //   });
  //   return response.data; // 假设后端返回 { url: '...' }
  // } catch (error) {
  //   console.error('上传失败', error);
  //   throw error;
  // }
  // ===================================

  // --- START: 模拟网络延迟和返回结果 ---
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 模拟成功: 返回一个临时的本地URL作为示例
      const mockUrl = URL.createObjectURL(file); 
      console.log('上传成功，模拟URL:', mockUrl);
      resolve({ url: mockUrl });

      // 模拟失败:
      // reject(new Error('模拟上传失败'));
    }, 1500); // 模拟1.5秒的上传延迟
  });
  // --- END: 模拟代码 ---
};
// ------------------------------------

const props = defineProps({
  isLoading: Boolean,
  userProfile: Object,
});

const emit = defineEmits(['saveProfile', 'openPasswordModal']);

const isEditing = ref(false);
const editForm = ref({});

// --- 步骤 2: 添加处理上传的逻辑 ---
const fileInput = ref(null);      // 用于引用隐藏的 <input type="file">
const avatarPreview = ref(null);  // 用于存储本地预览的图片URL
const isUploading = ref(false);   // 用于跟踪上传状态, 以禁用按钮或显示加载动画

// 方法：触发文件选择框
const triggerFileInput = () => {
  if (isUploading.value) return; // 如果正在上传，则不响应点击
  fileInput.value.click();
};

// 方法：当用户选择文件后触发
const onFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  // 1. 显示本地预览
  avatarPreview.value = URL.createObjectURL(file);

  // 2. 调用上传API
  isUploading.value = true;
  try {
    const result = await uploadAvatarAPI(file);
    // 3. 更新表单中的 avatarUrl 为后端返回的真实URL
    editForm.value.avatarUrl = result.url;
    console.log('头像URL已更新:', result.url);
  } catch (error) {
    console.error('头像上传失败:', error);
    // 可选：在这里向用户显示一个toast或alert提示
    avatarPreview.value = null; // 上传失败，清除预览，恢复到旧头像
  } finally {
    isUploading.value = false;
  }
};
// --- 新增逻辑结束 ---

const startEditing = () => {
  editForm.value = { ...props.userProfile };
  avatarPreview.value = null; // 进入编辑时，重置预览
  isEditing.value = true;
};

const cancelEditing = () => {
  avatarPreview.value = null; // 取消编辑时，也重置预览
  isEditing.value = false;
};

const handleSave = async () => {
  const success = await emit('saveProfile', editForm.value);
  if (success) {
    isEditing.value = false;
    avatarPreview.value = null; // 保存成功后，清除预览
  }
};
</script>