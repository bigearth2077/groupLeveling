import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '@/utils/token';

export const useLogout = () => {
  const navigate = useNavigate();

  const logout = useCallback(async () => {
    // 纯本地登出逻辑，不调用后端接口
    removeToken();
    navigate('/login', { replace: true });
  }, [navigate]);

  return { logout };
};
