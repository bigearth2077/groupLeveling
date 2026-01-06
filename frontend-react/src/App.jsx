import { Outlet, Link } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* 简单的导航栏示例 */}
      <div className="navbar bg-base-100 shadow-sm">
        <div className="flex-1">
          <Link to="/" className="btn btn-ghost text-xl">React迁移项目</Link>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li><Link to="/">首页</Link></li>
            <li><Link to="/about">关于</Link></li>
          </ul>
        </div>
      </div>

      {/* 路由出口，类似于 <router-view> */}
      <div className="container mx-auto py-8">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
