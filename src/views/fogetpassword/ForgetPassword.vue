<template>
  <div class="min-h-screen flex items-center justify-center bg-custom-gray dark:bg-custom-gray relative overflow-hidden">
    <!-- 忘记密码卡片 -->
    <div class="bg-transparent p-8 rounded-lg z-10 w-80">
      <h1 class="text-green-700 text-4xl font-bold text-center mb-8">Reset Password</h1>
      <form @submit.prevent="handleReset" class="space-y-6">
        <div>
          <input v-model="email" type="email" placeholder="Email"
            class="w-full border-b border-green-700 bg-transparent outline-none text-green-500 dark:text-green-400 placeholder-green-700 dark:placeholder-green-400 focus:placeholder-green-500 focus:border-green-500 " />
        </div>
        <button type="submit"
          class="btn btn-outline w-full bg-custom-white dark:bg-green-700 text-green-500 dark:text-green-100 py-2 rounded hover:bg-yellow-400 transition">
          Send Reset Link
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { post } from '../../utils/request';

const email = ref('');

const handleReset = async () => {
  try {
    const res = await post('/auth/forgot-password', { email: email.value });
    console.log('重置邮件已发送:', res);
  } catch (err) {
    console.error('发送失败:', err);
  }
};
</script>