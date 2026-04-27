import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import PomodoroDock from '@/components/PomodoroDock';
import FriendDrawer from '@/components/friend/FriendDrawer';
import RoomConnectionManager from '@/components/room/RoomConnectionManager';
import DailyReviewPanel from '@/components/DailyReviewPanel';
import NotificationBell from '@/components/notification/NotificationBell';
import AmbientBuddyRing from '@/feature/matching/components/AmbientBuddyRing';
import { LayoutDashboard, Users, Trophy, User, BookOpen, Globe, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { connectSocket } from '@/lib/socket';
import { cn } from '@/lib/utils';

const AppLayout = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  React.useEffect(() => {
    connectSocket();
    return () => {};
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.rooms'), path: '/rooms', icon: Users },
    { name: t('nav.blogs'), path: '/blogs', icon: BookOpen },
    { name: t('nav.rankings'), path: '/rankings', icon: Trophy },
    { name: t('nav.profile'), path: '/profile', icon: User },
  ];

  return (
    <div className="h-screen w-full bg-[#f0f4f9] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700 overflow-hidden relative flex flex-col">
      {/* Top Bar (Integrated into NotebookLM style) */}
      <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">GL</div>
          <span className="text-lg font-bold tracking-tight text-slate-800 hidden sm:block">GroupLeveling</span>
        </div>

        <div className="flex items-center gap-4">
           {/* Search Bar */}
           <div className="max-w-md w-64 lg:w-96 relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full bg-white/50 border border-slate-200/50 pl-10 pr-4 py-1.5 rounded-full text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage} className="p-2 text-slate-500 hover:text-blue-600 transition-colors bg-white/50 rounded-full border border-slate-200/50">
              <Globe size={16} />
            </button>
            <div className="bg-white/50 rounded-full border border-slate-200/50 p-0.5"><NotificationBell /></div>
            <div className="bg-white/50 rounded-full border border-slate-200/50 p-1"><FriendDrawer /></div>
          </div>
        </div>
      </header>

      {/* Panels Area */}
      <div className="flex-1 flex gap-4 p-4 pt-0 overflow-hidden">
        {/* Global Room Manager */}
        <RoomConnectionManager />

        {/* Left Nav Card */}
        <aside className="w-20 lg:w-64 flex-shrink-0 bg-white rounded-[2rem] shadow-sm border border-slate-200/30 flex flex-col py-6 transition-all">
          <nav className="flex-1 w-full px-4 flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group w-full justify-center lg:justify-start",
                    isActive 
                      ? "bg-blue-50 text-blue-700 font-bold" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon size={18} className={cn("shrink-0", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                  <span className="hidden lg:block whitespace-nowrap text-sm">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Sidebar Bottom: Pomodoro */}
          <div className="mt-auto border-t border-slate-100 px-4 py-4">
            <PomodoroDock isEmbedded={true} />
          </div>
        </aside>

        {/* Main Content Card */}
        <main className="flex-1 bg-white rounded-[2rem] shadow-sm border border-slate-200/30 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <Outlet />
          </div>
        </main>
      </div>
      {/* Unified Right-Bottom Floating Tools */}
      <div className="fixed bottom-8 right-8 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <DailyReviewPanel />
        </div>
      </div>

      <AmbientBuddyRing />
    </div>
  );
};

export default AppLayout;
