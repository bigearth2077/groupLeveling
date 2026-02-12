
import { useState, useRef, useEffect } from 'react';

/**
 * 这是一个处理元素拖拽逻辑的 Hook。
 * @returns {{
 *   position: {x: number, y: number},
 *   isDragging: boolean,
 *   elementRef: React.MutableRefObject<HTMLDivElement>,
 *   handleMouseDown: (e: React.MouseEvent) => void
 * }}
 */
export const useDraggable = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementRef = useRef(null);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    // 记录鼠标相对于当前位置的偏移
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !elementRef.current) return;
      
      let newX = e.clientX - dragStartPos.current.x;
      let newY = e.clientY - dragStartPos.current.y;
      
      // 边界计算 (假设卡片初始居中)
      // Max offset = (ViewportDimension - CardDimension) / 2
      const cardRect = elementRef.current.getBoundingClientRect();
      const maxX = (window.innerWidth - cardRect.width) / 2;
      const maxY = (window.innerHeight - cardRect.height) / 2;

      // 限制拖拽范围
      newX = Math.max(-maxX, Math.min(newX, maxX));
      newY = Math.max(-maxY, Math.min(newY, maxY));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]); //依赖 position 可能导致重新绑定，但此处逻辑依赖闭包里的 position.x/y 吗？不，它依赖 `dragStartPos` 和 `e.clientX`.
  // Wait, dragStartPos is ref. No dependency needed.
  // The state `position` is updated inside the effect via `setPosition`.
  // The effect only depends on `isDragging`. 
  // However, `dragStartPos` is updated on `handleMouseDown`.
  
  return {
    position,
    isDragging,
    elementRef,
    handleMouseDown
  };
};
