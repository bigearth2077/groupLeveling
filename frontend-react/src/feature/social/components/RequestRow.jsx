import React from 'react';
import { Check, X as XIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TomatoAvatar from './TomatoAvatar';

const RequestRow = ({ request, onAccept, onReject }) => (
  <Card className="flex items-center justify-between p-3 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <TomatoAvatar face={request.face} shade={request.shade} className="w-10 h-10" />
      <div className="flex flex-col">
        <span className="text-sm font-light text-foreground">{request.name}</span>
        <span className="text-xs text-muted-foreground">{request.timeAgo}</span>
      </div>
    </div>
    <div className="flex gap-2">
      {/* 接受按钮 */}
      <Button 
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all shadow-sm"
        onClick={() => onAccept && onAccept(request)}
      >
        <Check size={16} strokeWidth={3} />
      </Button>
      {/* 拒绝按钮 */}
      <Button 
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
        onClick={() => onReject && onReject(request)}
      >
        <XIcon size={16} strokeWidth={3} />
      </Button>
    </div>
  </Card>
);

export default RequestRow;
