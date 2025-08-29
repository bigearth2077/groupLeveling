<template>
    <!-- 右侧 学习记录表格 -->
      <div class="w-1/2 bg-base-100 shadow-md rounded-lg p-4 flex flex-col">
        <h2 class="text-lg font-bold mb-4">📑 学习记录表格</h2>
        <!-- 表格内容 -->
        <div class="overflow-x-auto flex-1">
          <table class="table table-zebra w-full">
            <thead>
              <tr>
                <th>#</th>
                <th>类型</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th>时长(min)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in sessions" :key="item.id">
                <th>{{ (page - 1) * pageSize + index + 1 }}</th>
                <td>
                  <span
                    :class="item.type === 'learning' ? 'text-primary' : 'text-accent'"
                  >
                    {{ item.type === 'learning' ? '学习' : '休息' }}
                  </span>
                </td>
                <td>{{ formatDate(item.startTime) }}</td>
                <td>{{ formatDate(item.endTime) }}</td>
                <td>{{ item.durationMinutes }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页控制区（底部固定） -->
        <div class="flex items-center justify-between mt-4">
          <!-- 总记录数 -->
          <div class="text-sm text-gray-500">
            共 <span class="font-bold">{{ total }}</span> 条记录
          </div>

          <!-- 每页条数选择 -->
          <div class="flex items-center gap-2">
            <label class="text-sm">每页</label>
            <select
              v-model.number="pageSize"
              @change="changePageSize"
              class="select select-bordered select-sm"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
            </select>
            <span class="text-sm">条</span>
          </div>

          <!-- 分页按钮 -->
          <div class="join">
            <button
              class="join-item btn btn-sm"
              :disabled="page === 1"
              @click="changePage(page - 1)"
            >
              «
            </button>
            <button class="join-item btn btn-sm">
              第 {{ page }} / {{ totalPages }} 页
            </button>
            <button
              class="join-item btn btn-sm"
              :disabled="page === totalPages"
              @click="changePage(page + 1)"
            >
              »
            </button>
          </div>
        </div>
      </div>
</template>

<script setup>
import { get } from '../../utils/request'
import { ref, onMounted, computed } from 'vue'

// 学习会话数据
const sessions = ref([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 总页数
const totalPages = computed(() =>
  Math.ceil(total.value / pageSize.value) || 1
)

// 拉取后端接口数据
const fetchSessions = async () => {
  try {
    const res = await get('/study/sessions', {
      page: page.value,
      pageSize: pageSize.value,
    })
    sessions.value = res?.items || []
    total.value = res?.total || 0
  } catch (err) {
    console.error('❌ 获取学习记录失败:', err)
  }
}

// 切换页码
const changePage = (newPage) => {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
  fetchSessions()
}

// 修改 pageSize
const changePageSize = () => {
  page.value = 1 // 重置到第一页
  fetchSessions()
}

// 时间格式化函数
const formatDate = (isoString) => {
  if (!isoString) return '-'
  const date = new Date(isoString)
  return date.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 页面加载时获取数据
onMounted(() => {
  fetchSessions()
})

</script>