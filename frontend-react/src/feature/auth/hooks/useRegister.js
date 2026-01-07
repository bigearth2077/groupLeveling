import { useState } from 'react';
import { registerAPI } from '../api';
import { useAppStore } from '@/store';
import { setToken } from '@/utils/token';

/**
 * 注册Hook
 * 封装注册状态逻辑和注册函数
 */
export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser } = useAppStore();

  /**
   * 注册函数
   * @param {string} email - 邮箱
   * @param {string} password - 密码
   * @param {string} nickname - 昵称
   * @returns {Promise<boolean>} 注册是否成功
   */
  const register = async (email, password, nickname) => {
    try {
      setLoading(true);
      setError(null);

      // 调用注册API
      const response = await registerAPI(email, password, nickname);

      // 保存token到localStorage
      if (response.accessToken) {
        setToken(response.accessToken, response.refreshToken);
      }

      // 保存用户信息到store
      // 注意：注册接口返回是扁平结构，需构造 user 对象
      if (response.id) {
        setUser({
          id: response.id,
          email: response.email,
          nickname: response.nickname,
        });
      }

      return true;
    } catch (err) {
      // 处理错误
      const errorMessage = err.message || '注册失败，请稍后重试';
      setError(errorMessage);
      console.error('注册错误:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    register,
    loading,
    error,
  };
};
