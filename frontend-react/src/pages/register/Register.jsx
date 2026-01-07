import { useNavigate } from "react-router-dom";
import { TomatoCrossSection } from "../../pages/login/components/TomatoCrossSection";
import Testimonial from "../../pages/login/components/Testimonial";
import { RegisterForm } from "@/feature/auth";

function Register() {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      
      {/* Left Side: Brand & Art */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        
        <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
            <TomatoCrossSection className="w-[80%] h-[80%] opacity-10 text-primary" />
        </div>
        
        <div className="relative z-20 flex items-center text-lg font-bold tracking-tight">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
          </svg>
          Group Leveling
        </div>
        
        <div className="relative z-20 mt-auto">
          <Testimonial />
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email below to create your account
            </p>
          </div>
          
          <RegisterForm onSuccess={handleRegisterSuccess} />
          
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;