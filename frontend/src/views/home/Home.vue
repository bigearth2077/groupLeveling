<template>
  <div class="min-h-screen flex bg-base-200">
    <AvatarDropdown class="z-30 ml-auto"/>
    <!-- 背景层（番茄钟全屏） -->
    <PomodoroTimer class="absolute inset-0 w-full h-full pl-32 z-10" />
    <NavBar class="z-20"/>
    <!-- 主体内容 -->
      <!-- 浮层控制按钮 -->
      <!-- <div class="absolute top-4 right-4 flex gap-2 z-20">
        <button class="btn btn-primary btn-sm" @click="toggle('study')">
          学习路线
        </button>
        <button class="btn btn-accent btn-sm" @click="toggle('todo')">
          待办清单
        </button>
      </div> -->

      <!-- 学习路线浮层 -->
      <!-- <div
        v-if="showStudy"
        class="absolute flex items-center justify-center z-10 bg-base-200"
      >
        <div class="card w-96 bg-base-100">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title">学习路线</h2>
              <button class="btn btn-sm btn-error" @click="toggle('study')">关闭</button>
            </div>
            <StudyRoute />
          </div>
        </div>
      </div> -->

      <!-- 待办清单浮层 -->
      <!-- <div
        v-if="showTodo"
        class="absolute flex items-center justify-center z-10 bg-base-200 "
      >
        <div class="card w-96 bg-base-100">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title">待办清单</h2>
              <button class="btn btn-sm btn-error" @click="toggle('todo')">关闭</button>
            </div>
            <TodoList />
          </div>
        </div>
      </div> -->
  </div>
</template>

<script setup>
import AvatarDropdown from '../../components/AvatarDropdown.vue';
import { ref, computed } from 'vue'
import { useThemeStore } from '../../store/theme'
import ThemeToggle from '../../components/ThemeToggle.vue'
import StudyRoute from './StudyRoute.vue'
import TodoList from './TodoList.vue'
import PomodoroTimer from './PomodoroTimer.vue'
import NavBar from '../../components/NavBar.vue'
import { HomeIcon, ChartBarIcon, TrophyIcon, UsersIcon, PencilSquareIcon, CpuChipIcon } from '@heroicons/vue/24/outline'
import { useNavStore } from '../../store/nav'

const showStudy = ref(false)
const showTodo = ref(false)

const toggle = (type) => {
  if (type === "study") showStudy.value = !showStudy.value
  if (type === "todo") showTodo.value = !showTodo.value
}


</script>
