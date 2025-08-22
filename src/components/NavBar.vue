<template>
    <aside class="w-60 bg-base-100 shadow-lg flex flex-col">
        <h2 class="text-2xl font-bold text-primary p-4">自习系统</h2>
        <ul class="menu flex-1">
            <li v-for="item in navItems" :key="item.name" class="text-primary mb-3">
            <router-link
                :to="item.path"
                class="group flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
                active-class="bg-accent text-white"
                exact-active-class="bg-accent text-white"
                :class="$route.path !== item.path ? 'hover:bg-primary hover:text-white' : ''"
            >
                <component :is="item.icon" class="w-5 h-5" /> 
                {{ item.name }} 
            </router-link> 
            </li> 
        </ul>

        <!-- 底部主题切换按钮 -->
        <div class="p-4 border-t border-base-300">
            <ThemeToggle />
        </div>
    </aside>
</template>

<script setup>
import ThemeToggle from './ThemeToggle.vue'
import { HomeIcon, ChartBarIcon, TrophyIcon, UsersIcon, PencilSquareIcon, CpuChipIcon } from '@heroicons/vue/24/outline'
const navItems = [
  { name: '首页', icon: HomeIcon, path:'/home'},
  { name: '学习记录', icon: ChartBarIcon, path:'/records' },
  { name: '排行榜', icon: TrophyIcon, path:'/rank' },
  { name: '在线自习室', icon: UsersIcon, path:'/studyroom' },
  { name: '个人博客', icon: PencilSquareIcon, path:'/blog' },
  { name: 'AI 评估', icon: CpuChipIcon, path:'/aieval'},
]

</script>