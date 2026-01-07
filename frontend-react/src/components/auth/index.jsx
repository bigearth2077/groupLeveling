import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasToken } from '@/utils/token';

/**
 * 路由鉴权组件
 * 检查是否存在 Token，决定是否允许访问受保护的路由
 * 
 * @param {React.ReactNode} children - 子组件（可选，与 Outlet 二选一）
 * @param {boolean} useOutlet - 是否使用 Outlet（用于路由嵌套），默认为 false
 * @returns {JSX.Element} 有 Token 时渲染子组件，无 Token 时重定向到登录页
 */
const Auth = ({ children, useOutlet = false }) => {
  const location = useLocation();
  const isAuthenticated = hasToken();

  // 如果没有 Token，重定向到登录页
  if (!isAuthenticated) {
    // 保存当前路径，以便登录后跳转回来
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // 如果有 Token，渲染子组件
  // 如果 useOutlet 为 true，使用 Outlet（用于路由嵌套）
  // 否则使用 children（用于包裹单个组件）
  if (useOutlet) {
    return <Outlet />;
  }
  
  return children || null;
};

export default Auth;

