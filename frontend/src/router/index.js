import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/home', component: () => import('../views/home/Home.vue') },
  { path: '/login', component: () => import('../views/login/Login.vue')},
  { path: '/register',component: () => import('../views/register/Register.vue')},
  { path: '/forget-password',component: () => import('../views/fogetpassword/ForgetPassword.vue')},
  { path: '/records', name: 'Records', component: () => import('../views/records/Records.vue') },
  { path: '/rank', name: 'Rank', component: () => import('../views/rank/Rank.vue') },
  { path: '/studyroom', name: 'StudyRoom', component: () => import('../views/home/Home.vue') },
  { path: '/blog', name: 'Blog', component: () => import('../views/home/Home.vue') },
  { path: '/aieval', name: 'AiEval', component: () => import('../views/home/Home.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../views/profile/ProfilePage.vue') },
  { path: '/friends', name: 'Friends', component: () => import('../views/friends/FriendsPage.vue') },
  { path: '/', redirect: '/home' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to,from,next) => {
  const token = localStorage.getItem('token');
  const publicPages = ['/login','/register','/foget-password'];
  if(!token && !publicPages.includes(to.path)){
    return next({ path:'/login',query:{redirect:to.fullPath} });
  }
  if (token && publicPages.includes(to.path)) {
    return next('/home')
  }
  next();
})

export default router;
