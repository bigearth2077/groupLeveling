import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Area, 
  Bar, 
  Line, 
  XAxis, 
  CartesianGrid, 
  Tooltip,
  YAxis
} from 'recharts';
import { useRhythmChart } from '../hooks/useRhythmChart';
import { ChartTooltip } from '@/components/ui/chart-tooltip';

export const RhythmChart = ({ onDrillDown, onViewModeChange }) => {
  const { 
    viewMode, 
    data, 
    loading, 
    handleBarClick, 
    handleViewModeChange 
  } = useRhythmChart(onDrillDown, onViewModeChange);

  if (loading) {
    return (
        <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden min-h-[380px] flex items-center justify-center">
            <div className="text-muted-foreground animate-pulse">Loading Rhythm...</div>
        </Card>
    );
  }

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">专注节奏</CardTitle>
        <div className="flex bg-muted/50 p-1 rounded-xl space-x-1">
          <Button 
            variant={viewMode === 'month' ? 'default' : 'ghost'} 
            size="sm" 
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => handleViewModeChange('month')}
          >
            月视图
          </Button>
          <Button 
            variant={viewMode === 'week' ? 'default' : 'ghost'} 
            size="sm" 
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => handleViewModeChange('week')}
          >
            周视图
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={data} 
              margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
              onClick={(e) => {
                if (e && e.activePayload) {
                 handleBarClick(e.activePayload[0].payload, e.activeTooltipIndex);
                }
              }}
            >
              <defs>
                <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-study-primary)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--color-study-primary)" stopOpacity={0.3}/>
                </linearGradient>
                <linearGradient id="gradientStudyBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-study-primary)" stopOpacity={1}/>
                  <stop offset="100%" stopColor="var(--color-study-primary)" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              
              <XAxis 
                dataKey="label" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} 
                minTickGap={10}
              />
              <YAxis hide />
              
              <Tooltip 
                content={<ChartTooltip />}
                cursor={{ 
                  stroke: 'var(--color-study-primary)', 
                  strokeWidth: 2, 
                  strokeDasharray: '5 5',
                  fill: 'transparent'
                }}
                offset={20}
                isAnimationActive={true}
                animationDuration={200}
              />

              {/* Background Area */}
              <Area 
                type="monotone" 
                dataKey="studyDuration" 
                stroke="none" 
                fill="url(#colorStudy)" 
                fillOpacity={0.15} 
                isAnimationActive={true}
              />

              {/* Stacked Bars */}
              <Bar 
                dataKey="studyDuration" 
                stackId="a" 
                fill="url(#gradientStudyBar)" 
                radius={[0, 0, 4, 4]} 
                barSize={viewMode === 'month' ? 12 : 24}
                animationDuration={1000}
                cursor="pointer"
              />
              <Bar 
                dataKey="restDuration" 
                stackId="a" 
                fill="var(--color-rest-light)" 
                radius={[4, 4, 0, 0]} 
                barSize={viewMode === 'month' ? 12 : 24}
                animationDuration={1000}
                cursor="pointer"
              />

              {/* Ghost Data Line */}
              <Line 
                type="monotone" 
                dataKey="ghostStudyDuration" 
                stroke="var(--color-ghost-gray)" 
                strokeWidth={2} 
                strokeDasharray="5 5" 
                dot={false} 
                opacity={0.6}
                animationDuration={2000}
              />
              
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
