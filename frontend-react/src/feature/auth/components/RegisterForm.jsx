import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegister } from '../hooks/useRegister';

/**
 * 注册表单组件
 * @param {Function} onSuccess - 注册成功后的回调函数
 */
export const RegisterForm = ({ onSuccess }) => {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { register, loading, error: apiError } = useRegister();

  /**
   * 处理表单提交
   * @param {Event} e - 表单提交事件
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // 基本验证
    if (!nickname.trim()) {
      setLocalError('Nickname is required');
      return;
    }
    if (!email.trim()) {
      setLocalError('Email is required');
      return;
    }
    if (!password.trim()) {
      setLocalError('Password is required');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    // 执行注册
    const success = await register(email, password, nickname);

    // 如果注册成功，调用成功回调
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full border-0 border-b border-primary bg-transparent rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary placeholder:text-primary/70 focus-visible:border-primary/80"
          disabled={loading}
        />
      </div>
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border-0 border-b border-primary bg-transparent rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary placeholder:text-primary/70 focus-visible:border-primary/80"
          disabled={loading}
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border-0 border-b border-primary bg-transparent rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary placeholder:text-primary/70 focus-visible:border-primary/80"
          disabled={loading}
        />
      </div>
      <div>
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border-0 border-b border-primary bg-transparent rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-primary placeholder:text-primary/70 focus-visible:border-primary/80"
          disabled={loading}
        />
      </div>
      
      {/* 错误提示 */}
      {(localError || apiError) && (
        <div className="text-red-500 text-sm">
          {localError || apiError}
        </div>
      )}

      <Button 
        type="submit" 
        variant="outline"
        className="w-full bg-background text-primary border-primary hover:bg-primary hover:text-secondary hover:border-primary transition-colors"
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Register'}
      </Button>
      
      <div className="flex justify-center items-center mt-6 text-sm">
        <span className="text-muted-foreground mr-2">Already have an account?</span>
        <Button 
          asChild
          variant="ghost"
          className="text-primary hover:text-primary/80 hover:bg-transparent p-0 h-auto"
        >
          <Link to="/login">
            Login
          </Link>
        </Button>
      </div>
    </form>
  );
};
