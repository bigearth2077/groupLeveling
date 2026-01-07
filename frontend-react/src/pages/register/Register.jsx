import { useNavigate } from "react-router-dom";
import { TomatoCrossSection } from "../../pages/login/components/TomatoCrossSection";
import WelcomeTitle from "../../pages/login/components/WelcomeTitle";
import Testimonial from "../../pages/login/components/Testimonial";
import { RegisterForm } from "@/feature/auth";

function Register() {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    // 注册成功后直接进入主页
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* 装饰性圆形背景 - 左侧大圆 */}
      <div className="absolute left-[-20vw] top-[10vh] w-[80vw] h-[80vw] max-w-[80vh] max-h-[80vh] opacity-30">
        <TomatoCrossSection />
      </div>
      
      {/* 主容器：上下布局 */}
      <div className="container mx-auto px-4 flex flex-col min-h-screen py-12 z-10 relative">
        {/* 上方：注册表单 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-transparent p-8 rounded-lg w-full max-w-md">
            {/* 复用 WelcomeTitle，或者可以新建一个 RegisterTitle */}
            <WelcomeTitle /> 
            <RegisterForm onSuccess={handleRegisterSuccess} />
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

export default Register;
