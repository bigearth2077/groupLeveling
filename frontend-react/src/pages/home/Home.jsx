import React from 'react';
import PomodoroDock from '@/components/ui/PomodoroDock';
import { TimerComponent } from '../../feature/Timer/TimerComponent';
import { useTimerStore } from '../../store/timerStore';
import { cn } from '../../lib/utils';

const Home = () => {
  const isFocusMode = useTimerStore((state) => state.isFocusMode);

  return (
    <>
      <div 
        className={cn(
            "fixed inset-0 bg-black/60 backdrop-blur-md transition-all duration-700 pointer-events-none z-40",
            isFocusMode ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      
      <div className="flex flex-col items-center justify-center min-h-[85vh] gap-8 relative">
        
        {/* Timer 组件区域 */}
        <div className="w-full flex justify-center">
           <TimerComponent />
        </div>

        {/* 底部导航栏 */}
        <div className="fixed bottom-8 w-full flex justify-center z-50">
          <PomodoroDock />
        </div>
      </div>
    </>
  );
};

export default Home;
