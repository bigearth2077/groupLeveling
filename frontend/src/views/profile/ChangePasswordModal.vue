<template>
  <dialog :id="id" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">修改密码</h3>
      <form @submit.prevent="changePassword" class="py-4 space-y-4">
        <input type="password" v-model="passwordForm.oldPassword" placeholder="当前密码" class="input input-bordered w-full" required />
        <input type="password" v-model="passwordForm.newPassword" placeholder="新密码" class="input input-bordered w-full" required />
        <input type="password" v-model="passwordForm.confirmPassword" placeholder="确认新密码" class="input input-bordered w-full" required />
        
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="closeModal">取消</button>
          <button type="submit" class="btn btn-primary">确认修改</button>
        </div>
      </form>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>关闭</button>
    </form>
  </dialog>
</template>

<script setup>
import { reactive } from 'vue';
import { patch } from '../../utils/request';

const props = defineProps({
  id: String,
});

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const closeModal = () => {
  document.getElementById(props.id)?.close();
};

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    alert('两次输入的新密码不一致！');
    return;
  }
  try {
    await patch('/users/me/password', {
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    });
    alert('密码修改成功！');
    closeModal();
    passwordForm.oldPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
  } catch (error) {
    console.error("修改密码失败:", error);
    alert('密码修改失败，请检查当前密码是否正确。');
  }
};
</script>
