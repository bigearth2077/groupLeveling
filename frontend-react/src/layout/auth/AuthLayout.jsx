import React from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';

const AuthLayout = ({ children, title, subtitle, footerText, footerLinkText, footerLinkPath }) => {
  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Side - Visual & Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="relative z-10 max-w-lg text-white space-y-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/50 mb-8">
             <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Level up your <br />
            <span className="text-indigo-400">productivity.</span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed">
            "GroupLeveling turns your study sessions into an RPG. Join rooms, earn XP, and compete with friends to stay motivated."
          </p>
          
          <div className="pt-8 flex gap-4">
             <div className="flex -space-x-3">
               {[1,2,3,4].map(i => (
                 <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-700"></div>
               ))}
             </div>
             <div className="text-sm font-medium text-slate-400 self-center">
               Join 2,000+ others
             </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {subtitle}
            </p>
          </div>

          {children}

          <div className="text-center text-sm text-slate-500">
            {footerText}{' '}
            <Link to={footerLinkPath} className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              {footerLinkText}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
