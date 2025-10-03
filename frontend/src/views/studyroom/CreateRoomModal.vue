<template>
  <dialog ref="modalRef" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">创建新房间</h3>
      
      <div class="py-4 space-y-4">
        <!-- 房间名称输入框 -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">房间名称</span>
          </label>
          <input 
            v-model="roomName"
            type="text" 
            placeholder="起一个响亮的名字吧" 
            class="input input-bordered w-full" 
            @keyup.enter="handleCreateRoom"
          />
        </div>
      </div>

      <div class="modal-action">
        <!-- 移除 form 标签，防止默认提交行为 -->
        <div class="space-x-2">
          <button class="btn" @click="close">取消</button>
          <button 
            class="btn btn-primary" 
            @click="handleCreateRoom"
            :disabled="isCreating"
          >
            <span v-if="isCreating" class="loading loading-spinner"></span>
            确认创建
          </button>
        </div>
      </div>
    </div>
  </dialog>
</template>

<script setup>
import { ref } from 'vue';
import { useStudyRoomStore } from '../../store/studyRoom'; // 1. 引入 store

// --- Store 实例 ---
const studyRoomStore = useStudyRoomStore(); // 2. 获取 store 实例

// --- 状态 ---
const modalRef = ref(null);
const roomName = ref('');
const isCreating = ref(false);

// --- 方法 ---
const handleCreateRoom = async () => {
  if (!roomName.value.trim() || isCreating.value) return;

  isCreating.value = true;
  const success = await studyRoomStore.createRoom({ name: roomName.value });
  isCreating.value = false;

  if (success) {
    close(); // 如果创建成功，关闭弹窗
  }
  // 如果失败，可以在这里显示一个错误提示
};

const open = () => {
  roomName.value = ''; // 每次打开时清空输入框
  if (modalRef.value) {
    modalRef.value.showModal();
  }
};

const close = () => {
  if (modalRef.value) {
    modalRef.value.close();
  }
};

defineExpose({
  open,
  close,
});
</script>
