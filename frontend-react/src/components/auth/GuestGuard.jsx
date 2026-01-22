import { Navigate, Outlet } from 'react-router-dom';
import { hasToken } from '@/utils/token';

/**
 * 游客路由守卫
 * 防止已登录用户访问登录/注册页面
 * 
 * @param {React.ReactNode} children - 子组件
 * @returns {JSX.Element} 已登录时重定向到首页，未登录时渲染子组件
 */
const GuestGuard = ({ children }) => {
  const isAuthenticated = hasToken();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children || <Outlet />;
};

export default GuestGuard;
