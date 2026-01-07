import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '../hooks/useLogin';

/**
 * 登录表单组件
 * @param {Function} onSuccess - 登录成功后的回调函数
 */
export const LoginForm = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error } = useLogin();

  /**
   * 处理表单提交
   * @param {Event} e - 表单提交事件
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 基本验证
    if (!username.trim()) {
      return;
    }
    if (!password.trim()) {
      return;
    }

    // 执行登录
    const success = await login(username, password);

    // 如果登录成功，调用成功回调
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
      
      {/* 错误提示 */}
      {error && (
        <div className="text-red-500 text-sm">
          {error}
        </div>
      )}

      <Button 
        type="submit" 
        variant="outline"
        className="w-full bg-background text-primary border-primary hover:bg-primary hover:text-secondary hover:border-primary transition-colors"
        disabled={loading}
      >
        {loading ? '登录中...' : 'login'}
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
  );
};

