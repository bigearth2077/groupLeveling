import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useNavStore = defineStore('nav', () => {
  const activeItem = ref(localStorage.getItem('activeItem') || '首页')

  const setActiveItem = (item) => {
    activeItem.value = item
  }

  // 自动保存到 localStorage
  watch(activeItem, (val) => {
    localStorage.setItem('activeItem', val)
  })

  return {
    activeItem,
    setActiveItem,
  }
})
