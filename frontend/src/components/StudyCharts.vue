<template>
  <div class="grid grid-cols-1 gap-2 w-full">
    <!-- 图表一：月学习时间 -->
    <div class="card bg-base-100 shadow-md">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-bold p-2">📈 月学习时间</h2>
        <div class="join p-2">
          <button
            class="btn btn-xs join-item"
            :class="{ 'btn-primary': chart1Type === 'quarter' }"
            @click="chart1Type = 'quarter'"
          >
            季度
          </button>
          <button
            class="btn btn-xs join-item"
            :class="{ 'btn-primary': chart1Type === 'year' }"
            @click="chart1Type = 'year'"
          >
            年度
          </button>
        </div>
      </div>
      <div ref="monthlyRef" class="w-full h-64"></div>
    </div>

    <!-- 图表二：周学习时间 -->
    <div class="card bg-base-100 shadow-md">
      <h2 class="text-lg font-bold">📊 周学习时间</h2>
      <div ref="weeklyRef" class="w-full h-64"></div>
    </div>

    <!-- 图表三：今日学习时间 -->
    <div class="card bg-base-100 shadow-md">
      <h2 class="text-lg font-bold">⏳ 今日学习时间</h2>
      <div class="grid grid-cols-2 gap-4">
        <!-- 左：柱状图 -->
        <div ref="dailyRef" class="w-full h-64"></div>
        <!-- 右：饼图 -->
        <div ref="pieRef" class="w-full h-64"></div>
      </div>
    </div>

  </div>
</template>

<script setup>
import * as echarts from "echarts"
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import {
  quarterMonths,
  quarterData,
  yearMonths,
  yearData,
  weekDays,
  weekData,
  hours,
  todayData,
} from "../mock/fakeData"

const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--p')
  .trim()

const accentColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--a')
  .trim()

// 转换成 hsl(var(--p)) 格式
const primary = `hsl(${primaryColor})`
const accent = `hsl(${accentColor})`

// DOM 引用
const monthlyRef = ref(null)
const weeklyRef = ref(null)
const dailyRef = ref(null)
const pieRef = ref(null)

// ECharts 实例
let monthlyChart = null
let weeklyChart = null
let dailyChart = null
let pieChart = null

// 图表一切换类型（quarter / year）
const chart1Type = ref("quarter")

// 工具函数：分钟转 "xx小时xx分钟"
function formatMinutesToHourMinute(value) {
  const hours = Math.floor(value / 60)
  const minutes = Math.round(value % 60)
  return `${hours}小时${minutes.toString().padStart(2, "0")}分钟`
}


// 图表一（月/季度/年度学习时间）
const renderMonthlyChart = () => {
  if (!monthlyChart) monthlyChart = echarts.init(monthlyRef.value)

  const data = chart1Type.value === "quarter" ? quarterData : yearData
  const labels = chart1Type.value === "quarter" ? quarterMonths : yearMonths
  const color = chart1Type.value === "quarter" ? "#36a2eb" : "#ff6384"


  monthlyChart.setOption({
    tooltip: {
      trigger: "axis",
      formatter: (params) =>
        params
          .map(p => `${p.axisValue}: ${formatMinutesToHourMinute(p.data * 60)}`)
          .join("<br/>"),
    },
    xAxis: { type: "category", data: labels },
    yAxis: {
      type: "value",
      name: "学习时间",
      splitLine: { lineStyle: { type: "dashed" } },
      axisLabel: {
        formatter: (val) => `${val}小时`
      },
    },
    series: [
      {
        data: data, // 转小时
        type: "line",
        smooth: true,
        areaStyle: {},
        lineStyle: { color },
      },
    ],
  })
}

// 图表二（周学习时间，小时）
const renderWeeklyChart = () => {
  if (!weeklyChart) weeklyChart = echarts.init(weeklyRef.value)
  weeklyChart.setOption({
    tooltip: {
      formatter: (params) => `${params.name}: ${formatMinutesToHourMinute(params.data * 60)}`,
    },
    xAxis: { type: "category", data: weekDays },
    yAxis: {
      type: "value",
      name: "学习时间",
      splitLine: { lineStyle: { type: "dashed" } }
    },
    series: [
      {
        data: weekData,
        type: "bar",
        itemStyle: {
          color: "#4bc0c0",
          borderRadius: [6, 6, 0, 0],
        },
      },
    ],
  })
}

// 图表三（今日学习时间，分钟）
const renderDailyChart = () => {
  if (!dailyChart) dailyChart = echarts.init(dailyRef.value)
  dailyChart.setOption({
    tooltip: {
      formatter: (params) => `${params.name}: ${params.data}分钟`,
    },
    xAxis: { type: "category", data: hours },
    yAxis: {
      type: "value",
      name: "学习时间",
      splitLine: { lineStyle: { type: "dashed" } },
    },
    series: [
      {
        data: todayData,
        type: "bar",
        itemStyle: { 
          color: "#9966ff",
          borderRadius: [6, 6, 6, 6] // 左上、右上、右下、左下
         },
        barWidth: 14,
      },
    ],
  })
}

const renderPieChart = () => {
  if (!pieChart) pieChart = echarts.init(pieRef.value)

  // 计算学习总时长（分钟）
const totalMinutes = todayData.reduce((a, b) => a + b, 0)

// 学习时间
const studyHours = Math.floor(totalMinutes / 60)
const studyMinutes = totalMinutes % 60

// 剩余时间
const restTotalMinutes = 24 * 60 - totalMinutes
const restHours = Math.floor(restTotalMinutes / 60)
const restMinutes = restTotalMinutes % 60

  const option = {
    tooltip: {
      trigger: "item",
      formatter: ({ name, value }) => `${name}: ${formatMinutesToHourMinute(value)}`
    },
    legend: {
      orient: "vertical",
      left: "left",
      data: ["学习时间", "未学习时间"]
    },
    series: [
      {
        name: "今日学习占比",
        type: "pie",
        radius: "70%",
        data: [
          { value: totalMinutes, name: "学习时间" },
          { value: restTotalMinutes, name: "未学习时间" }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)"
          }
        }
      }
    ]
  }

  pieChart.setOption(option)
}

// 初始化 & 监听窗口大小变化
const handleResize = () => {
  monthlyChart?.resize()
  weeklyChart?.resize()
  dailyChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  renderMonthlyChart()
  renderWeeklyChart()
  renderDailyChart()
  renderPieChart()
  window.addEventListener("resize", handleResize)
})

watch(chart1Type, () => {
  renderMonthlyChart()
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize)
})
</script>
