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
import * as echarts from "echarts";
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";

 // ----------- 1. 状态管理 (State Management) -----------
const monthlyRef = ref(null);
const weeklyRef = ref(null);
const dailyRef = ref(null);
const pieRef = ref(null);
const chart1Type = ref("quarter");

const monthlyApiData = ref(null);
const weeklyApiData = ref(null);
const dailyApiData = ref(null);

// ----------- 2. 数据获取 (Data Fetching) -----------
async function fetchMonthlyData(type) {
  console.log(`获取[${type}]数据...`);
  monthlyApiData.value = {
    labels: type === 'quarter' ? ['第一季度', '第二季度', '第三季度', '第四季度'] : ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],     
    values: type === 'quarter' ? [120, 150, 200, 180] : [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130]
  };
}

async function fetchWeeklyData() {
  weeklyApiData.value = {
    "totalMinutes": 1240,
    "daily": [
      { "date": "2025-08-17", "minutes": 180 }, { "date": "2025-08-18", "minutes": 240 },
      { "date": "2025-08-19", "minutes": 300 }, { "date": "2025-08-20", "minutes": 150 },
      { "date": "2025-08-21", "minutes": 220 }, { "date": "2025-08-22", "minutes": 180 },
    ]
  };
}

async function fetchDailyData() {
  // TODO: 待后端接口完成后，替换为真实API调用
  // const response = await api.getDailyStats({ date: 'today' });
  // dailyApiData.value = response.data;
  dailyApiData.value = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    values: [0,0,0,0,0,0,0,15,45,60,60,30,10,0,0,0,25,55,60,30,0,0,0,0]
  };
}

// ----------- 3. 数据处理与图表配置 (Computed Options) -----------
const monthlyChartOption = computed(() => {
  if (!monthlyApiData.value) return { title: { text: '加载中...' } };
  const { labels, values } = monthlyApiData.value;
  return {
    title: { text: chart1Type.value === 'quarter' ? '季度学习时间' : '年度学习时间', left: 'center' },
    tooltip: { trigger: "axis", formatter: params => `${params[0].axisValue}: ${formatMinutesToHourMinute(params[0].data * 60)}` },
    xAxis: { type: "category", data: labels },
    yAxis: { type: "value", name: "学习时间", axisLabel: { formatter: (val) => `${val}小时` } },
    series: [{ data: values, type: "line", smooth: true, areaStyle: {} }],
    grid: { left: 60, right: 20, top: 40, bottom: 30 }
  };
});

const weeklyChartOption = computed(() => {
  if (!weeklyApiData.value) return { title: { text: '加载中...' } };
  const labels = weeklyApiData.value.daily.map(d => d.date);
  const values = weeklyApiData.value.daily.map(d => d.minutes);
  return {
    title: {text:''},
    tooltip: { formatter: params => `${params.name}: ${formatMinutesToHourMinute(params.data)}` },
    xAxis: { type: "category", data: labels },
    yAxis: { type: "value", name: "学习时间(分钟)" },
    series: [{ data: values, type: "bar", itemStyle: { color: "#4bc0c0", borderRadius: [6, 6, 0, 0] } }],
    grid: { left: 60, right: 20, top: 40, bottom: 30 }
  };
});

const dailyChartOption = computed(() => {
    if (!dailyApiData.value) return { title: { text: '加载中...' } };
    const { labels, values } = dailyApiData.value;
    return {
        title: {text:''},
        tooltip: { formatter: params => `${params.name}: ${params.data}分钟` },
        xAxis: { type: 'category', data: labels, axisLabel: { interval: 5 } },
        yAxis: { type: 'value', name: '分钟' },
        series: [{ data: values, type: 'bar', barWidth: 14, itemStyle: { color: "#9966ff", borderRadius: [4, 4, 4, 4] } }],
        grid: { left: 50, right: 20, top: 40, bottom: 30 }
    }
});
const pieChartOption = computed(() => {
    if (!dailyApiData.value) return { title: { text: '加载中...' } };
    const totalMinutes = dailyApiData.value.values.reduce((a, b) => a + b , 0);
    const restTotalMinutes = 24 * 60 - totalMinutes;
    return {
        title: {text:''},
        tooltip: { trigger: "item", formatter: ({ name, value }) => `${name}: ${formatMinutesToHourMinute(value)}` },
        legend: { orient: "vertical", left: "left" },
        series: [{
            name: "今日学习占比", type: "pie", radius: "70%",
            data: [ { value: totalMinutes, name: "学习时间" }, { value: restTotalMinutes, name: "未学习时间" } ]
        }]
    };
});

// ----------- 4. 渲染与响应 (Renderer) -----------
function useChart(chartRef, option) {
  let chartInstance = null;
  const render = () => {
    if (!chartRef.value) return;
    if (!chartInstance) chartInstance = echarts.init(chartRef.value);
    chartInstance.setOption(option.value);
  };
  const resize = () => chartInstance?.resize();
  watch(option, render, { deep: true });
  onMounted(render);
  return { resize };
}
const { resize: monthlyResize } = useChart(monthlyRef, monthlyChartOption);
const { resize: weeklyResize } = useChart(weeklyRef, weeklyChartOption);
const { resize: dailyResize } = useChart(dailyRef, dailyChartOption);
const { resize: pieResize } = useChart(pieRef, pieChartOption);

// ----------- 5. 生命周期与事件处理 (Lifecycle & Events) -----------
const handleResize = () => {
  monthlyResize(); weeklyResize(); dailyResize(); pieResize();
};

onMounted(() => {
  fetchMonthlyData(chart1Type.value);
  fetchWeeklyData();
  fetchDailyData();
  window.addEventListener("resize", handleResize);
});

watch(chart1Type, (newType) => {
  fetchMonthlyData(newType);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

// ----------- 辅助函数 (Utils) -----------
function formatMinutesToHourMinute(value) {
  if (value === undefined || value === null) return "";
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return `${hours}小时${minutes.toString().padStart(2, "0")}分钟`;
}
</script>
