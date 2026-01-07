import { useState } from 'react';
import { loginAPI } from '../api';
import { useAppStore } from '@/store';
import { setToken } from '@/utils/token';

/**
 * 登录Hook
 * 封装登录状态逻辑和登录函数
 */
export const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser } = useAppStore();

  /**
   * 登录函数
   * @param {string} username - 用户名（邮箱）
   * @param {string} password - 密码
   * @returns {Promise<boolean>} 登录是否成功
   */
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      // 调用登录API
      const response = await loginAPI(username, password);

      // 保存token到localStorage
      if (response.accessToken) {
        setToken(response.accessToken, response.refreshToken);
      }

      // 保存用户信息到store
      if (response.user) {
        setUser(response.user);
      }

      return true;
    } catch (err) {
      // 处理错误
      const errorMessage = err.message || '登录失败，请检查用户名和密码';
      setError(errorMessage);
      console.error('登录错误:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    error,
  };
};

