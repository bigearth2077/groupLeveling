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
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700 overflow-hidden">
      {/* Global Room Manager */}
      <RoomConnectionManager />

      {/* Left Navigation Rail */}
      <aside className="w-20 lg:w-64 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col items-center lg:items-start py-6 z-40 transition-all">
        {/* Logo */}
        <div className="flex items-center gap-3 px-0 lg:px-6 mb-10 w-full justify-center lg:justify-start">
          <div className="h-10 w-10 shrink-0 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-blue-200 shadow-lg">
            GL
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800 hidden lg:block">
            GroupLeveling
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 w-full px-3 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 group w-full justify-center lg:justify-start",
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-bold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
                title={item.name}
              >
                <item.icon size={20} className={cn("shrink-0", isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                <span className="hidden lg:block whitespace-nowrap text-sm">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Minimal Header */}
        <header className="h-16 flex-shrink-0 bg-transparent flex items-center justify-between px-6 lg:px-10 z-30 pt-4">
          
          {/* Search Bar (Placeholder) */}
          <div className="max-w-md w-full relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search rooms, friends, or blogs..." 
              className="w-full bg-white border-0 shadow-sm pl-10 pr-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow"
            />
          </div>

          <div className="flex-1 sm:hidden"></div> {/* Spacer for mobile */}

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="p-2.5 text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center bg-white shadow-sm hover:shadow rounded-full"
              title="Switch Language"
            >
              <Globe size={18} />
              <span className="sr-only">{i18n.language?.substring(0, 2) || 'ZH'}</span>
            </button>

            {/* Notification Bell */}
            <div className="bg-white shadow-sm rounded-full flex items-center justify-center hover:shadow transition-shadow">
               <NotificationBell />
            </div>

            {/* Friend Drawer & Avatar */}
            <div className="bg-white p-1 shadow-sm rounded-full hover:shadow transition-shadow ml-1">
               <FriendDrawer />
            </div>
          </div>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10 pb-32">
          <div className="max-w-6xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Unified Right-Bottom Floating Tools */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4 items-end z-50 pointer-events-none">
        {/* Pointer events auto for children so they can be clicked, but the container itself won't block clicks */}
        <div className="pointer-events-auto flex flex-col gap-4">
          <AmbientBuddyRing />
          <PomodoroDock />
        </div>
      </div>

      {/* Global Modals / Micro-Interactions */}
      <DailyReviewPanel />
    </div>
  );
};

export default AppLayout;
