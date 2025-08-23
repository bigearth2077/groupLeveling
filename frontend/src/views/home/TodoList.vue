<template>
  <div class="card bg-base-100 shadow-xl h-full">
    <div class="card-body">
      <h3 class="card-title">TodoList</h3>
      <div class="flex gap-2 mb-4">
        <input
          v-model="newTask"
          type="text"
          placeholder="输入任务..."
          class="input input-bordered flex-1 w-96"
        />
        <button @click="addTask" class="btn btn-primary text-white">添加</button>
      </div>
        <ul class="space-y-2">
          <li
            v-for="(task, index) in tasks"
            :key="index"
            class="group flex justify-between items-center p-2 border-b border-base-300"
          >
            <!-- 左侧：任务名 -->
            <div class="flex items-center gap-2">
              <span
                :class="{ 'line-through text-gray-400': task.done }"
                class="cursor-pointer"
                @click="sendToPomodoro(task)"
              >
                {{ task.title }}
              </span>
            </div>

            <!-- 右侧：按钮组 -->
            <div class="hidden group-hover:flex items-center gap-2">
              <button @click="removeTask(index)" class="btn btn-xs btn-error">
                删除
              </button>
              <button
                v-for="m in [5, 15, 25]"
                :key="m"
                @click="setTaskDuration(task, m)"
                :class="[
                  'btn btn-xs',
                  task.duration === m ? 'btn-primary' : 'btn-success'
                ]"
              >
                {{ m }}min
              </button>
              <button
                @click="toggleDone(index)"
                class="btn btn-xs btn-secondary"
              >
                {{ task.done ? "取消" : "完成" }}
              </button>
            </div>
          </li>
        </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { eventBus } from "../../utils/eventBus"
import { useTodoStore } from "../../store/todo"   // 引入 Pinia store


/* State */
const newTask = ref("")
const todoStore = useTodoStore()
const tasks = todoStore.tasks   // 响应式引用（Pinia 内部已持久化）

onMounted(() => {
  eventBus.on("pomodoro:finished", handleTaskFinished)
})

onUnmounted(() => {
  eventBus.off("pomodoro:finished", handleTaskFinished)
})

/* ✅ Pomodoro 完成 → 更新对应任务 */
const handleTaskFinished = (task) => {
  task.done = true
}

/* ✅ 添加任务 */
const addTask = () => {
  if (newTask.value.trim() !== "") {
    todoStore.addTask(newTask.value.trim())  // 用 store 方法
    newTask.value = ""
  }
}

/* ✅ 删除任务 */
const removeTask = (index) => {
  todoStore.removeTask(index)
}

/* ✅ 切换完成状态 */
const toggleDone = (index) => {
  todoStore.toggleTask(index)
}

/* ✅ 设置任务时长（直接修改对象属性，Pinia + watch 会保存） */
const setTaskDuration = (task, minutes) => {
  task.duration = minutes
}
/* 点击任务 → 发给番茄钟 */
const sendToPomodoro = (task) => {
  if (task.done) {
    alert("任务已完成")
    return
  }
    if (!task.duration) {
    task.duration = 25
    return
  }
  // 🛠 FIX 2：直接传 task 引用，保证一致
  eventBus.emit("pomodoro:startTask", task)
}
</script>

