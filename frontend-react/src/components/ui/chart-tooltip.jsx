import * as React from "react"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * 通用图表 Tooltip 组件，基于 shadcn/ui 的 Tooltip 样式定制。
 * 支持传入 active, payload, label 等 Recharts 默认 props，虽然 Recharts 的 Tooltip 机制略有不同。
 * 
 * Recharts 的 Tooltip 是作为 Charts 的一个子组件渲染的，它不直接使用 Radix UI 的 Trigger 机制。
 * 因此这里我们主要复用 TooltipContent 的样式，构建一个独立的展示组件。
 * 
 * @param {boolean} active - 是否激活
 * @param {Array} payload - 数据集
 * @param {string} label - 当前 X 轴标签
 * @param {string} title - 可选标题，默认使用 label
 * @param {Array} items - 定制化显示项配置 [{ label: '专注', value: 10, color: 'red' }]
 */
export const ChartTooltip = ({ active, payload, label, title, className }) => {
  if (active && payload && payload.length) {
    // 默认数据解析逻辑，如果外部没有传入自定义逻辑，尝试自动推断
    const study = payload.find(p => p.dataKey === 'studyDuration')?.value || 0;
    const ghost = payload.find(p => p.dataKey === 'ghostStudyDuration')?.value || 0;
    const diff = study - ghost;
    
    let TrendIcon = Minus;
    let trendColor = 'text-muted-foreground';
    
    if (diff > 5) {
      TrendIcon = ArrowUp;
      trendColor = 'text-emerald-500';
    } else if (diff < -5) {
      TrendIcon = ArrowDown;
      trendColor = 'text-rose-500';
    }

    return (
      <div className={`bg-popover/95 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl p-3 min-w-[140px] animate-in fade-in zoom-in-95 duration-200 ${className}`}>
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-border/50">
          <span className="text-sm font-medium text-foreground">{title || label}</span>
          <div className={`flex items-center text-xs ${trendColor} bg-muted/30 px-1.5 py-0.5 rounded-full`}>
            <TrendIcon className="w-3 h-3 mr-0.5" />
            <span>{Math.abs(diff)}m</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center">
              <span className="w-2 h-2 rounded-full bg-[var(--color-study-primary)] mr-2"></span>
              专注
            </span>
            <span className="font-semibold tabular-nums text-foreground">{study} min</span>
          </div>
          {ghost > 0 && (
            <div className="flex items-center justify-between text-xs opacity-70">
              <span className="text-muted-foreground flex items-center">
                <span className="w-2 h-2 rounded-full bg-[var(--color-ghost-gray)] mr-2"></span>
                昨日
              </span>
              <span className="font-medium tabular-nums text-foreground">{ghost} min</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};
