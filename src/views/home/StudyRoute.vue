<template>
  <div class="card bg-base-100 shadow-xl">
    <!-- 标题和按钮 -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="card-title p-6">RoadMap</h3>
      <div class="dropdown dropdown-end">
        <!-- <label tabindex="0" class="btn btn-sm btn-primary m-1">新建路线</label>
        <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40">
          <li><a @click="createRoute('day')">日学习路线</a></li>
          <li><a @click="createRoute('week')">周学习路线</a></li>
          <li><a @click="createRoute('month')">月学习路线</a></li>
          <li><a @click="createRoute('custom')">自定义</a></li>
        </ul> -->
      </div>
    </div>

    <ul class="timeline timeline-horizontal">
    <li v-for="(task, index) in tasks" :key="index">
      <!-- 左边的连线 -->
      <hr
        v-show="index !== 0"
        @click="insertTask(index)"
        class="cursor-pointer tooltip h-full w-px transition-colors duration-500"
        :class="task.done ? 'bg-green-500' : 'bg-gray-400'"
        data-tip="点击添加节点"
      />
      <div v-if="index % 2 === 0" class="timeline-start">
         <button class="btn btn-ghost btn-xs text-base-300" @click="removeTask(index)">
            <TrashIcon class="w-4 h-4" />
          </button>
      </div>
      <div v-else class="timeline-end">
        <button class="btn btn-ghost btn-xs text-base-300" @click="removeTask(index)">
            <TrashIcon class="w-4 h-4" />
        </button>
      </div>
      <!-- 节点按钮 -->
      <div class="timeline-middle">
        <button
          class="btn btn-circle btn-xs transition-colors duration-300"
          :class="task.done ? 'btn-success' : 'btn-outline'"
          @click="toggleTaskDone(index)"
        >
          ✓
        </button>
      </div>

      <!-- 节点内容 -->
      <div v-if="index % 2 === 0" class="timeline-end">
        <div class="flex items-center gap-2">
          <AutoResizeInput v-model="task.title"/>
        </div>
      </div>
      <div v-else class="timeline-start">
        <div class="flex items-center gap-2">
          <AutoResizeInput v-model="task.title"/>
        </div>
      </div>

      <!-- 右边的连线（保持灰色，等待下一个任务完成时变绿） -->
      <hr
        v-if="index !== tasks.length - 1"
        class="w-px flex-1 transition-colors duration-500 cursor-pointer"
        :class="tasks[index + 1]?.done ? 'bg-green-500' : 'bg-gray-400'"
        @click="insertTask(index + 1)"
      />
    </li>
  </ul>
    <!-- 添加节点按钮 -->
    <!-- <div class="flex justify-center mt-4">
      <button v-show="tasks.length === 0 || tasks.length === 1 " class="btn btn-outline btn-sm" @click="addTask">+ 添加任务</button>
    </div> -->
    <div class="flex justify-center items-center gap-2 mt-4" v-show="tasks.length === 0 || tasks.length === 1">
      <input
        v-model="newTaskTitle"
        type="text"
        placeholder="请输入学习任务"
        class="input input-sm input-bordered w-64"
        @keyup.enter="addTask"
      />
      <button
        class="btn btn-outline btn-sm"
        @click="addTask"
      >
        + 添加任务
      </button>
    </div>

  </div>
</template>

<script setup>
import AutoResizeInput from '../../components/AutoResizeInput.vue'
import { ref,watch  } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
const tasks = ref([
  { title: '开始学习', done: false },
  { title: '完成练习项目', done: false },
  { title: '结束学习', done: false }
])

// // 新建学习路线
// const createRoute = (type) => {
//   console.log('创建学习路线:', type)
//   tasks.value = [] // 清空并开始新路线
// }

// 添加任务
// const addTask = () => {
//   const title = prompt('请输入学习任务')
//   if (title) {
//     tasks.value.push({ title, done: false })
//   }
// }
const newTaskTitle = ref('')
const addTask = () => {
  if (!newTaskTitle.value.trim()) return
  tasks.value.push({ title: newTaskTitle.value.trim(), done: false })
  newTaskTitle.value = '' // 清空输入框
}

// 编辑任务
const editTask = (index) => {
  const newTitle = prompt('修改任务内容', tasks.value[index].title)
  if (newTitle !== null) {
    tasks.value[index].title = newTitle
  }
}

// 切换完成状态
const toggleTaskDone = (index) => {
  tasks.value[index].done = !tasks.value[index].done
}

const insertTask = (index) => {
  tasks.value.splice(index, 0, {
    title: '新任务',
    time: null,
    done: false
  })
}
const removeTask = (index) => {
  tasks.value.splice(index, 1)
}


// const text = ref('')
const mirror = ref(null)
const mirrorWidth = ref(40) // 默认宽度
// watch(tasks.value.title, (val) => {
//   mirror.value.textContent = val || ' ' // 避免空内容时宽度为 0
//   mirrorWidth.value = mirror.value.offsetWidth + 20 // 加点 padding
// })
watch(tasks, (newTasks) => {
  // 这里可以对最后一个任务的 title 进行处理
  const last = newTasks[newTasks.length - 1]
  if (last && mirror.value) {
    mirror.value.textContent = last.title || ' '
    mirrorWidth.value = mirror.value.offsetWidth + 20
  }
}, { deep: true })
</script>
