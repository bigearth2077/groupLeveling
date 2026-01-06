import { Outlet, Link } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-background">
      {/* 简单的导航栏示例 - 使用标准 Tailwind 类名 */}
      <nav className="border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
            React迁移项目
          </Link>
          <div className="flex gap-4">
            <Link 
              to="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              首页
            </Link>
            <Link 
              to="/about" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              关于
            </Link>
          </div>
        </div>
      </nav>

      {/* 路由出口，类似于 <router-view> */}
      <div className="container mx-auto py-8 px-4">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
