import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/layout/auth/AuthLayout';
import { useLogin } from '@/feature/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const success = await login(email, password);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthLayout
      title="欢迎回来"
      subtitle="请输入您的电子邮箱以登录您的账号"
      footerText="还没有账号？"
      footerLinkText="立即注册"
      footerLinkPath="/register"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">电子邮箱</label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>
        <div className="space-y-2">
           <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">密码</label>
            <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-500">忘记密码？</a>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
             className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-200"
        >
          {loading ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 登录中...</>
          ) : (
            '立即登录'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Login;

