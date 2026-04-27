import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import PomodoroDock from '@/components/PomodoroDock';
import FriendDrawer from '@/components/friend/FriendDrawer';
import RoomConnectionManager from '@/components/room/RoomConnectionManager';
import DailyReviewPanel from '@/components/DailyReviewPanel';
import NotificationBell from '@/components/notification/NotificationBell';
import AmbientBuddyRing from '@/feature/matching/components/AmbientBuddyRing';
import { LayoutDashboard, Users, Trophy, User, BookOpen, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const AppLayout = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  // AppLayout now just connects socket globally, NotificationBell handles its own notifications
  React.useEffect(() => {
    const socket = connectSocket();
    return () => {};
  }, []);
  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const navItems = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.blogs'), path: '/blogs', icon: BookOpen },
    { name: t('nav.rooms'), path: '/rooms', icon: Users },
    { name: t('nav.rankings'), path: '/rankings', icon: Trophy },
    { name: t('nav.profile'), path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Global Room Manager */}
      <RoomConnectionManager />

      {/* Top Navigation (Desktop) / Mobile Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md px-4 sm:px-6">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-lg">
              GL
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">GroupLeveling</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-indigo-600 ${
                  location.pathname === item.path ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage}
              className="px-2 py-1.5 text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 bg-slate-50 hover:bg-slate-100 rounded-full border border-slate-200"
              title="Switch Language"
            >
              <Globe size={16} />
              <span className="text-xs font-bold uppercase">{i18n.language?.substring(0, 2) || 'ZH'}</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Friend Drawer & Avatar */}
            <FriendDrawer />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-7xl p-4 sm:p-6 pb-32">
        <Outlet />
      </main>

      {/* Floating Dock (Always Visible) */}
      <PomodoroDock />

      {/* Global Modals / Micro-Interactions */}
      <DailyReviewPanel />
      <AmbientBuddyRing />
    </div>
  );
};

export default AppLayout;
