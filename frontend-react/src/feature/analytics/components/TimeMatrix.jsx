import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Loader2 } from 'lucide-react';
import { getTimeMatrix } from '../api';

const TimeMatrix = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // X轴：一天中的小时
  const hours = Array.from({ length: 24 }, (_, i) => `${i}h`);
  // Y轴：一周中的天（API返回0=周日，6=周六）
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 获取最近30天的数据
        const res = await getTimeMatrix(30);
        if (res && res.items) {
          // echarts热力图格式：[x索引, y索引, 值] => [小时, 天, 计数]
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

  // 查找最大值以动态调整视觉映射比例
  const maxCount = data.reduce((max, item) => Math.max(max, item[2]), 0);
  // 若maxCount为零则默认设为60，避免比例异常
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
      show: false, // 隐藏图例以保持简洁UI
      inRange: {
        // 浅紫到深紫/靛蓝渐变
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
          borderRadius: 4 
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
    <div className="w-full overflow-x-auto no-scrollbar py-2">
      <div style={{ minWidth: '600px' }}>
        <div className="h-[200px]">
          <ReactECharts 
            option={option} 
            style={{ height: '100%', width: '100%' }} 
            opts={{ renderer: 'svg' }}
          />
        </div>
      </div>
    </div>
  );
};

export default TimeMatrix;
