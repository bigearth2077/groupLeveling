<template>
  <div class="min-h-screen flex bg-base-200">
    <!-- 左侧导航栏 -->
    <aside class="w-60 bg-base-100 shadow-lg flex flex-col">
      <h2 class="text-2xl font-bold text-primary p-4">自习系统</h2>
      <ul class="menu flex-1">
        <li v-for="item in navItems" :key="item.name" class="text-primary mb-3">
          <router-link
            :to="item.path"
            class="flex items-center gap-2 px-3 py-2 rounded-md transition-colors"
            :class="[
              $route.path === item.path
                ? 'bg-accent text-white'
                : 'text-primary hover:bg-primary hover:text-white'
            ]"
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

    <!-- 主体内容 -->
    <main class="flex flex-1 p-6 gap-6 overflow-y-auto">
      <div class="flex flex-col gap-6 flex-1">
        <StudyRoute />
        <PomodoroTimer />
      </div>
      <div class="flex-1">
        <TodoList />
      </div>
    </main>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useThemeStore } from '../../store/theme'
import ThemeToggle from '../../components/ThemeToggle.vue'
import StudyRoute from './StudyRoute.vue'
import TodoList from './TodoList.vue'
import PomodoroTimer from './PomodoroTimer.vue'
import { HomeIcon, ChartBarIcon, TrophyIcon, UsersIcon, PencilSquareIcon, CpuChipIcon } from '@heroicons/vue/24/outline'
import { useNavStore } from '../../store/nav'

const navStore = useNavStore()
const themeStore = useThemeStore()
/* 导航栏 */
const navItems = [
  { name: '首页', icon: HomeIcon, path:'/home'},
  { name: '学习记录', icon: ChartBarIcon, path:'/records' },
  { name: '排行榜', icon: TrophyIcon, path:'/rank' },
  { name: '在线自习室', icon: UsersIcon, path:'/studyroom' },
  { name: '个人博客', icon: PencilSquareIcon, path:'/blog' },
  { name: 'AI 评估', icon: CpuChipIcon, path:'/aieval'},
]

</script>
