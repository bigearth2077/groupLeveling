import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import TomatoCloseButton from '@/components/ui/TomatoCloseButton';
import VinePattern from '@/components/ui/VinePattern';
import { GreetingHeader } from './components/GreetingHeader';
import { RhythmChart } from './components/RhythmChart';
import { DetailList } from './components/DetailList';

/**
 * DashboardDrawer —— 仪表盘 Sheet 弹出组件
 * 参考设计稿 draw.jsx 的布局和尺寸，使用 SocialDrawer 同款 Sheet 模式
 * feature 子组件（GreetingHeader / RhythmChart / DetailList）零修改直接嵌入
 */
const DashboardDrawer = ({ isOpen, onClose }) => {
  // 保留原有 drill-down 交互状态
  const [drillState, setDrillState] = useState({
    level: 'day',
    data: null,
  });

  const handleDrillDown = (level, data) => {
    setDrillState({ level, data });
  };

  /**
   * 当中部图表切换视图模式时（周 <-> 月），重置底部列表的状态。
   * 周视图模式 -> 默认显示当天的 Detail (level: day)
   * 月视图模式 -> 默认显示当月的 Calendar (level: month)
   */
  const handleViewSwitch = (mode) => {
    setDrillState({
      level: mode === 'week' ? 'day' : 'month',
      data: null,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent 
        side="right" 
        className="w-full max-w-lg p-0 border-l-0 bg-background/95 backdrop-blur-xl rounded-l-[2.5rem] shadow-2xl shadow-primary/20 overflow-hidden [&>button]:hidden"
      >
        {/* 相对定位容器 */}
        <div className="relative h-full flex flex-col">
          
          {/* 背景装饰（藤蔓），参考设计稿位置 */}
          <VinePattern className="absolute -top-10 -right-10 w-64 h-64 text-primary/20 opacity-10 pointer-events-none" />
          <VinePattern className="absolute bottom-10 -left-10 w-64 h-64 text-primary/20 opacity-10 pointer-events-none transform rotate-90" />

          {/* Header 区域 */}
          <SheetHeader className="px-8 pt-8 pb-4 z-10">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-2xl font-black tracking-tight leading-none">
                  Your Progress
                </SheetTitle>
                <SheetDescription className="text-sm font-medium text-primary mt-1">
                  You are doing great, Explorer!
                </SheetDescription>
              </div>
              {/* 番茄关闭按钮 */}
              <TomatoCloseButton onClick={onClose} />
            </div>
          </SheetHeader>

          {/* 可滚动内容区域 */}
          <div className="flex-1 overflow-y-auto px-8 py-2 z-10 pb-10 space-y-6">
            
            {/* 1. 问候语 & 统计摘要 */}
            <section>
              <GreetingHeader totalDuration={drillState.data?.studyDuration || 0} />
            </section>

            {/* 2. 专注节奏图表 */}
            <section>
              <RhythmChart onDrillDown={handleDrillDown} onViewModeChange={handleViewSwitch} />
            </section>

            {/* 3. 详情列表 */}
            <section>
              <DetailList level={drillState.level} selectedData={drillState.data} />
            </section>
          </div>

          {/* 底部渐变淡出效果 */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-background to-transparent pointer-events-none rounded-bl-[2.5rem]" />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DashboardDrawer;
