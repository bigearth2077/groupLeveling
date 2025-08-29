<template>
  <div class="card bg-base-100 shadow-xl h-full w-full">
    <div class="card-body flex flex-col items-center">
      
      <!-- 模式切换按钮 -->
      <div class="flex gap-4 justify-center mb-4">
        <button 
          v-for="mode in ['learning','shortbreak','longbreak']"
          :key="mode"
          @click="switchMode(mode)"
          :class="['btn', currentMode===mode ? 'btn-primary' : 'btn-outline']"
        >
          {{ modeLabel(mode) }}
        </button>
      </div>

      <!-- 学习时间选择区域，始终渲染，隐藏非学习模式按钮 -->
      <div class="flex gap-2 justify-center mb-4 h-10">
        <button 
          v-for="t in learningTimes" 
          :key="t" 
          @click="selectLearningTime(t)"
          :class="[
            'btn',
            duration===t ? 'btn-primary' : 'btn-outline',
            currentMode==='learning' ? '' : 'invisible'
          ]"
        >
          {{ t }} 分钟
        </button>
      </div>

      <!-- 倒计时显示 -->
      <div class="text-huge font-bold text-center py-6 text-primary">
        {{ minutes }}:{{ seconds }}
      </div>

      <!-- 进度条 -->
      <progress
        class="progress progress-primary w-full mb-4"
        :value="progress"
        max="100"
      ></progress>

      <!-- 开始/暂停/结束按钮组 -->
      <div class="flex justify-center gap-4">
        <button
          v-if="!isRunning"
          @click="startTimer"
          class="btn btn-primary text-white"
        >
          开始
        </button>
        <button
          v-else
          @click="pauseTimer"
          class="btn btn-warning text-white"
        >
          暂停
        </button>
        <button @click="handleFinish" class="btn btn-accent text-white">
          结束
        </button>
      </div>

    </div>
  </div>
</template>


<script setup>
import { ref, computed } from "vue"
import { post } from "../../utils/request"
import { del } from "../../utils/request"
import { useSound } from "../../composables/useSound"

const { playBeep } = useSound()

/** ---------------- 状态 ---------------- **/
const duration = ref(25)              // 学习时长（分钟）
const time = ref(duration.value * 60) // 当前倒计时（秒）
const timer = ref(null)               // 定时器引用
const sessionId = ref(null)           // 当前会话 ID
const currentMode = ref("learning")   // 当前模式：学习/休息
const elapsedSeconds = ref(0)         // 真实学习累计时间（秒）

// 可选时间列表
const learningTimes = [15, 25, 50]
const breakTimes = {
  shortbreak: 5,
  longbreak: 10
}
// 判断计时器是否运行
const isRunning = computed(() => !!timer.value)

// 计算分钟和秒
const minutes = computed(() =>
  String(Math.floor(time.value / 60)).padStart(2, "0")
)
const seconds = computed(() =>
  String(time.value % 60).padStart(2, "0")
)

// 进度条
const progress = computed(() => {
  const total = duration.value * 60
  return ((total - time.value) / total) * 100
})
//切换模式
const switchMode = async (mode) => {
  pauseTimer()
  await cancelActiveSession()
  currentMode.value = mode
  if (mode === "learning") duration.value = 25
    else duration.value = breakTimes[mode] || 5

    time.value = duration.value * 60
    elapsedSeconds.value = 0
    sessionId.value = null
}
//时间选择
const selectLearningTime = (minutes) => {
  duration.value = minutes
  time.value = minutes * 60
  elapsedSeconds.value = 0
  pauseTimer()
  sessionId.value = null
}

const modeLabel = (mode) => {
  switch(mode) {
    case 'learning':
      return '学习'
    case 'shortbreak':
      return '短休息'
    case 'longbreak':
      return '长休息'
    default:
      return mode
  }
}


/** ---------------- 功能函数 ---------------- **/

// 启动计时器
const startTimer = async () => {
  if (!sessionId.value) {
    // 如果没有会话ID，则先创建会话
    try {
      const res = await post("/study/sessions/start", {
        type: currentMode.value=== "learning" ? "learning" : "rest",
        startTime: new Date().toISOString(),
      })
      sessionId.value = res?.id || null
    } catch (err) {
      console.error("❌ 开始学习会话失败:", err)
      return
    }
  }

  runCountdown()
}

// 倒计时逻辑
let lastTick = null
const runCountdown = () => {
  if (timer.value) return // 已经在计时
  lastTick = Date.now()
  timer.value = setInterval(() => {
    const now = Date.now()
    const delta = Math.floor((now - lastTick) / 1000)
    if (delta >= 1) {
      lastTick = now
      if (time.value > 0) {
        time.value--
        elapsedSeconds.value++
      } else {
        handleFinish()
      }
    }
  }, 250) // 每 250ms 检查一次
}

// 暂停计时器
const pauseTimer = () => {
  clearInterval(timer.value)
  timer.value = null
}

// 结束计时器
const endTimer = async () => {
  pauseTimer()

  if (!sessionId.value) {
    // 没有会话ID，直接复位
    time.value = duration.value * 60
    elapsedSeconds.value = 0
    return
  }

  try {
    await post(`/study/sessions/${sessionId.value}/end`, {
      endTime: new Date().toISOString(),
      durationMinutes: Math.floor(elapsedSeconds.value / 60),
    })
  } catch (err) {
    console.error("❌ 结束会话失败:", err)
  } finally {
    sessionId.value = null
    time.value = duration.value * 60
    elapsedSeconds.value = 0
  }
}

const cancelActiveSession = async () => {
  try {
    const token = localStorage.getItem('token')  // 或从 store 获取 token

    const res = await del("/study/sessions/active", null, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    if (res.data?.ok) {
      console.log("✅ 当前进行中的会话已取消")
    }
  } catch (err) {
    console.error("❌ 取消会话失败:", err)
  } finally {
    // 前端清理状态
    pauseTimer()
    sessionId.value = null
    time.value = duration.value * 60
    elapsedSeconds.value = 0
  }
}


// 统一结束流程
const handleFinish = async () => {
  playBeep()
  await endTimer()
}
</script>
