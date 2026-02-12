
import React, { useRef, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { useProfile } from './hooks/useProfile';
import { useDraggable } from './hooks/useDraggable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ProfileCard = ({ isOpen, onClose, onLogout }) => {
  const {
    userInfo,
    setUserInfo,
    loading,
    isAddingTag,        // 新增状态
    setIsAddingTag,     // 设置新增状态
    handleUpdate,
    confirmAddTag,      // 确认添加标签
    handleAddTag,       // 触发添加模式
    handleRemoveTag,
    closeSettings
  } = useProfile(isOpen);

  const {
    position,
    isDragging,
    elementRef, // Must be attached to the card element
    handleMouseDown
  } = useDraggable();

  // 标签输入框引用，用于自动聚焦
  const tagInputRef = useRef(null);

  useEffect(() => {
    if (isAddingTag && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [isAddingTag]);

  if (!isOpen) return null;
  if (loading && !userInfo) return null; // 或返回骨架屏

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* 背景遮罩 - 点击关闭 */}
      <div 
        className="absolute inset-0 bg-transparent" 
        onClick={() => {
          closeSettings();
          onClose();
        }}
        style={{ pointerEvents: 'auto' }}
      />

      {/* 卡片主体 */}
      <div 
        ref={elementRef}
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-accent">
                    <Settings size={14} className="text-muted-foreground hover:text-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => alert("修改密码功能开发中")}>
                    修改密码
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => {
                      if (confirm("确定要退出登录吗？")) {
                        onLogout && onLogout();
                      }
                    }}
                  >
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-primary hover:text-white"
                onClick={onClose}
            >
              <X size={14} className="text-muted-foreground" />
            </Button>
          </div>

        {/* 内容层 (z-index > 0) */}
        <div className="relative z-10 pointer-events-none">
          
          <div className="flex gap-6 items-start">
            {/* 左侧：视觉区 */}
            <div className="flex flex-col items-center gap-3 w-[80px] pointer-events-auto">
              <div 
                className="relative group cursor-pointer"
                title="点击更换头像"
              >
                <Avatar className="h-20 w-20 border-2 border-background shadow-sm">
                  <AvatarImage src={userInfo.avatar} alt="User Avatar" />
                  <AvatarFallback>{userInfo.nickname?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="absolute inset-0 bg-black/30 hidden group-hover:flex items-center justify-center text-white text-xs font-medium rounded-full z-10">
                  更换
                </div>
                {/* 在线状态点 */}
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-[3px] border-background rounded-full z-20"></span>
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
               <div className="flex flex-wrap gap-2 mt-2 items-center">
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
                 
                 {/* 新增标签按钮或输入框 */}
                 {isAddingTag ? (
                   <Input
                     ref={tagInputRef}
                     type="text"
                     className="h-6 w-20 px-2.5 py-1 rounded-[20px] bg-card border-primary text-[11px] outline-none shadow-sm focus-visible:ring-0"
                     placeholder="New tag"
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.currentTarget.blur();
                       }
                       if (e.key === 'Escape') setIsAddingTag(false);
                     }}
                     onBlur={(e) => confirmAddTag(e.target.value)}
                   />
                 ) : (
                   <button 
                     className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground flex items-center justify-center hover:border-primary hover:text-primary hover:bg-card transition-all text-sm leading-none pb-0.5"
                     title="添加新标签"
                     onClick={handleAddTag}
                   >
                     +
                   </button>
                 )}
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
