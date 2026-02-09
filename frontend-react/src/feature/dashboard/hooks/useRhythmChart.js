import { useState, useEffect } from 'react';
import { fetchDashboardData } from '../api/dashboardApi';

export const useRhythmChart = (onDrillDown, onViewModeChange) => {
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [activeIndex, setActiveIndex] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // 初始化获取数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 计算当前应该显示的数据
  const currentData = dashboardData 
    ? (viewMode === 'week' ? dashboardData.weekView : dashboardData.yearView) 
    : [];

  const handleBarClick = (data, index) => {
    setActiveIndex(index);
    if (onDrillDown && data) {
      const targetMode = viewMode === 'week' ? 'day' : 'month';
      onDrillDown(targetMode, data);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setActiveIndex(null); // Reset selection on view switch
    // 通知父组件视图模式已切换，以便重置下游状态
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
  };

  const handleChartClick = (e) => {
    // Recharts Event structure is quirky.
    // Sometimes activePayload is missing but activeIndex is present.
    if (e && e.activePayload && e.activePayload.length > 0) {
        handleBarClick(e.activePayload[0].payload, e.activeTooltipIndex);
    } else if (e && e.activeTooltipIndex !== undefined && currentData && currentData[e.activeTooltipIndex]) {
        // Fallback: Use the index to manually find the data from the 'data' prop
        const item = currentData[e.activeTooltipIndex];
        handleBarClick(item, e.activeTooltipIndex);
    } 
  };

  return {
    viewMode,
    activeIndex,
    data: currentData,
    loading,
    handleBarClick,     // Still exposed if needed for manual testing
    handleChartClick,   // New: Encapsulated event handler for Recharts
    handleViewModeChange
  };
};
