import React, { useState } from 'react';
import { 
  Timer, 
  LayoutDashboard, 
  Trophy, 
  NotebookPen, 
  LogOut,
  GripHorizontal, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLogout } from '../../feature/auth/hooks/useLogout';

const RADIUS = 80;
const DOCK_WIDTH = 220;

export default function PomodoroDock() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { logout } = useLogout();

  const icons = [
    { icon: LayoutDashboard, label: '仪表盘', id: 'dashboard' },
    { icon: Trophy, label: '排行榜', id: 'leaderboard' },
    { icon: Timer, label: '番茄钟', id: 'timer' },
    { icon: NotebookPen, label: '日志', id: 'journal' },
    { icon: LogOut, label: '退出', id: 'logout', onClick: logout },
  ];

  // 避免地平线贴底：15°, 52.5°, 90°, 127.5°, 165°
  const fixedAngles = [165, 127.5, 90, 52.5, 15];

  const getPosition = (index) => {
    const angleDeg = fixedAngles[index];
    const angleRad = (angleDeg * Math.PI) / 180;

    const x = RADIUS * Math.cos(angleRad);
    const y = RADIUS * Math.sin(angleRad);
    return { x, y };
  };

  const handleIconClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    // TODO: Handle other navigation
  };

  return (
    <>
      {/* 全屏遮罩 - 仅在展开时显示，点击收起 */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]" 
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* 交互热区容器 */}
      {/* 
         状态一 (Invisible): opacity-30, translate-y-full (but showing 10px tip)
         状态二 (Peeking): opacity-100, button rises
         状态三 (Expanded): full display
      */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-[120px] z-50 flex justify-center items-end pointer-events-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 指针事件穿透控制：热区本身不挡鼠标，但内部元素需要挡 */}
        <div className="absolute inset-x-0 bottom-0 h-[100px] pointer-events-auto bg-transparent" />

        {/* 坞体容器 */}
        <div className={cn(
            "relative flex items-end justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom pointer-events-auto",
            isExpanded ? "h-[110px] opacity-100 mb-0" : "h-0 opacity-0 mb-0"
        )}
        style={{ width: DOCK_WIDTH }}
        >
             {/* 扇形背景 */}
            <div className="absolute inset-0 bg-primary/95 backdrop-blur-md rounded-t-full border-t border-white/20 shadow-2xl origin-bottom" />
            
            {/* 图标渲染 */}
            {icons.map((item, index) => {
                const { x, y } = getPosition(index);
                const IconComp = item.icon;
                return (
                    <Button
                        key={index}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleIconClick(item)}
                        className={cn(
                            "absolute w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-300 shadow-sm border border-white/10",
                            "translate-x-[-50%] translate-y-[50%]", // 替代 style 里的 transform
                            "active:scale-90 active:duration-75! active:delay-0! hover:text-white", // 强制无延迟，瞬间响应 修正了 ! 的位置
                            isExpanded ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                        style={{
                            left: `calc(50% + ${x}px)`, 
                            bottom: `${y}px`,
                            transitionDelay: `${index * 50}ms` // 依次弹出动画
                        }}
                    >
                        <IconComp className="w-4 h-4" />
                    </Button>
                );
            })}
        </div>

        {/* 核心开关按钮 */}
        {/* 
           Invisible: 沉底，只露头 (translate-y-[80%]), opacity-30
           Peeking: 浮起一半 (translate-y-[40%]), opacity-100
           Expanded: 归位 (translate-y-0), opacity-100, 嵌入扇形
        */}
        <div className={cn(
            "absolute pointer-events-none z-50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
             isExpanded 
                ? "bottom-1 opacity-100 translate-y-0" 
                : isHovered 
                    ? "bottom-0 opacity-100 translate-y-[40%]"  // Peeking: 下沉 40%，露出 60%
                    : "bottom-0 opacity-30 translate-y-[80%]"   // Invisible: 下沉 80%，露出 ~10px
        )}>
             <Button
                onClick={() => setIsExpanded(!isExpanded)}
                size="icon"
                className={cn(
                    "w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-[0_0_15px_-3px_rgba(0,0,0,0.4)] border-2 border-primary-foreground/20 transition-transform hover:scale-105 active:scale-95 hover:bg-primary pointer-events-auto",
                    // 只有在 Peeking 模式或者是 Invisible 模式下才有弹跳指引可能?
                )}
            >
                <div className={cn("transition-transform duration-500", isExpanded ? "rotate-180" : "rotate-0")}>
                     {isExpanded ? <X size={24} /> : <GripHorizontal size={24} />}
                </div>
            </Button>
        </div>
      </div>
    </>
  );
}
