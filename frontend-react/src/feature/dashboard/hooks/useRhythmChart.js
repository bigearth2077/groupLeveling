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
      // 传递 drill target type 和 data payload
      onDrillDown(viewMode === 'week' ? 'day' : 'month', data);
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

  return {
    viewMode,
    activeIndex,
    data: currentData,
    loading,
    handleBarClick,
    handleViewModeChange
  };
};
