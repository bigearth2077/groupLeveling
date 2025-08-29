<template>
<div
  class=
    "fixed 
    margin
    rounded-box 
    left-0 
    top-1/2 
    -translate-y-1/2 
    w-20
    ml-4
    bg-base-100 
    shadow-lg 
    flex flex-col items-center py-4"
>
  <ul class="menu flex-1 space-y-4">
    <li
      v-for="item in navItems"
      :key="item.name"
      class="text-primary flex justify-center"
    >
    <router-link
        :to="item.path"
        class="btn btn-ghost btn-circle tooltip tooltip-right flex justify-center items-center"
        :data-tip="item.name"
        :class="[
            $route.path === item.path
            ? 'bg-accent text-white'
            : 'text-primary hover:bg-primary hover:text-white'
        ]"
        >
        <component :is="item.icon" class="w-6 h-6" />
    </router-link>

    </li>
  </ul>

  <!-- 底部主题切换按钮 -->
  <div class="p-4 border-t border-base-300">
    <ThemeToggle />
  </div>
</div>

</template>

<script setup>
import ThemeToggle from './ThemeToggle.vue'
import {
  HomeIcon,
  ChartBarIcon,
  TrophyIcon,
  UsersIcon,
  PencilSquareIcon,
  CpuChipIcon,
} from '@heroicons/vue/24/outline'

const navItems = [
  { name: '首页', icon: HomeIcon, path: '/home' },
  { name: '学习记录', icon: ChartBarIcon, path: '/records' },
  { name: '排行榜', icon: TrophyIcon, path: '/rank' },
  { name: '在线自习室', icon: UsersIcon, path: '/studyroom' },
  { name: '个人博客', icon: PencilSquareIcon, path: '/blog' },
  { name: 'AI 评估', icon: CpuChipIcon, path: '/aieval' }
]
</script>
