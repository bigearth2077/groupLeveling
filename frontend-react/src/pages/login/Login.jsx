import { useNavigate, useLocation } from "react-router-dom";
import { TomatoCrossSection } from "./components/TomatoCrossSection";
import WelcomeTitle from "./components/WelcomeTitle";
import Testimonial from "./components/Testimonial";
import { LoginForm } from "@/feature/auth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLoginSuccess = () => {
    // 获取跳转前的页面路径（从 state 或 search 参数中获取）
    const from = location.state?.from?.pathname || 
                 new URLSearchParams(location.search).get('redirect') || 
                 '/';
    
    // 跳转到之前的页面或主页
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* 装饰性圆形背景 - 左侧大圆 */}
      <div className="absolute left-[-20vw] top-[10vh] w-[80vw] h-[80vw] max-w-[80vh] max-h-[80vh] opacity-30">
        <TomatoCrossSection />
      </div>
      
      {/* 主容器：上下布局 */}
      <div className="container mx-auto px-4 flex flex-col min-h-screen py-12 z-10 relative">
        {/* 上方：登录表单 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-transparent p-8 rounded-lg w-full max-w-md">
            <WelcomeTitle />
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </div>

        {/* 下方：客户评价 - 居右显示 */}
        <div className="flex justify-end pb-12">
          <div className="w-full max-w-md">
            <Testimonial />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

