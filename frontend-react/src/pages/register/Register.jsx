import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/layout/auth/AuthLayout';
import { useRegister } from '@/feature/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register, loading, error } = useRegister();
  
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !nickname) return;

    const success = await register(email, password, nickname);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <AuthLayout
      title="创建新账号"
      subtitle="今天开启您的自律升级之旅"
      footerText="已有账号？"
      footerLinkText="立即登录"
      footerLinkPath="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="nickname" className="text-sm font-medium text-slate-700">用户昵称</label>
          <Input
            id="nickname"
            type="text"
            placeholder="您的自律称号"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={loading}
            className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>

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
          <label htmlFor="password" className="text-sm font-medium text-slate-700">账户密码</label>
          <Input
            id="password"
            type="password"
            placeholder="设置您的登录密码"
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
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 创建账号中...</>
          ) : (
            '立即注册'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Register;
