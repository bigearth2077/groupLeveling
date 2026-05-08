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

  // 将数据聚合到一个12（月）x7（工作日）的网格中
  const processedData = useMemo(() => {
    // grid[weekday][month] 初始化为0
    // 工作日索引：0（周一）至6（周日）
    const grid = Array.from({ length: 7 }, () => Array(12).fill(0));

    rawData.forEach(item => {
      const date = new Date(item.date);
      const month = date.getMonth(); // 0-11
      
      // getDay() 返回0表示周日，1表示周一...
      // 我们希望0表示周一，6表示周日
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
      inverse: true, // 周一在最上方
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#94a3b8', fontSize: 10, margin: 10 }
    },
    visualMap: {
      min: 0,
      max: 300, // 调整后的月度聚合最大值
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
