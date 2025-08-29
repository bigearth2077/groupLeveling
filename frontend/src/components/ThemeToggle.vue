<template>
  <button class="btn btn-sm btn-outline w-6 h-6 bg-primary text-white hover:bg-accent hover:border-accent" @click="themeStore.toggleTheme">
    {{ themeLabel }}
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '../store/theme'

const themeStore = useThemeStore()

const themeLabel = computed(() => {
  if (themeStore.theme === 'lemonade') {
    return '🍋'
  } else {
    return '☕'
  }
})
</script>
