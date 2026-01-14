import axios from 'axios';
import { getToken, removeToken } from '@/utils/token';

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api', // Use proxy
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

// 响应拦截器 - 统一处理响应
request.interceptors.response.use(
  (response) => {
    // 2xx 范围内的状态码都会触发该函数
    const { data } = response;
    
    // 如果后端返回的数据格式是 { code, data, message }，可以在这里统一处理
    // 根据实际后端接口规范调整
    if (data && data.code !== undefined && data.code !== 200 && data.code !== 0) {
      // 业务错误处理
      const errorMessage = data.message || '请求失败';
      console.error('业务错误:', errorMessage);
      return Promise.reject(new Error(errorMessage));
    }
    
    // 返回实际数据
    return data;
  },
  (error) => {
    // 超出 2xx 范围的状态码都会触发该函数
    const { response } = error;
    
    if (response) {
      // 服务器返回了错误状态码
      switch (response.status) {
        case 401:
          // 未授权，清除 token 并跳转到登录页
          removeToken();
          // 可以在这里添加路由跳转到登录页
          // window.location.href = '/login';
          console.error('未授权，请重新登录');
          break;
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
      
      // 返回错误信息
      const errorMessage = response.data?.message || response.statusText || '请求失败';
      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('网络错误，请检查网络连接');
      return Promise.reject(new Error('网络错误，请检查网络连接'));
    } else {
      // 在设置请求时触发了一个错误
      console.error('请求配置错误:', error.message);
      return Promise.reject(error);
    }
  }
);

// 导出封装好的 axios 实例
export default request;

