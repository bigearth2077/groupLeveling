# PomodoroDock 组件技术演进与视觉实现解析

本文档旨在记录 `PomodoroDock` 组件的核心设计理念、CSS 动画技巧及交互优化方案，供团队交流学习。

## 1. 核心视觉风格：现代毛玻璃 (Modern Glassmorphism)

为了营造高端、“浮动”的视觉质感，我们大量使用了 CSS Backdrop Filter 技术。

### 关键实现

```css
/* 扇形背景面板 */
.dock-bg {
  @apply bg-primary/95; /* 主色调带 5% 透明度，保证底色显现 */
  @apply backdrop-blur-md; /* 核心：背景模糊，产生景深感 */
  @apply border-t border-white/20; /* 顶部高光描边，模拟光照边缘 */
  @apply shadow-2xl; /* 深度阴影，强化悬浮感 */
}

/* 图标按钮 */
.icon-btn {
  @apply bg-white/10; /* 极淡的白色半透明背景 */
  @apply hover:bg-white/20; /* 悬停时加深，提升对比度 */
  @apply border border-white/10; /* 微弱边框，维持轮廓 */
  @apply shadow-sm;
}
```

> **技巧**：使用 `white/10` (opacity) 而不是固定的 hex 颜色，可以确保组件在任何背景图片上都能自然融合。

---

## 2. 动画编排：物理手感与交错效应

### 2.1 弹性物理曲线 (Elastic Easing)

我们没有使用线性的 `ease-in-out`，而是定制了贝塞尔曲线，模拟发生器弹出的物理回弹效果。

```javascript
// transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
```

- **P2 (1.56)**: 超过 1.0 的值意味着动画会“冲过头”通过目标点，然后再拉回来。这就产生了“弹跳 (Spring)”的效果，让 Dock 弹出来时有种 Q 弹的质感。

### 2.2 交错动画 (Staggered Animation)

为了避免所有图标同时出现造成的视觉拥挤，我们使用了 `delay` 对每个图标进行编排。

```jsx
style={{
    transitionDelay: `${index * 50}ms` // index 0->0ms, 1->50ms, 2->100ms...
}}
```

这创造了“扇面依次展开”的流畅视觉流。

---

## 3. 布局算法：三角函数扇形定位

不再依赖 CSS Grid 或 Flexbox，我们使用几何数学公式进行绝对定位，以实现精准的 180° 扇形分布。

```javascript
// 极坐标转笛卡尔坐标系
const getPosition = (index) => {
  // 将角度转换为弧度
  // fixedAngles 是预设的一组角度：[165, 127.5, 90, 52.5, 15]
  const angleRad = (fixedAngles[index] * Math.PI) / 180;

  // x = r * cos(θ)
  const x = RADIUS * Math.cos(angleRad);
  // y = r * sin(θ)
  const y = RADIUS * Math.sin(angleRad);

  return { x, y };
};
```

- **优势**：相比 CSS `rotate`，这种计算方式保证图标本身不旋转（始终垂直），只改变位置。

---

## 4. 交互难点与解决方案

### 4.1 点击穿透陷阱 (The Z-Index & Pointer-Events Trap)

**问题**：为了检测鼠标 hover，我们覆盖了一个大面积的透明 `div`。但这导致位于底层的 Dock 图标（尤其是右侧图标）无法接收点击事件，或者被居中偏移的元素遮挡。

**解决方案**：

1.  **分层事件控制**：

    - 容器层：`pointer-events-none`（允许鼠标穿透，不挡下层）
    - 交互层：必要时 `pointer-events-auto`
    - 按钮层：显式声明 `pointer-events-auto` 且 `z-index: 50`

2.  **绝对定位修正**：
    对于绝对定位的居中元素，必须确保使用标准的 Centering Trick，否则容器宽度的延伸会覆盖兄弟元素。
    ```jsx
    className = "absolute left-1/2 -translate-x-1/2"; // 强制收束容器宽度，避免遮挡左右
    ```

### 4.2 动画延迟叠加 Bug (Active State Latency)

**问题**：进场动画设置了 `transition-delay`，导致用户点击图标（进入 `active` 状态）时，缩放动画也被延迟执行，造成“点击没反应”的错觉。

**解决方案**：这是一种 CSS 优先级覆盖技巧。

```css
/* 必须使用 !important (Tailwind中的 !) 来强制移除点击时的延迟 */
.btn-active {
  @apply active:!delay-0; /* 立即响应 */
  @apply active:!duration-75; /* 极速回弹 */
}
```

通过分离“进场动画”和“交互动画”的时间轴，实现了既有华丽进场，又有灵敏反馈。

---

## 5. 开发建议

- 在处理重叠布局时，务必打开浏览器的 **3D View** 或 **Layers** 面板检查 `z-index` 层级。
- 对于复杂动画，避免直接操作 `width/height`，尽量使用 `transform: scale/translate`，以触发 GPU 硬件加速 (Composite Layers)。
