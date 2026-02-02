import React from 'react';
import { cn } from '@/lib/utils';

export const TomatoClockFace = ({ variant = 'solid', progress = 0, className }) => {
  const isSolid = variant === 'solid';

  // 水滴形状路径 (基于 12 点钟方向，尖端朝向圆心)
  // M100 70: 尖端 (靠近圆心，稍微往外移一点点，避免太拥挤)
  // 贝塞尔控制点解释：
  // 绘制一个“内尖外圆”的水滴
  // 起点 M100 75 (靠近圆心)
  // 向外扩展并并在 M100 35 处形成圆形闭合
  const dropPath = "M100 76 C94 65 90 48 90 42 C90 32 110 32 110 42 C110 48 106 65 100 76 Z";

  // 8个水滴心室 (Seeds/Segments)
  // 围绕中心旋转 8 次。根据进度点亮。
  const totalSeeds = 8;
  // 计算当前应该点亮到第几个籽
  // progress 是 0~100，映射到 0~8
  // 当 progress = 0 (刚开始)，0 个亮
  // 当 progress = 100 (结束)，8 个全亮
  const activeSeedsCount = Math.floor((progress / 100) * totalSeeds);

  return (
    <svg 
      viewBox="0 0 200 200" 
      className={cn("w-full h-full transition-all duration-700", className)}
      aria-hidden="true"
    >
      {/* ... 外层圆环保持不变 ... */}
      {/* 外圈 (Outer Ring) */}
      <circle 
        cx="100" 
        cy="100" 
        r="96" 
        className={cn(
          "transition-all duration-700 ease-in-out",
          isSolid 
            ? "fill-primary stroke-none" 
            : "fill-transparent stroke-primary stroke-4"
        )}
      />
      
      <circle 
        cx="100" 
        cy="100" 
        r="82" 
        className={cn(
          "transition-all duration-700 ease-in-out",
          isSolid 
            ? "fill-transparent stroke-primary-foreground/10 stroke-2" 
            : "fill-transparent stroke-primary stroke-2"
        )}
      />

      <g className="origin-center">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => {
          // 判断当前籽是否被“点亮”
          // index 从 0 开始 (12点钟方向)
          // 如果 activeSeedsCount > index，说明进度已经盖过了这个籽，应当点亮
          // 注意：通常进度是顺时针增长，所以 index 0 是第一个亮
          const isLit = index < activeSeedsCount;

          return (
            <g key={index} transform={`rotate(${angle} 100 100)`}>
              <path 
                d={dropPath}
                className={cn(
                  "transition-all duration-700 ease-in-out", 
                  // 基础样式
                  isSolid ? "stroke-none" : "stroke-primary stroke-2",
                  
                  // 点亮逻辑 (Living Tomato Logic)
                  isLit 
                    ? (isSolid ? "fill-primary-foreground/90" : "fill-primary") // 亮起状态：高亮白(Solid) 或 实心红(Outline)
                    : (isSolid ? "fill-primary-foreground/20" : "fill-transparent") // 熄灭状态：暗淡(Solid) 或 透明(Outline)
                )}
              />
            </g>
          );
        })}
      </g>
      
      {/* ... 中心圆点 ... */}
      <circle 
        cx="100" 
        cy="100" 
        r="6" 
        className={cn(
            "transition-all duration-700 ease-in-out",
            isSolid 
              ? "fill-primary-foreground/20" 
              : "fill-transparent"
          )}
      />
    </svg>
  );
};
