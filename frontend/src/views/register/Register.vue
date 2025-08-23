<template>
  <div class="min-h-screen flex items-center justify-center bg-custom-gray dark:bg-custom-gray relative overflow-hidden">
    <!-- 注册卡片 -->
    <div class="bg-transparent p-8 rounded-lg z-10 w-80">
      <h1 class="text-green-700 text-4xl font-bold text-center mb-8">Register</h1>
      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <input v-model="email" type="email" placeholder="Email"
            class="w-full border-b border-green-700 bg-transparent outline-none text-green-500 dark:text-green-400 placeholder-green-700 dark:placeholder-green-400 focus:border-green-500 focus:placeholder-green-500" />
        </div>
        <div>
          <input v-model="nickname" type="text" placeholder="Nickname"
            class="w-full border-b border-green-700 bg-transparent outline-none text-green-500 dark:text-green-400 placeholder-green-700 dark:placeholder-green-400 focus:border-green-500 focus:placeholder-green-500" />
        </div>
        <div>
          <input v-model="password" type="password" placeholder="Password"
            class="w-full border-b border-green-700 bg-transparent outline-none text-green-500 dark:text-green-400 placeholder-green-700 dark:placeholder-green-400 focus:border-green-500 focus:placeholder-green-500" />
        </div>
        <div>
          <input v-model="confirmPassword" type="password" placeholder="Confirm Password"
            class="w-full border-b border-green-700 bg-transparent outline-none text-green-500 dark:text-green-400 placeholder-green-700 dark:placeholder-green-400 focus:border-green-500 focus:placeholder-green-500" />
        </div>
        <button type="submit"
          class="btn btn-outline w-full bg-custom-white dark:bg-green-700 text-green-700 dark:text-green-100 py-2 rounded hover:bg-yellow-400 transition">
          Register
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { post } from '../../utils/request';

const email = ref('');
const nickname = ref('');
const password = ref('');
const confirmPassword = ref('');

const handleRegister = async () => {
  try {
    if (password.value !== confirmPassword.value) {
      alert('Passwords do not match');
      return;
    }
    const res = await post('/auth/register', {
      email: email.value,
      password: password.value,
      nickname: nickname.value
    });
  } catch (err) {
  }
};
</script>
