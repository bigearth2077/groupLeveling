import React, { useState, useRef, useEffect } from 'react';
import { Settings, X, GripHorizontal } from 'lucide-react';

const ProfileCard = ({ isOpen, onClose, onLogout }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // 初始化数据
  useEffect(() => {
    if (isOpen && !userInfo) {
      // setLoading(true); // Removed to avoid warning, relied on initial state
      
      const fetchUser = () => new Promise(resolve => setTimeout(() => resolve({
        avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Felix",
        focusHours: 124,
        nickname: "专注的番茄",
        bio: "考研冲刺中，保持热爱，奔赴山海...",
        tags: ["前端开发", "英语"]
      }), 500));

      fetchUser().then(data => {
        setUserInfo(data);
        setLoading(false);
      });
    }
  }, [isOpen, userInfo]);

  // 模拟 API (用于更新)
  const updateUser = (data) => new Promise(resolve => setTimeout(() => resolve(data), 300));

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);

  // 乐观更新通用函数
  const handleUpdate = (newData) => {
    // 1. 立即更新 UI (Optimistic)
    setUserInfo(newData);
    // 2. 发送请求 (Mock)
    updateUser(newData).then(() => {
      console.log("Saved:", newData);
    }).catch(() => {
      alert("保存失败，请重试"); // 实际应回滚
    });
  };

  // 拖拽逻辑
  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !cardRef.current) return;
      
      let newX = e.clientX - dragStartPos.current.x;
      let newY = e.clientY - dragStartPos.current.y;
      
      // 边界计算 (假设卡片初始居中)
      // Max offset = (ViewportDimension - CardDimension) / 2
      const cardRect = cardRef.current.getBoundingClientRect();
      const maxX = (window.innerWidth - cardRect.width) / 2;
      const maxY = (window.innerHeight - cardRect.height) / 2;

      // Clamp values
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
  }, [isDragging]);

  // 标签管理逻辑
  const handleAddTag = () => {
    const newTag = prompt("请输入新标签名称：");
    if (newTag && !userInfo.tags.includes(newTag)) {
      handleUpdate({ ...userInfo, tags: [...userInfo.tags, newTag] });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    if (confirm(`确定要删除标签 #${tagToRemove} 吗？`)) {
      handleUpdate({ ...userInfo, tags: userInfo.tags.filter(t => t !== tagToRemove) });
    }
  };



  if (!isOpen) return null;
  if (loading && !userInfo) return null; // 或返回骨架屏

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* 背景遮罩 - 点击关闭 */}
      <div 
        className="absolute inset-0 bg-transparent" 
        onClick={() => {
          if (showSettings) setShowSettings(false);
          else onClose();
        }}
        style={{ pointerEvents: 'auto' }}
      />

      {/* 卡片主体 */}
      <div 
        ref={cardRef}
        className="relative w-[380px] p-6 rounded-[24px] pointer-events-auto select-none transition-shadow duration-300 ease-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.8)',
          boxShadow: isDragging ? '0 20px 50px rgba(0, 0, 0, 0.12)' : '0 12px 40px rgba(0, 0, 0, 0.08)',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* 顶部拖拽区域 (覆盖整个卡片背景，但让 interactive 元素浮在上面) */}
        <div 
          className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing rounded-[24px]"
          onMouseDown={handleMouseDown}
        />

          {/* 工具栏 (pointer-events-auto) */}
          <div className="absolute top-2 right-2 flex gap-1 pointer-events-auto z-50">
            <div className="relative">
              <button 
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent"
                title="设置"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(!showSettings);
                }}
              >
                <Settings size={14} />
              </button>
              
              {/* 设置下拉菜单 */}
              {showSettings && (
                <div 
                  className="absolute right-0 top-full mt-2 w-32 bg-popover/90 backdrop-blur-md border border-border shadow-xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    className="w-full text-left px-4 py-2 text-xs text-muted-foreground hover:bg-accent transition-colors"
                    onClick={() => {
                      alert("修改密码功能开发中");
                      setShowSettings(false);
                    }}
                  >
                    修改密码
                  </button>
                  <div className="h-px bg-border mx-2"></div>
                  <button 
                    className="w-full text-left px-4 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => {
                      if (confirm("确定要退出登录吗？")) {
                        onLogout && onLogout();
                      }
                      setShowSettings(false);
                    }}
                  >
                    退出登录
                  </button>
                </div>
              )}
            </div>

            <button 
              className="p-1.5 text-muted-foreground hover:text-white transition-colors rounded-full hover:bg-primary"
              title="关闭"
              onClick={onClose}
            >
              <X size={14} />
            </button>
          </div>

        {/* 内容层 (z-index > 0) */}
        <div className="relative z-10 pointer-events-none">
          
          <div className="flex gap-6 items-start">
            {/* 左侧：视觉区 */}
            <div className="flex flex-col items-center gap-3 w-[80px] pointer-events-auto">
              <div 
                className="relative w-20 h-20 rounded-full border-2 border-background shadow-sm overflow-hidden group cursor-pointer"
                title="点击更换头像"
              >
                <img 
                  src={userInfo.avatar} 
                  alt="User Avatar" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center text-white text-xs font-medium">
                  更换
                </div>
                {/* 在线状态点 */}
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-[3px] border-background rounded-full z-10"></span>
              </div>
              
              <div className="text-center mt-1">
                <span className="block text-[10px] text-muted-foreground mb-0.5">专注时长</span>
                <span className="text-lg font-extrabold text-primary tabular-nums">
                  {userInfo.focusHours}<span className="text-xs font-normal ml-0.5">h</span>
                </span>
              </div>
            </div>

            {/* 右侧：信息区 (pointer-events-auto for inputs) */}
            <div className="flex-1 flex flex-col pt-1 gap-1.5 min-w-0 pointer-events-auto">
               {/* 昵称 */}
               <div className="group border-b border-transparent focus-within:border-primary transition-colors relative">
                 <input 
                   type="text" 
                   value={userInfo.nickname} 
                   onChange={(e) => setUserInfo({...userInfo, nickname: e.target.value})}
                   onBlur={() => handleUpdate(userInfo)}
                   className="w-full bg-transparent text-lg font-bold text-primary outline-none py-1 placeholder-muted-foreground"
                   spellCheck="false"
                 />
                 <Settings size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground opacity-0 group-hover:opacity-100 pointer-events-none" />
               </div>

               {/* 个性签名 */}
               <div 
                 className="text-[13px] text-muted-foreground leading-relaxed py-0.5 px-1 -ml-1 rounded hover:bg-accent transition-colors outline-none empty:before:content-['添加个性签名...'] empty:before:text-muted-foreground cursor-text"
                 contentEditable
                 suppressContentEditableWarning
                 onBlur={(e) => handleUpdate({...userInfo, bio: e.target.innerText})}
               >
                 {userInfo.bio}
               </div>

               {/* 标签云 */}
               <div className="flex flex-wrap gap-2 mt-2">
                 {userInfo.tags.map((tag, index) => (
                   <span 
                     key={index}
                     className="px-2.5 py-1 rounded-[20px] bg-card border border-border text-[11px] text-muted-foreground cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                     onClick={() => handleRemoveTag(tag)}
                     title="点击删除"
                   >
                     # {tag}
                   </span>
                 ))}
                 <button 
                   className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground flex items-center justify-center hover:border-primary hover:text-primary hover:bg-card transition-all text-sm leading-none pb-0.5"
                   title="添加新标签"
                   onClick={handleAddTag}
                 >
                   +
                 </button>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
