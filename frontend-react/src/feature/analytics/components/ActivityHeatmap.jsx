import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { Loader2 } from 'lucide-react';
import { getActivityHeatmap } from '../api';

const ActivityHeatmap = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getActivityHeatmap(currentYear);
        if (res && res.items) {
          // Map to echarts calendar format: [date, count]
          const formattedData = res.items.map(item => [item.date, item.count]);
          setData(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch activity heatmap:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentYear]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const option = {
    tooltip: {
      position: 'top',
      formatter: (p) => {
        const format = echarts.format.formatTime('yyyy-MM-dd', p.data[0]);
        return `${format}: ${p.data[1]} mins`;
      }
    },
    visualMap: {
      min: 0,
      max: 120, // 2 hours max color weight
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      top: 0,
      inRange: {
        color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'] // GitHub like colors
      },
      show: false // Hide legend to save space
    },
    calendar: [
      {
        left: 30,
        right: 30,
        top: 20,
        bottom: 10,
        range: currentYear,
        cellSize: ['auto', 14],
        splitLine: { show: false },
        itemStyle: {
          borderWidth: 2,
          borderColor: '#fff',
          borderRadius: 2
        },
        yearLabel: { show: false },
        dayLabel: {
          firstDay: 1,
          nameMap: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          color: '#94a3b8',
          fontSize: 10
        },
        monthLabel: {
          color: '#94a3b8',
          fontSize: 10
        }
      }
    ],
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data
      }
    ]
  };

  return (
    <div className="w-full h-[150px]">
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }} 
        opts={{ renderer: 'svg' }} // Use SVG for crisper edges on high-DPI displays
      />
    </div>
  );
};

export default ActivityHeatmap;
