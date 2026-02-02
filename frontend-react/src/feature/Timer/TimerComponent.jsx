import React from 'react';
import { Play, Pause, Check, X } from 'lucide-react';
import { useTimer } from './hooks/useTimer';
import { cn } from '../../lib/utils';
import { Button } from '@/components/ui/button';
import { TomatoClockFace } from './components/TomatoClockFace';

export const TimerComponent = () => {
  const { 
    formattedTime, 
    isActive, 
    isPaused,      // 新增
    mode,
    startTimer, 
    pauseTimer,    // 新增
    resumeTimer,   // 新增
    resetTimer, // 对应 Cancel/Give Up
    completeSession, // 对应 End/Finish
    switchMode,
    progress,       // 新增进度(0-100)
    MODE_CONFIG 
  } = useTimer();

  // 暂时取消模式切换造成的 UI 变化，统一使用 'solid'
  const visualVariant = 'solid';

  return (
    <div className={cn(
        "flex flex-col items-center justify-center w-full h-full mx-auto relative transition-all duration-300",
        isActive ? "z-50" : "z-10"
    )}>
      {/* 视觉番茄主体 */}
      <div 
          className={cn(
              "relative flex items-center justify-center mb-8 transition-all duration-700 ease-in-out",
              // 放大尺寸
              "w-[600px] h-[600px]",
              // Active animation
              isActive ? "scale-110" : "scale-100"
          )}
      >
        {/* SVG 背景 */}
        <div className="absolute inset-0 z-0">
             <TomatoClockFace variant={visualVariant} progress={progress} />
        </div>

        {/* 时间文案 - 绝对居中覆盖在 SVG 之上 */}
        <div 
             className={cn(
               "text-7xl font-light tracking-widest font-mono z-10 relative transition-colors duration-700",
               // 根据模式调整文字颜色以确保对比度
            //    isLearning ? "text-primary-foreground" : "text-primary"
                "text-primary-foreground"
             )}
        >
            {formattedTime}
        </div>
      </div>

      {/* 控制区域 */}
      <div className="flex flex-col items-center gap-6 w-full">
        
        {/* 主控制按钮 */}
        <div className="flex items-center gap-4">
            {!isActive ? (
                <Button 
                    onClick={startTimer}
                    size="icon"
                    className="w-16 h-16 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-lg [&_svg]:size-8"
                    aria-label="Start Focus"
                >
                    <Play fill="currentColor" className="ml-1"/>
                </Button>
            ) : (
                <>
                    {/* 放弃按钮 (Cancel) */}
                    <Button 
                        onClick={resetTimer}
                        variant="destructive"
                        size="icon"
                        className="w-14 h-14 rounded-full shadow-lg"
                        title="Give Up (Cancel Session)"
                    >
                        <X />
                    </Button>

                    {/* 暂停/继续按钮 */}
                    <Button 
                        onClick={isPaused ? resumeTimer : pauseTimer}
                        variant="secondary"
                        size="icon"
                        className="w-16 h-16 rounded-full shadow-xl bg-slate-100 dark:bg-slate-800 text-foreground [&_svg]:size-8"
                        title={isPaused ? "Resume Focus" : "Pause Focus"}
                    >
                        {isPaused ? <Play fill="currentColor" className="ml-1" /> : <Pause fill="currentColor" />}
                    </Button>
                    
                    {/* 完成按钮 (End) - 总是显示允许提前完成，或者仅在时间少时显示？根据需求，用户可能想提前结束 */}
                    <Button 
                        onClick={completeSession}
                        variant="default"
                        size="icon"
                        className="w-14 h-14 rounded-full bg-green-600 hover:bg-green-700 shadow-lg"
                        title="Finish Session"
                    >
                        <Check />
                    </Button>
                </>
            )}
        </div>

        {/* 模式切换 (仅在非活动状态显示) */}
        <div className={cn(
            "flex items-center gap-2 transition-opacity duration-300", 
            !isActive ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            {Object.entries(MODE_CONFIG).map(([key, config]) => (
                <Button
                    key={key}
                    variant={mode === key ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => switchMode(key)}
                    className={cn(
                        "rounded-full text-xs font-medium transition-all",
                        mode === key 
                            ? "bg-red-100 text-red-900 border-red-200 hover:bg-red-200"
                            : "text-slate-600 hover:bg-slate-100"
                    )}
                >
                    {config.label} {config.minutes}m
                </Button>
            ))}
        </div>

      </div>
    </div>
  );
};
