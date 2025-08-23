<template>
  <div class="min-h-screen flex items-center justify-center bg-custom-gray dark:bg-custom-gray relative overflow-hidden">
    <!-- 左侧大圆 -->
    <div class="absolute left-[-20vw] top-[10vh] w-[80vw] h-[80vw] max-w-[80vh] max-h-[80vh] bg-yellow-400 rounded-full"></div>
    <!-- 小绿圆 -->
    <div class="absolute left-[5vw] top-[10vh] w-[8vw] h-[8vw] max-w-[8vh] max-h-[8vh] bg-lime-600 rounded-full"></div>
    <!-- 登录卡片 -->
    <div class="bg-transparent p-[2vw] rounded-lg z-10 w-[28vw] min-w-[250px]">
      <h1 class="text-green-700 text-[5vw] min-text-[24px] font-bold-600  mb-[2vw] left-[-25vw] -translate-y-[4vw]">login</h1>
      <form @submit.prevent="handleLogin" class="space-y-[2vw]">
        <div>
          <input
            v-model="email"
            type="text"
            placeholder="Email"
            class="w-full 
            border-b 
            border-green-700 
            bg-transparent 
            outline-none 
            text-green-500 
            dark:text-green-400 
            placeholder-green-700 
            dark:placeholder-green-400 
            focus:border-green-500 
            focus:placeholder-green-500"
          />
        </div>
        <div>
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="w-full border-b 
            border-green-700 
            bg-transparent 
            outline-none 
            text-green-500 
            dark:text-green-400 
            placeholder-green-700 
            dark:placeholder-green-400 
            focus:border-green-500 
            focus:placeholder-green-500"
          />
        </div>
        <button
          type="submit"
          class=" btn btn-outline w-full bg-custom-white dark:bg-green-700 text-green-700 dark:text-green-100 py-[0.8vw] rounded hover:bg-yellow-400 transition"
        >
          login
        </button>
        <div class="flex justify-between mt-4">
          <button
            type="button"
            @click="goRegister"
            class="text-green-700 dark:text-green-400 hover:text-yellow-400"
          >
            Register
          </button>
          <button
            type="button"
            @click="goForgetPassword"
            class="text-green-700 dark:text-green-400 hover:text-yellow-400"
          >
            Forget Password
          </button>
        </div>
      </form>
    </div>
  </div>
</template>



<script setup>
import { ref } from 'vue';
import { post } from '../../utils/request'
import { useUserStore } from '../../store/user';
import { useRouter,useRoute } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const handleLogin = async () => {
  try {
    const res = await post('/auth/login', {
      email:email.value,
      password:password.value,
    });
    if (res.token) {
      userStore.setUser(res.token, res.user)
      localStorage.setItem('token',res.token);
      localStorage.setItem('user', JSON.stringify(res.user))
      const redirect = route.query.redirect || '/home';
      router.push(redirect);
    }
  } catch (err) {
    console.error('登录失败:', err);
  }
};

const goRegister = () => {
  router.push('/register');
};

const goForgetPassword = () => {
  router.push('/forget-password');
};

</script>

<style lang="scss" scoped>

</style>