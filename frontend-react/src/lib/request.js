import axios from 'axios';
import { getToken, removeToken, setToken } from '@/utils/token';

// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:4523/m1/6951145-6667911-default', // 从环境变量获取，默认值
  timeout: 10000, // 请求超时时间 10秒
  headers: {
    'Content-Type': 'application/json;charset=UTF-8',
  },
});

// 请求拦截器 - 统一处理请求头
request.interceptors.request.use(
  (config) => {
    // 从 token 工具获取 token
    const token = getToken();
    
    // 如果存在 token，则添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 可以在这里添加其他统一的请求头
    // config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    return config;
  },
  (error) => {
    // 请求错误处理
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

// 导出封装好的 axios 实例
export default request;

// 是否正在刷新 Token
let isRefreshing = false;
// 重试队列，用于存储在刷新 Token 期间挂起的请求
let requestsQueue = [];

// 响应拦截器 - 统一处理响应
request.interceptors.response.use(
  (response) => {
    // 2xx 范围内的状态码都会触发该函数
    const { data } = response;
    return data;
  },
  async (error) => {
    const { response, config } = error;
    
    if (response) {
      // 401 处理：Token 过期或未授权
      if (response.status === 401 && !config._retry) {
        // 如果是刷新 Token 的接口本身报错，或者没有 RefreshToken，则直接跳转登录
        const refreshToken = localStorage.getItem('refreshToken'); // 避免循环引用，直接读 storage
        if (config.url.includes('/auth/refresh') || !refreshToken) {
          removeToken();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // 如果正在刷新，将当前请求加入队列等待
          return new Promise((resolve) => {
            requestsQueue.push((token) => {
              config.headers.Authorization = `Bearer ${token}`;
              resolve(request(config));
            });
          });
        }

        config._retry = true;
        isRefreshing = true;

        try {
          // 尝试刷新 Token
          // 使用原生 axios 实例避免拦截器死循环
          // 注意：需要手动拼接完整 URL
          const baseURL = request.defaults.baseURL;
          const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken
          });
          
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;
          
          if (accessToken) {
            // 更新本地 Token
            setToken(accessToken, newRefreshToken);
            
            // 执行队列中的请求
            requestsQueue.forEach((cb) => cb(accessToken));
            requestsQueue = []; // 清空队列
            
            // 重试当前请求
            config.headers.Authorization = `Bearer ${accessToken}`;
            return request(config);
          }
        } catch (refreshError) {
          // 刷新失败，清空 Token 并跳转登录
          console.error('Token 刷新失败:', refreshError);
          removeToken();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // 其他错误状态码处理
      switch (response.status) {
        case 403:
          console.error('拒绝访问');
          break;
        case 404:
          console.error('请求的资源不存在');
          break;
        case 500:
          console.error('服务器内部错误');
          break;
        default:
          console.error('请求失败:', response.statusText);
      }
      
      const errorMessage = response.data?.message || response.statusText || '请求失败';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      console.error('网络错误，请检查网络连接');
      return Promise.reject(new Error('网络错误，请检查网络连接'));
    } else {
      console.error('请求配置错误:', error.message);
      return Promise.reject(error);
    }
  }
);

