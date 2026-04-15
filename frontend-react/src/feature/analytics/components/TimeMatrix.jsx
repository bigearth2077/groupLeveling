import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Loader2 } from 'lucide-react';
import { getTimeMatrix } from '../api';

const TimeMatrix = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // X-axis: Hours of the day
  const hours = Array.from({ length: 24 }, (_, i) => `${i}h`);
  // Y-axis: Days of the week (API returns 0=Sunday, 6=Saturday)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch data for the last 30 days
        const res = await getTimeMatrix(30);
        if (res && res.items) {
          // Format for echarts heatmap: [xIndex, yIndex, value] => [hour, day, count]
          const formattedData = res.items.map(item => [item.hour, item.day, item.count]);
          setData(formattedData);
        }
      } catch (error) {
        console.error("Failed to fetch time matrix:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Find maximum value to scale the visual map dynamically
  const maxCount = data.reduce((max, item) => Math.max(max, item[2]), 0);
  // Default to 60 if maxCount is zero to avoid broken scale
  const visualMax = maxCount > 0 ? maxCount : 60; 

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        const hour = hours[params.data[0]];
        const day = days[params.data[1]];
        return `${day} ${hour}<br/>Focus: <b>${params.data[2]} mins</b>`;
      }
    },
    grid: {
      top: 10,
      bottom: 20,
      left: 40,
      right: 10
    },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: {
        show: true
      },
      axisLabel: {
        fontSize: 10,
        color: '#94a3b8'
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: {
        show: true
      },
      axisLabel: {
        fontSize: 10,
        color: '#94a3b8'
      },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    visualMap: {
      min: 0,
      max: visualMax,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: '15%',
      show: false, // Hide legend to stick to clean UI
      inRange: {
        // Light to dark purple/indigo gradient
        color: ['#f8fafc', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81']
      }
    },
    series: [
      {
        name: 'Focus Time',
        type: 'heatmap',
        data: data,
        label: {
          show: false
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: '#fff',
          borderRadius: 4 // Soft squares
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  return (
    <div className="w-full h-[240px]">
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }} 
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

export default TimeMatrix;
