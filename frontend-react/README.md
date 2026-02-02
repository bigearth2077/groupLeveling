📝 组件设计需求单：The Learning Flow Dashboard

1. 核心理念与风格定义
   组件名称： LearningFlowDashboard

视觉隐喻： “呼吸与律动”。学习不是机械的堆叠，而是有张有弛的波浪。

UI 风格：

无边框设计 (Border-less)： 移除图表外围的硬边框，让图表融入背景。

圆润感 (Rounded)： 所有的柱状图顶端、卡片圆角均采用 rounded-2xl 或 rounded-3xl。

Shadcn/Tailwind 配置： 使用 slate-50 或极淡的 primary/5 作为背景色，强调 primary 色调的渐变应用。

2. 布局结构 (DOM 结构意向)
   组件从上到下分为三个沉浸层级：

A. 顶部：情感化问候区 (Dynamic Header)
位置： 页面左上角，大字体，高留白。

功能（动态问候语）： 根据当前时间 + 用户的 study 数据总时长动态生成。

逻辑示例：

Total > 4h: "不可思议的专注力！今天的你正在闪闪发光 ✨"

Total < 1h: "万事开头难，准备好开始今天的探索了吗？🌱"

Rest > Study: "适当的休息是为了走更远的路，要来杯咖啡吗？☕"

视觉： 字体使用 font-bold + tracking-tight，搭配一个随状态变化的 Emoji 或图标。

B. 核心：沉浸式交互图表 (The Rhythm Chart)
图表类型： 混合型图表（Combo Chart）。

默认视图（宏观）： 平滑样条面积图 (Spline Area Chart)。展示总时长的趋势，像连绵的山脉。

交互视图（微观）： 当鼠标悬停或手指按压时，当前时间点的曲线变为 堆叠柱状图 (Stacked Bar)。

数据可视化逻辑（Study vs Rest）：

专注热力槽 (The Heatmap)：

柱子的下半部分为 study：使用主色调（如 bg-indigo-500），并根据时长深浅变化（热力图效果）。

柱子的上半部分为 rest：使用半透明色或斜纹填充（bg-indigo-100 或 pattern-dots），代表轻松的间歇。

幽灵数据 (Ghost Data)：

在主图表背后，绘制一条淡灰色的虚线（stroke-slate-300，stroke-dasharray），代表**“昨日同期”或“上周平均”**。

作用： 让用户不需看具体数字，凭借线条的高低关系就能直观感知“今天是否比昨天更努力”。

C. 底部：详细数据联动区

- **智能钻取 (Drill-down)**：
  - **月模式下**：点击图表中的“某个月”，底部卡片流展示该月 **4周** 的学习时间柱状图。
  - **周模式下**：点击图表中的“某一天”，底部卡片流展示该日 **24小时** 的学习时间柱状图。
- **视觉反馈**：
  - 卡片进入视口时带有 `framer-motion` 的交错上浮动画。

如果没有选中，默认显示“今日概览”。

3. 关键交互细节 (Interaction Specs)
   这是实现“小米风格”和“高可玩性”的关键：

🖱️ 悬停与跟随 (Hover & Tooltip)
指尖跟随： 当鼠标/手指在图表区域滑动时，显示一根垂直的高亮引导线 (Cursor Line)。

磁吸效果： 引导线会自动吸附到最近的数据点上。

Tooltip 设计：

不要使用传统的黑色小方框。

设计： 在图表顶部中央显示一个悬浮的“动态胶囊”，实时显示：14:00 - 15:00 | 专注 45min | 休息 15min。

对比反馈： 如果当前点高于幽灵数据（昨日），胶囊旁显示一个绿色的向上小箭头 ↑；反之显示灰色的平级或向下箭头。

👆 点击与反馈 (Click & Feedback)
弹性动画： 点击某个数据柱时，该柱子会有一个轻微的 scale-95 到 scale-110 的弹跳动画（Bouncy effect）。

聚焦模式： 点击后，除了被选中的柱子保持高亮（全色），其他未选中的柱子透明度降低（Opacity 0.3），让用户的注意力完全集中在选中的时间段上。

4. 技术实现建议 (Tech Stack Hints)
   鉴于你使用 Tailwind + shadcn/ui，以下是库的推荐配置：

图表库： 推荐使用 Recharts。它在 React 中非常流行，且高度可定制，能完美配合 Tailwind 的 class。

AreaChart 用于背景流。

BarChart (Stacked) 用于具体的 study/rest 展示。

ReferenceLine 用于绘制“目标线”。

动画库： Framer Motion。用于数值滚动的动画（Counter animation）和点击柱子时的弹跳效果。

日期处理： date-fns。处理日/月/年的时间轴计算。

5. 数据结构模拟 (Mock Data Interface)
   后端保存的数据类型如下，需要根据这些数据设计图表（可以根据图表然后端设计接口）
   "type": "learning",
   "startTime": "2025-08-14T12:00:00Z",
   "endTime": "2025-08-14T12:50:00Z",
   "durationMinutes": 50,
   "createdAt": "2025-08-14T12:00:05Z"

interface DashboardProps {
data: TimeSlot[];
period: 'day' | 'week' | 'month'; // 决定图表粒度
userName: string;
}
🎨 灵感彩蛋：给你的色彩建议
既然是圆润极简风，建议为 study 和 rest 设定一组治愈系配色（Tailwind Config）：

Study (专注): bg-violet-500 (主色) 到 bg-fuchsia-400 (高专注时的渐变)

Rest (休息): bg-teal-200 (清新的薄荷色) 或 bg-slate-200 (中性色)

Ghost (幽灵): stroke-slate-300/50 (若隐若现)
