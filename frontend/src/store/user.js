import { defineStore } from 'pinia';
import { post } from '../utils/request';
export const useUserStore = defineStore('user', {
 state: () => ({
    token: '',
    user: {
      id: '',
      email: '',
      nickname: '',
      avatar: null,
      bio: null,
    }
  }),
  actions: {
    setUser(token, user) {
      this.token = token
      this.user = {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatarUrl || null, 
        bio: user.bio || null,
      };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(this.user));
    },
    clearUser() {
      this.token = ''
      this.user = { id: '', email: '', nickname: '', avatar: null, bio: null }
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    async fetchUser() {
      try {
        //post 方法来请求用户信息
        const response = await post('/users/me'); 
        
        // 更新 state 中的用户信息
        this.user = {
          id: response.data.id,
          email: response.data.email,
          nickname: response.data.nickname,
          // 将后端的 avatarUrl 映射到前端的 avatar 字段
          avatar: response.data.avatarUrl || null,
          bio: response.data.bio || null,
        };

        // 将最新的用户信息更新到 localStorage
        localStorage.setItem('user', JSON.stringify(this.user));

      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 如果获取失败（例如 token 失效），可以选择清除用户信息并跳转到登录页
        this.clearUser();
        // 如果需要跳转，可以在这里使用 router.push('/login')，但需要先在 action 中引入 router
      }
    },
    loadFromLocalStorage() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      this.token = token;
      this.user = JSON.parse(user);
    }
  }

  }
});
