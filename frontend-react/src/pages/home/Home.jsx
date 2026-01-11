import React from 'react';
import PomodoroDock from '@/components/PomodoroDock';

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h1 className="text-4xl font-bold text-primary">Home Page</h1>
      <p className="text-xl text-muted-foreground">欢迎来到开发首页</p>
      <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
        <p>这里是一个空白的开始，你可以开始构建你的应用了。</p>
      </div>
      
      {/* 导航栏组件 */}
      <PomodoroDock />
    </div>
  );
};

export default Home;
