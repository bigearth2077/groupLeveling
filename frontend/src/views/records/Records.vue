<template>
  <div class="min-h-screen flex bg-base-200">
    <!-- 左侧导航栏 -->
    <AvatarDropdown class="absolute z-30 right-0 -top-4"/>
    <NavBar />
    <!-- 页面主体 -->
    <main class="flex-1 p-6 py-2 flex gap-8 ml-32">
      
      <!-- 左侧 学习统计 -->
        <studyCharts/>
      <!-- 右侧 学习记录表格 -->
        <studyRecords/>
      
    </main>
  </div>
</template>

<script setup>
import AvatarDropdown from '../../components/AvatarDropdown.vue';
import NavBar from '../../components/NavBar.vue'
import StudyRecords from './StudyRecords.vue'
import StudyCharts from '../../components/StudyCharts.vue'
</script>
