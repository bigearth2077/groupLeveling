import { Outlet, Link } from "react-router-dom";

function App() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* 路由出口 */}
      <div className="container mx-auto py-8 px-4 relative">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
