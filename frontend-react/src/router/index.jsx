import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import Login from '../pages/login/Login';
import Register from '../pages/register/Register';
import Auth from '../components/Auth';
import Home from '../pages/home/Home';
import Profile from '../pages/user/Profile';
import Leaderboard from '../pages/ranking/Leaderboard';
import RoomLobby from '../pages/room/RoomLobby';
import RoomDetail from '../pages/room/RoomDetail';

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
            element: <RoomLobby />,
          },
          {
            path: 'room/:id',
            element: <RoomDetail />,
          },
          {
            path: 'rankings',
            element: <Leaderboard />,
          },
          {
            path: 'profile',
            element: <Profile />,
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
