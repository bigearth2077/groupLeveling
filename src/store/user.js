import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
 state: () => ({
    token: '',
    user: {
      id: '',
      email: '',
      nickname: ''
    }
  }),
  actions: {
    setUser(token, user) {
      this.token = token
      this.user = user
    },
    clearUser() {
      this.token = ''
      this.user = { id: '', email: '', nickname: '' }
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
     loadFromLocalStorage() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
      }
    }
  }
});
