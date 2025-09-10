<template>
    <div class="relative min-h-screen font-sans">
      <div v-if="isAuthenticated" class="absolute top-4 left-4 z-50">
        <AvatarDropdown />
      </div>
      <router-view></router-view>
    </div>
</template>
<script setup>
import { useUserStore } from './store/user'
import { onMounted,computed } from 'vue'
import { useThemeStore } from './store/theme'
import AvatarDropdown from './components/AvatarDropdown.vue'
// 获取用户 store
const userStore = useUserStore()
const themeStore = useThemeStore()
const isAuthenticated = computed(() => !!userStore.token)
// 应用启动时恢复用户状态
userStore.loadFromLocalStorage()
onMounted(() => {
  themeStore.applyTheme(themeStore.theme)
  userStore.loadFromLocalStorage();
})
</script>