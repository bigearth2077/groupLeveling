import React from 'react';
import { X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// 番茄主题关闭按钮，内部包裹 shadcn Button 组件
const TomatoCloseButton = ({ onClick }) => (
  <Button 
    variant="ghost"
    size="icon"
    onClick={onClick}
    className="group relative w-10 h-10 rounded-full p-0 hover:rotate-12 active:scale-95 transition-transform hover:bg-transparent"
  >
    {/* 番茄底色 */}
    <div className="absolute inset-0 bg-primary rounded-full shadow-md group-hover:bg-primary/80 transition-colors"></div>
    {/* 顶部叶子装饰 */}
    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-3 rounded-full" style={{backgroundColor: '#4ade80'}}></div>
    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0.5 h-2" style={{backgroundColor: '#22c55e'}}></div>
    {/* X 图标 */}
    <XIcon size={18} strokeWidth={3} className="relative z-10 text-primary-foreground" />
  </Button>
);

export default TomatoCloseButton;
