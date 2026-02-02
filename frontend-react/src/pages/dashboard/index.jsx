import React, { useState } from 'react';
import { GreetingHeader } from '@/feature/dashboard/components/GreetingHeader';
import { RhythmChart } from '@/feature/dashboard/components/RhythmChart';
import { DetailList } from '@/feature/dashboard/components/DetailList';

const Dashboard = () => {
  // State for drill-down interaction
  const [drillState, setDrillState] = useState({
    level: 'day', // 'day' (default/week view click) | 'month' (year view click)
    data: null    // The data object clicked (e.g., { label: 'Mon', studyDuration: ... })
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
        data: null // Reset selection data
    });
  };

  return (
    <div className="w-full h-full bg-background p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* 1. Top Section: Greeting & Stats Summary */}
      <section>
        <GreetingHeader totalDuration={drillState.data?.studyDuration || 0} />
      </section>

      {/* 2. Middle Section: Rhythm Chart */}
      <section>
        <RhythmChart onDrillDown={handleDrillDown} onViewModeChange={handleViewSwitch} />
      </section>

      {/* 3. Bottom Section: Detail List */}
      <section>
        <DetailList level={drillState.level} selectedData={drillState.data} />
      </section>
    </div>
  );
};

export default Dashboard;
