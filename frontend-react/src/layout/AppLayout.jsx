import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import PomodoroDock from '@/components/PomodoroDock';
import { LayoutDashboard, Users, Trophy, User } from 'lucide-react';

const AppLayout = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Rooms', path: '/rooms', icon: Users },
    { name: 'Rankings', path: '/rankings', icon: Trophy },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
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
            {/* Placeholder for User Avatar / Settings */}
            <div className="h-8 w-8 rounded-full bg-slate-200 ring-2 ring-white cursor-pointer hover:ring-indigo-100 transition-all"></div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-7xl p-4 sm:p-6 pb-32">
        <Outlet />
      </main>

      {/* Floating Dock (Always Visible) */}
      <PomodoroDock />
    </div>
  );
};

export default AppLayout;
