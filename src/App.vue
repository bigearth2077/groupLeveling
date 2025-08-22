<template>
    <router-view></router-view>
</template>
<script setup>
import { useUserStore } from './store/user'
import { onMounted } from 'vue'
import { useThemeStore } from './store/theme'
// 获取用户 store
const userStore = useUserStore()
const themeStore = useThemeStore()
// 应用启动时恢复用户状态
userStore.loadFromLocalStorage()
onMounted(() => {
  themeStore.applyTheme(themeStore.theme)
})
</script>