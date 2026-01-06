import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TomatoCrossSection } from "./components/TomatoCrossSection";
import WelcomeTitle from "./components/WelcomeTitle";
import Testimonial from "./components/Testimonial";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
            <form className="space-y-6">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-0 border-b border-primary bg-transparent rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary placeholder:text-primary/70 focus-visible:border-primary/80"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-0 border-b border-primary bg-transparent rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary placeholder:text-primary/70 focus-visible:border-primary/80"
                />
              </div>
              <Button 
                type="submit" 
                variant="outline"
                className="w-full bg-background text-primary border-primary hover:bg-primary hover:text-white hover:border-primary transition-colors"
              >
                login
              </Button>
              <div className="flex justify-between items-center mt-6 text-sm">
                <Button 
                  asChild
                  variant="ghost"
                  className="text-primary hover:text-primary/80 hover:bg-transparent p-0 h-auto"
                >
                  <Link to="/register">
                    Register
                  </Link>
                </Button>
                <Button 
                  asChild
                  variant="ghost"
                  className="text-primary hover:text-primary/80 hover:bg-transparent p-0 h-auto"
                >
                  <Link to="/forget-password">
                    Forget Password
                  </Link>
                </Button>
              </div>
            </form>
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

