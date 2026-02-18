import React from 'react';
import { motion } from 'framer-motion';
import { Timer, MoreVertical, MessageCircle, UserMinus, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TomatoAvatar from './TomatoAvatar';

const FriendRow = ({ friend, onRemove }) => {
  const isFocus = friend.status === 'focus';
  
  return (
    <motion.div 
      whileHover={{ scale: 1.02, backgroundColor: 'hsl(var(--background) / 0.6)' }}
      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-background transition-colors group cursor-pointer border border-transparent hover:border-primary/20 hover:shadow-md hover:shadow-primary/5"
    >
      <div className="flex items-center gap-3.5">
        <div className="relative">
          {/* 专注模式旋转环 */}
          {isFocus && (
            <div className="absolute -inset-1.5 rounded-full border-[2.5px] border-primary border-t-transparent animate-spin opacity-80" />
          )}
          
          <TomatoAvatar face={friend.face} shade={friend.shade} className="w-11 h-11" />
          
          {/* 状态点 */}
          <div className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-[2.5px] border-background shadow-sm",
            friend.status === 'online' ? 'bg-chart-1' : 
            friend.status === 'focus' ? 'bg-primary' : 'bg-muted'
          )}></div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-light text-foreground flex items-center gap-1.5">
            {friend.name}
            {isFocus && <Timer size={12} className="text-primary animate-pulse" />}
          </span>
          <div className="flex items-center gap-1.5">
            {/* 状态 Badge */}
            <Badge 
              variant={isFocus ? 'default' : 'secondary'}
              className={cn(
                "px-1.5 py-0 text-[10px] leading-4 h-4 font-normal",
                isFocus && "bg-primary/15 text-primary hover:bg-primary/20 border-0"
              )}
            >
              {isFocus ? `${friend.statusText} · ${friend.timeLeft}` : friend.statusText}
            </Badge>
          </div>
        </div>
      </div>

      {/* 更多操作下拉菜单 */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl">
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <Eye size={14} />
              <span>查看资料</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <MessageCircle size={14} />
              <span>发消息</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onRemove && onRemove()}
            >
              <UserMinus size={14} />
              <span>删除好友</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default FriendRow;
