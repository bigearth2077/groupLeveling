import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Login from '../pages/login/Login';
import Register from '../pages/register/Register';
import Auth from '../components/Auth';

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
        element: <App />, // App 作为布局组件，通过 Auth 的 Outlet 渲染
        children: [
          {
            index: true,
            element: <div className="p-10 text-2xl font-bold text-foreground">首页 - 欢迎使用 React</div>, // 临时占位
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

