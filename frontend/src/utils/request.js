import axios from "axios";

// 创建 axios 实例
const instance = axios.create({
  baseURL: "http://127.0.0.1:8080", // Apifox Base URL
  timeout: 5000, // 请求超时
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 如果本地有 token，则自动携带
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (res) => res.data, // 直接返回 data
  (err) => {
    console.error("请求出错：", err);

    // 统一处理未授权（401）
    if (err.response && err.response.status === 401) {
      console.warn("登录状态已过期，请重新登录");
      // 这里可以跳转到登录页
    }

    return Promise.reject(err);
  }
);

// 封装 GET 请求
export const get = (url, params = {}) => instance.get(url, { params });

// 封装 POST 请求
export const post = (url, data = {}) => instance.post(url, data);
// 封装 DELETE 请求
export const del = (url, data = {}, config = {}) => {
  return instance.delete(url, { data, ...config });
};
// 封装 PATCH 请求
export const patch = (url, data = {}) => instance.patch(url, data);

export default instance;

// 你调用 post('/auth/login', {email, password})
//         │
//         ▼
// Axios 封装 (utils/request.js)
//         │
//         ▼
// 【请求拦截器】
//    1. 从 localStorage 取 token
//    2. 如果有，就在请求头加上：
//       Authorization: Bearer <token>
//         │
//         ▼
//    发出 HTTP 请求 → 后端 API
//         │
//         ▼
// 【后端】
//    - 检查 Authorization 头
//    - 如果 token 有效 → 返回数据
//    - 如果 token 无效/过期 → 返回 401
//         │
//         ▼
// 【响应拦截器】
//    - 正常返回时：只保留 res.data 给前端
//    - 401 时：打印警告 “登录过期”，并返回 Promise.reject(error)
//         │
//         ▼
// 调用处 (你的业务逻辑代码)
//    - .then(res => …) 处理成功
//    - .catch(err => …) 处理失败
