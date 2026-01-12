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
      title="Create an account"
      subtitle="Start your leveling journey today"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkPath="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="nickname" className="text-sm font-medium text-slate-700">Nickname</label>
          <Input
            id="nickname"
            type="text"
            placeholder="Your hero name"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={loading}
            className="h-11 rounded-xl border-slate-200 focus-visible:ring-indigo-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
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
          <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
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
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default Register;
