import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip } from 'recharts';
import { ChartTooltip } from '@/components/ui/chart-tooltip';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { getStaticCalendarData, MOCK_DASHBOARD_DATA } from '../api/dashboardApi';

// --- View 1: Month View - Calendar Grid ---
const CalendarGrid = ({ data }) => {
  return (
    <div className="flex justify-center w-full">
      <div className="grid grid-cols-7 gap-2 max-w-fit">
        {['S','M','T','W','T','F','S'].map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1 w-10">{d}</div>
        ))}
        {data.map((day, i) => (
          <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xs relative group cursor-pointer"
              style={{
                  backgroundColor: day.studyDuration > 0 
                    ? `oklch(0.6 0.18 295 / ${Math.min(day.studyDuration / 120, 1)})` 
                    : 'var(--muted)'
              }}
          >
            <span className={`z-10 ${day.studyDuration > 60 ? 'text-white' : 'text-foreground'}`}>
              {day.day}
            </span>
              {/* Calendar Tooltip using shadcn */}
            <TooltipProvider>
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <span className="absolute inset-0 z-20" />
                    </TooltipTrigger>
                    <TooltipContent className="p-0 border-none bg-transparent shadow-none" side="top">
                        {/* Reuse ChartTooltip visuals but manually pass props since we are not in Recharts context */}
                        <ChartTooltip 
                            active={true}
                            label={`Day ${day.day}`}
                            payload={[{ dataKey: 'studyDuration', value: day.studyDuration }, { dataKey: 'ghostStudyDuration', value: 0 }]}
                            className="scale-90 origin-bottom"
                        />
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- View 2: Day View - 24h Area Chart ---

const HourlyChart = ({ data }) => {
    return (
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorStudyHourly" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-study-primary)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--color-study-primary)" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis 
                        dataKey="label" 
                        tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} 
                        interval={3} 
                        axisLine={false}
                        tickLine={false}
                    />
                    <RechartsTooltip 
                        content={<ChartTooltip title="专注时刻" />}
                        cursor={{ stroke: 'var(--border)', strokeDasharray: '4 4' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="studyDuration" 
                        stroke="var(--color-study-primary)" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorStudyHourly)" 
                        animationDuration={1000}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export const DetailList = ({ level, selectedData }) => {
  // Generate data based on level
  const content = useMemo(() => {
    if (level === 'month') {
        // Mock generating calendar days for the selected month
        return {
            title: `${selectedData?.label || 'Month'} Daily Log`,
            component: <CalendarGrid data={getStaticCalendarData(selectedData?.label)} />
        };
    } else {
        // level === 'day' or default
        return {
            title: `${selectedData?.label || 'Today'} Hourly Focus`,
            component: <HourlyChart data={MOCK_DASHBOARD_DATA.dayDetails['DEFAULT']} />
        };
    }
  }, [level, selectedData]);

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden min-h-[300px]">
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
            {content.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
            <motion.div
                key={level + (selectedData?.label || 'default')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
            >
                {content.component}
            </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
