<template>
  <dialog :id="id" class="modal">
    <div class="modal-box">
      <div v-if="selectedUser" class="flex flex-col items-center gap-4 text-center">
        <div class="avatar">
          <div class="w-24 rounded-full">
            <img v-if="selectedUser.avatarUrl" :src="selectedUser.avatarUrl" />
            <UserCircleIcon v-else class="text-base-content/20" />
          </div>
        </div>
        <h3 class="font-bold text-2xl">{{ selectedUser.nickname }}</h3>
      </div>
      <div v-else class="text-center">
        <span class="loading loading-spinner"></span>
      </div>
      <div class="modal-action">
        <button class="btn" @click="$emit('close')">关闭</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="$emit('close')">关闭</button>
    </form>
  </dialog>
</template>

<script setup>
import { UserCircleIcon } from '@heroicons/vue/24/solid';

defineProps({
  id: String,
  selectedUser: Object,
});

defineEmits(['close']);
</script>
