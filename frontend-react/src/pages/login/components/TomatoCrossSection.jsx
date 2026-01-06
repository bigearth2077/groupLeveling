import React from 'react';

// 定义单个心室（果冻区域 + 种子）的组件，以便复用，保证对称和规律性
const Chamber = ({ rotation }) => (
  <g transform={`rotate(${rotation} 250 250)`}>
    {/* 
      1. 果冻状心室 (Jelly Chamber)
      这是番茄内部最"湿润"的部分。
      我们使用 primary 颜色，但降低不透明度，并混合 darker 模式来模拟深邃的果冻感。
    */}
    <path
      d="M250 230 
         Q 280 230 330 180 
         Q 360 140 340 100 
         Q 310 50 250 50 
         Q 190 50 160 100 
         Q 140 140 170 180 
         Q 220 230 250 230 Z"
      className="fill-primary/60 mix-blend-multiply" 
    />

    {/* 
      2. 种子 (Seeds)
      真实番茄的种子是附着在中心胎座上的。
      这里让种子沿着心室的内侧边缘整齐排列。
      颜色使用 white/yellow 混合，但保持低饱和度以融入 primary 色调。
    */}
    <g className="fill-yellow-50/80 drop-shadow-sm">
      {/* 右侧种子列 */}
      <ellipse cx="270" cy="190" rx="5" ry="8" transform="rotate(-15 270 190)" />
      <ellipse cx="295" cy="165" rx="5" ry="8" transform="rotate(-25 295 165)" />
      <ellipse cx="308" cy="135" rx="5" ry="8" transform="rotate(-35 308 135)" />
      
      {/* 左侧种子列 */}
      <ellipse cx="230" cy="190" rx="5" ry="8" transform="rotate(15 230 190)" />
      <ellipse cx="205" cy="165" rx="5" ry="8" transform="rotate(25 205 165)" />
      <ellipse cx="192" cy="135" rx="5" ry="8" transform="rotate(35 192 135)" />
    </g>
  </g>
);

export function TomatoCrossSection({ className = '', ...props }) {

  return (
    <svg
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full ${className}`}
      {...props}
    >
      {/* 
        背景层：果肉 (Flesh)
        这是整个番茄的主体颜色，使用你的 primary 颜色。
        opacity-90 让它看起来不那么死板。
      */}
      <circle cx="250" cy="250" r="245" className="fill-primary" />
      
      {/* 
        外皮 (Skin)
        稍微深一点的轮廓，增加体积感
      */}
      <circle cx="250" cy="250" r="245" fill="none" className="stroke-primary stroke-8 opacity-100 brightness-75" />

      {/* 
        内部结构组：通过旋转生成 3 个完美对称的心室 
      */}
      <g>
        <Chamber rotation={0} />
        <Chamber rotation={120} />
        <Chamber rotation={240} />
      </g>

      {/* 
        中心核心 (Core)
        连接所有心室的中心部分，稍微模糊一点，过渡自然
      */}
      <circle cx="250" cy="250" r="30" className="fill-primary blur-sm" />

      {/* 
        高光 (Highlights) - 极简且克制
        不再使用之前的白色反光，而是使用一种"水光感"
        使用 overlay 混合模式，让高光只提亮 primary 颜色，而不变成纯白
      */}
      <g className="opacity-30 mix-blend-overlay">
        <circle cx="250" cy="250" r="220" fill="url(#gradient-shine)" />
      </g>

      {/* 定义高光渐变，营造微微隆起的球体感 */}
      <defs>
        <radialGradient id="gradient-shine" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

