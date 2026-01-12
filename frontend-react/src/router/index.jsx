import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import Login from '../pages/login/Login';
import Register from '../pages/register/Register';
import Auth from '../components/Auth';
import Home from '../pages/home/Home';

// 路由配置
const router = createBrowserRouter([
  // 公开路由：登录页面 - 独立布局（不包含导航栏）
  {
    path: '/login',
    element: <Login />,
  },
  // 公开路由：注册页面
  {
    path: '/register',
    element: <Register />,
  },
  
  // 受保护路由：需要登录才能访问
  {
    path: '/',
    element: <Auth useOutlet />, // Auth 使用 Outlet 渲染子路由
    children: [
      {
        path: '/',
        element: <AppLayout />, // AppLayout 作为主布局组件
        children: [
          {
            index: true,
            element: <Home />,
          },
          {
            path: 'about',
            element: <div className="p-10 text-foreground">关于页面</div>,
          },
          {
            path: 'rooms',
            element: <div className="p-10 text-foreground">Rooms Page (Coming Soon)</div>,
          },
          {
            path: 'rankings',
            element: <div className="p-10 text-foreground">Rankings Page (Coming Soon)</div>,
          },
          {
            path: 'profile',
            element: <div className="p-10 text-foreground">Profile Page (Coming Soon)</div>,
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

