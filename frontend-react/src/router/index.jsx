import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import GuestGuard from '../components/auth/GuestGuard';
import Login from '../pages/login/Login';
import Register from '../pages/register/Register';
import Auth from '../components/Auth';
import Home from '../pages/home/Home';
import Dashboard from '../pages/dashboard';

// 路由配置
const router = createBrowserRouter([
  // 游客路由：仅未登录用户可访问
  {
    element: <GuestGuard />,
    children: [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
    ]
  },
  
  // 受保护路由：需要登录才能访问
  {
    path: '/',
    element: <Auth useOutlet />, // Auth 使用 Outlet 渲染子路由
    children: [
      {
        path: '/',
        element: <App />, // App 作为布局组件，通过 Auth 的 Outlet 渲染
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'about',
            element: <div className="p-10 text-foreground">关于页面</div>,
          }
        ]
      }
    ]
  },
  
  // 404 页面
  {
    path: '*',
    element: <div className="p-10">404 Not Found</div>
  }
]);

export default router;

