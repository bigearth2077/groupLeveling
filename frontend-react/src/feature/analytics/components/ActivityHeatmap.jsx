import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getActivityHeatmap } from '../api';

const ActivityHeatmap = () => {
  const { t } = useTranslation();
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getActivityHeatmap(currentYear);
        if (res && res.items) {
          setRawData(res.items);
        }
      } catch (error) {
        console.error("Failed to fetch activity heatmap:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentYear]);

  // Aggregate data into a 12 (Month) x 7 (Weekday) grid
  const processedData = useMemo(() => {
    // grid[weekday][month] initialized to 0
    // weekday index: 0 (Mon) to 6 (Sun)
    const grid = Array.from({ length: 7 }, () => Array(12).fill(0));

    rawData.forEach(item => {
      const date = new Date(item.date);
      const month = date.getMonth(); // 0-11
      
      // getDay() returns 0 for Sunday, 1 for Monday...
      // We want 0 for Monday, 6 for Sunday
      let day = date.getDay(); 
      const weekdayIndex = day === 0 ? 6 : day - 1; 

      grid[weekdayIndex][month] += item.count;
    });

    const heatmapData = [];
    for (let w = 0; w < 7; w++) {
      for (let m = 0; m < 12; m++) {
        heatmapData.push([m, w, grid[w][m]]);
      }
    }
    return heatmapData;
  }, [rawData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const months = t('analytics.months', { returnObjects: true });
  const days = t('analytics.days', { returnObjects: true });

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const monthName = months[params.data[0]];
        const dayName = days[params.data[1]];
        return `${monthName} ${dayName}: ${params.data[2]} ${t('analytics.minutes')}`;
      },
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 11 },
      padding: [4, 8]
    },
    grid: {
      left: 45,
      right: 20,
      top: 30,
      bottom: 25,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: months,
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10, margin: 10 }
    },
    yAxis: {
      type: 'category',
      data: days,
      inverse: true, // Monday at the top
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10, margin: 10 }
    },
    visualMap: {
      min: 0,
      max: 300, // Adjusted max for monthly aggregation
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      show: false,
      inRange: {
        color: ['#f8fafc', '#dcfce7', '#86efac', '#22c55e', '#166534']
      }
    },
    series: [{
      name: 'Activity',
      type: 'heatmap',
      data: processedData,
      label: { show: false },
      itemStyle: {
        borderWidth: 2,
        borderColor: '#fff',
        borderRadius: 2
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.2)'
        }
      }
    }]
  };

  return (
    <div className="w-full py-2">
      <div className="h-[200px]">
        <ReactECharts 
          option={option} 
          style={{ height: '100%', width: '100%' }} 
          opts={{ renderer: 'svg' }}
        />
      </div>
    </div>
  );
};

export default ActivityHeatmap;
