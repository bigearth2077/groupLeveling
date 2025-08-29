<template>
  <div class="card bg-base-100 shadow-xl h-full w-full">
    <div class="card-body">
      <!-- <div class="mt-20">
      <p v-if="taskName" class="text-lg font-semibold text-center py-6">当前任务: {{ taskName }}</p>
      <p v-else class="text-lg text-gray-400 text-center py-6">暂无任务</p>
      </div> -->
      <div 
        :class="timerIsChanged ? 'text-accent' : 'text-primary'"
        class="text-9xl font-bold text-center py-6"
      >
        {{ minutes }}:{{ seconds }}
      </div>

      <progress
        class="progress progress-primary w-full mb-4"
        :value="progress"
        max="100"
      ></progress>

      <!-- 快捷时间（学习时长） -->
      <div class="flex gap-2 mb-3 justify-center">
        <button
          v-for="m in [15, 25, 50]"
          :key="m"
          @click="setDuration(m)"
          :disabled="isTicking"
          :class="['btn btn-sm', duration === m ? 'btn-primary' : 'btn-outline']"
        >
          {{ m }}min
        </button>
      </div>

      <div class="flex justify-center gap-4">
        <button @click="startTimer" class="btn btn-primary text-white">开始</button>
        <button @click="pauseTimer" class="btn btn-warning text-white">暂停</button>
        <!-- 结束按钮使用统一完成流程 -->
        <button @click="handleFinish" class="btn btn-accent text-white">结束</button>
      </div>

      <div class="flex items-center gap-4 mt-4">
        <label class="label cursor-pointer">
          <span class="label-text">自动休息</span>
          <input type="checkbox" v-model="autoBreak" class="toggle toggle-primary" />
        </label>

        <div v-if="autoBreak" class="flex gap-2">
          <button
            v-for="m in [5, 10, 15, 20]"
            :key="m"
            @click="setBreakDuration(m)"
            :disabled="isTicking && currentMode === 'rest'"
            :class="['btn text-white btn-xs', breakDuration === m ? 'btn-accent' : 'btn-primary']"
          >
            {{ m }}min
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted} from "vue"
import { post } from "../../utils/request"         // 你的 post 封装
import { eventBus } from "../../utils/eventBus"
import { useSound } from "../../composables/useSound"

const { playBeep } = useSound()

/** ---------------- 状态 ---------------- **/
const taskName = ref("")
const currentTask = ref(null)                 // 保存来自 TodoList 的原始 task 引用
const duration = ref(25)                      // 学习时长（分钟）
const breakDuration = ref(5)                  // 休息时长（分钟）
const autoBreak = ref(false)
const time = ref(duration.value * 60)         // 当前倒计时（秒）
const timer = ref(null)
const sessionId = ref(null)                   // 当前会话 ID（学习 或 休息）
const currentMode = ref("learning")           // "learning" | "rest"  
const isTicking = computed(() => !!timer.value)
const timerIsChanged = ref(false)
const minutes = computed(() =>
  String(Math.floor(time.value / 60)).padStart(2, "0")
)
const seconds = computed(() =>
  String(time.value % 60).padStart(2, "0")
)
const progress = computed(() => {
  const total = (currentMode.value === "rest" ? breakDuration.value : duration.value) * 60
  return ((total - time.value) / total) * 100
})

/** -------------- 事件绑定 -------------- **/
const handleStartTask = (task) => {
  // 来自 TodoList 的 task：保持同一引用，便于完成时直接修改
  currentTask.value = task
  taskName.value = task.title
  currentMode.value = "learning"      // 切回学习模式
  setDuration(task.duration || 25)    // 没设置则默认 25
}

onMounted(() => {
  eventBus.on("pomodoro:startTask", handleStartTask)
})
onUnmounted(() => {
  eventBus.off("pomodoro:startTask", handleStartTask)
})

/** -------------- 操作函数 -------------- **/
const setDuration = (m) => {
  // 只在学习模式下改变学习倒计时
  duration.value = m
  if (currentMode.value === "learning" && !isTicking.value) {
    time.value = m * 60
  }
}
const setBreakDuration = (m) => {
  breakDuration.value = m
  if (currentMode.value === "rest" && !isTicking.value) {
    time.value = m * 60
  }
}

const startTimer = async () => {
  if (timer.value) return

  if (currentMode.value === "learning") {
    // 学习开始
    try {
      const res = await post("/study/sessions/start", {
        type: "learning",
        startTime: new Date().toISOString(),
      })
      sessionId.value = res?.id || null
    } catch (err) {
      console.error("❌ 开始学习会话失败:", err)
      return
    }
    if (!time.value || time.value <= 0) time.value = duration.value * 60
  } else {
    // 休息开始（通常由 AutoBreak 触发，但也允许手动）
    try {
      const res = await post("/study/sessions/start", {
        type: "rest",
        startTime: new Date().toISOString(),
      })
      sessionId.value = res?.id || null
    } catch (err) {
      console.error("❌ 开始休息会话失败:", err)
      return
    }
    if (!time.value || time.value <= 0) time.value = breakDuration.value * 60
  }

  runCountdown()
}

const runCountdown = () => {
  timer.value = setInterval(() => {
    if (time.value > 0) {
      time.value--
    } else {
      handleFinish()
    }
  }, 1000)
}

const pauseTimer = () => {
  clearInterval(timer.value)
  timer.value = null
}

const endTimer = async () => {
  pauseTimer()
  if (!sessionId.value) {
    // 没有进行中的会话：仅复位当前模式下的计时显示
    time.value = (currentMode.value === "rest" ? breakDuration.value : duration.value) * 60
    return
  }
  try {
    await post(`/study/sessions/${sessionId.value}/end`, {
      endTime: new Date().toISOString(),
    })
  } catch (err) {
    console.error("❌ 结束会话失败:", err)
  } finally {
    sessionId.value = null
    // 复位当前模式显示时间
    time.value = (currentMode.value === "rest" ? breakDuration.value : duration.value) * 60
  }
}

/** ✅ 统一的结束/完成流程（倒计时为 0 或点击“结束”都会走这里） */
const handleFinish = async () => {
  playBeep()
  await endTimer()

  // 学习结束：标记 TodoList 完成 + 清空任务名
  if (currentMode.value === "learning") {
    if (currentTask.value) {
      eventBus.emit("pomodoro:finished", currentTask.value)
    }
    currentTask.value = null
    taskName.value = ""

    // 仅在学习结束时，根据开关进入休息
    if (autoBreak.value) {
      try {
        const res = await post("/study/sessions/start", {
          type: "rest",
          startTime: new Date().toISOString(),
        })
        sessionId.value = res?.id || null
        currentMode.value = "rest"

        time.value = breakDuration.value * 60
        runCountdown()
      } catch (err) {
        console.error("❌ 自动休息启动失败:", err)
      }
      return
    }

    // 未开启 AutoBreak：停留在学习模式待机
    currentMode.value = "learning"
    time.value = duration.value * 60
    return
  }

  // 休息结束：回到学习模式待机，不再继续休息
  if (currentMode.value === "rest") {
    currentMode.value = "learning"
    time.value = duration.value * 60
  }
}
</script>
