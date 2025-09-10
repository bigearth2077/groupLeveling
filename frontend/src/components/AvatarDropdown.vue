<template>
  <div class="dropdown dropdown-right">
    <label tabindex="0" class="btn btn-ghost btn-circle avatar mr-6 mt-6 btn-lg">
        <div class="w-12 rounded-full"> 
            <img
            v-if="userStore.user.avatar"
            :src="userStore.user.avatar"
            alt="用户头像"
            />
            <UserCircleIcon v-else class="h-12 w-12 text-base-content/30" />
        </div>
    </label>

    <ul tabindex="0" class="menu menu-sm w-auto dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box">
      <li>
        <span class="font-medium text-base-content/70 pointer-events-none">
          <span class="font-bold text-base-content">{{ userStore.user.email }}</span>
        </span>
      </li>
      
      <div class="divider my-1"></div>

      <li>
        <a @click="goToProfile">
            <UserIcon class="h-6 w-6 text-gray-500" />
            个人资料
        </a>
      </li>

      <li>
        <a @click="logout">
            <XMarkIcon class="h-6 w-6 text-gray-500" />
          注销
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user'; 
import { UserCircleIcon } from "@heroicons/vue/24/outline";
import { UserIcon,XMarkIcon  } from "@heroicons/vue/16/solid";
// 实例化 store 和 router
const userStore = useUserStore();
const router = useRouter();

// --- 数据 ---

// --- 方法 ---

// 跳转到个人资料页
const goToProfile = () => {
  router.push('/profile');
};

// 注销
const logout = () => {
  // 调用 store 中的 action 来清空用户数据
  userStore.clearUser(); //
  // 跳转到登录页
  router.push('/login');
};
</script>

<style scoped>
/* 样式保持不变 */
.menu li > a:hover {
  background-color: hsl(var(--p) / 0.1);
}
</style>