<template>
  <div class="inline-block relative">
    <!-- 隐藏的 span 用来计算宽度 -->
    <span ref="mirror" class="absolute invisible whitespace-pre"></span>

    <!-- 输入框 -->
    <input
      v-model="localValue"
      @input="updateWidth"
      class="input input-sm border-b border-gray-300 focus:outline-none focus:border-primary"
      :style="{ width: mirrorWidth + 'px' }"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
})
const emit = defineEmits(['update:modelValue'])

const mirror = ref(null)
const mirrorWidth = ref(40) // 默认宽度
const localValue = ref(props.modelValue)

const updateWidth = () => {
  mirror.value.textContent = localValue.value || ' '
  mirrorWidth.value = mirror.value.offsetWidth + 20
  emit('update:modelValue', localValue.value)
}

// 监听父组件传进来的值（例如外部修改了 task.title）
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
  updateWidth()
})

onMounted(() => {
  updateWidth()
})
</script>
