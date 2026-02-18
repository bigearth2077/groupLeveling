import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Users, 
  Trophy, 
  BookOpen
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSocial } from './hooks/useSocial';
import TomatoCloseButton from './components/TomatoCloseButton';
import VinePattern from './components/VinePattern';
import QuickActionCard from './components/QuickActionCard';
import FriendRow from './components/FriendRow';
import RequestRow from './components/RequestRow';

// --- Mock Data (临时使用，后续将从 API 获取) ---
const MOCK_FRIENDS = [
  { id: '1', name: 'Alex Johnson', face: 'focus', shade: 'red', status: 'focus', statusText: 'Deep Work', timeLeft: '14:20' },
  { id: '2', name: 'Sarah Lee', face: 'happy', shade: 'orange', status: 'online', statusText: 'In Lobby', hasUnread: true },
  { id: '3', name: 'Mike Chen', face: 'sleep', shade: 'pink', status: 'offline', statusText: 'Last seen 2h ago' },
  { id: '4', name: 'Emily Davis', face: 'focus', shade: 'red', status: 'focus', statusText: 'Reading', timeLeft: '05:00' },
  { id: '5', name: 'Chris Wilson', face: 'cool', shade: 'orange', status: 'online', statusText: 'Planning' },
];

const MOCK_REQUESTS = [
  { id: 'r1', name: 'Jessica Bloom', face: 'wink', shade: 'red', timeAgo: '2m ago' },
];

const SocialDrawer = ({ isOpen, onClose }) => {
  const {
    friends,
    requests,
    loading,
    searchQuery,
    activeTab,
    setActiveTab,
    handleSearch,
    handleRequest,
    removeFriend,
    sendRequest
  } = useSocial(isOpen);

  // 使用 Mock 数据（临时）
  const displayFriends = friends.length > 0 ? friends : MOCK_FRIENDS;
  const displayRequests = requests.length > 0 ? requests : MOCK_REQUESTS;

  // --- 列表项动画 Variants ---
  const itemContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent 
        side="right" 
        className="w-full max-w-sm p-0 border-l-0 bg-background/95 backdrop-blur-xl rounded-l-[2.5rem] shadow-2xl shadow-primary/20 overflow-hidden [&>button]:hidden"
      >
        {/* 相对定位容器，用于背景装饰 */}
        <div className="relative h-full flex flex-col">
          
          {/* 背景装饰（藤蔓） */}
          <VinePattern className="absolute top-0 right-0 w-full h-64 text-primary/20 opacity-20 pointer-events-none" />
          <VinePattern className="absolute bottom-0 left-0 w-full h-64 text-primary/20 opacity-20 pointer-events-none transform rotate-180" />

          {/* Header 区域 */}
          <SheetHeader className="px-6 pt-6 pb-2 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-2xl text-primary shadow-inner">
                  <Users size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <SheetTitle className="text-xl font-light tracking-tight leading-none">
                    Community
                  </SheetTitle>
                  <SheetDescription className="text-xs font-medium text-primary mt-0.5">
                    Keep growing!
                  </SheetDescription>
                </div>
              </div>
              
              {/* 番茄关闭按钮 */}
              <TomatoCloseButton onClick={onClose} />
            </div>
          </SheetHeader>

          {/* Quick Actions (卡片区) */}
          <div className="grid grid-cols-2 gap-3 px-6 py-4 z-10">
            <QuickActionCard 
              icon={<BookOpen size={20} className="text-chart-2" />} 
              title="Study Hall" 
              subtitle="128 Online"
              color="bg-chart-2/10 hover:bg-chart-2/20" 
              onClick={() => alert('Study Hall 功能开发中')}
            />
            <QuickActionCard 
              icon={<Trophy size={20} className="text-chart-1" />} 
              title="Leaderboard" 
              subtitle="Top 10"
              color="bg-chart-1/10 hover:bg-chart-1/20" 
              onClick={() => alert('Leaderboard 功能开发中')}
            />
          </div>

          {/* 搜索栏 */}
          <div className="px-6 pb-2 z-10">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <Search size={16} />
              </div>
              <Input 
                type="text" 
                placeholder="Find friends..." 
                className="pl-10 pr-12 py-3 h-auto bg-muted/80 rounded-2xl border-border focus-visible:border-primary/50 focus-visible:bg-background focus-visible:shadow-md focus-visible:shadow-primary/10"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Button 
                size="icon"
                className="absolute inset-y-1.5 right-1.5 w-8 h-8 rounded-xl"
                onClick={() => alert('添加好友功能开发中')}
              >
                <Plus size={16} strokeWidth={3} />
              </Button>
            </div>
          </div>

          <Separator className="mx-6 w-auto opacity-50" />

          {/* Tabs 区域 */}
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab} 
            className="flex-1 flex flex-col min-h-0 z-10"
          >
            <TabsList className="mx-6 mt-2 bg-muted/80 rounded-2xl h-auto p-1.5">
              <TabsTrigger 
                value="friends" 
                className="flex-1 rounded-xl py-2 text-sm font-light data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                Friends
                <Badge 
                  variant={activeTab === 'friends' ? 'secondary' : 'outline'}
                  className="ml-2 px-1.5 py-0 text-[10px] leading-4 h-4"
                >
                  {displayFriends.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="flex-1 rounded-xl py-2 text-sm font-light data-[state=active]:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
              >
                Requests
                <Badge 
                  variant="default"
                  className="ml-2 px-1.5 py-0 text-[10px] leading-4 h-4"
                >
                  {displayRequests.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* 好友列表内容 */}
            <TabsContent value="friends" className="flex-1 overflow-y-auto px-6 py-2 pb-6 mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key="friends"
                  variants={itemContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {displayFriends
                    .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((friend) => (
                      <motion.div key={friend.id} variants={itemVariants}>
                        <FriendRow 
                          friend={friend} 
                          onRemove={() => removeFriend(friend.id)}
                        />
                      </motion.div>
                    ))}
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            {/* 请求列表内容 */}
            <TabsContent value="requests" className="flex-1 overflow-y-auto px-6 py-2 pb-6 mt-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key="requests"
                  variants={itemContainerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  {displayRequests.map((request) => (
                    <motion.div key={request.id} variants={itemVariants}>
                      <RequestRow 
                        request={request}
                        onAccept={(req) => handleRequest(req.id, 'accept')}
                        onReject={(req) => handleRequest(req.id, 'reject')}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SocialDrawer;
