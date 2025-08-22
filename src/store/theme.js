// src/stores/theme.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('theme') || 'lemonade')

  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('theme', t)
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'lemonade' ? 'coffee' : 'lemonade'
    applyTheme(theme.value)
  }

  return { theme, toggleTheme, applyTheme }
})
