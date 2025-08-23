import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useTodoStore = defineStore('todo', () => {
  const tasks = ref([])

  // --- 初始化 ---
  const saved = localStorage.getItem('todos')
  if (saved) {
    tasks.value = JSON.parse(saved)
  }

  // --- 持久化 ---
  watch(
    tasks,
    (val) => {
      localStorage.setItem('todos', JSON.stringify(val))
    },
    { deep: true }
  )

  // --- 修改方法 ---
  const addTask = (title) => {
    tasks.value.push({ title, done: false })
  }
  const toggleTask = (index) => {
    tasks.value[index].done = !tasks.value[index].done
  }
  const removeTask = (index) => {
    tasks.value.splice(index, 1)
  }

  return { tasks, addTask, toggleTask, removeTask }
})
