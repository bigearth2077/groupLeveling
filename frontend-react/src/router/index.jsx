import { createBrowserRouter } from 'react-router-dom';
import App from '../App';

// 这里是一个简单的路由配置示例
// 你可以在 pages 目录下创建组件后在这里导入
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // App 作为根布局或根组件
    children: [
      {
        path: '/',
        element: <div className="p-10 text-2xl font-bold">首页 - 欢迎使用 React</div>, // 临时占位
      },
      {
        path: '/about',
        element: <div className="p-10">关于页面</div>,
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

