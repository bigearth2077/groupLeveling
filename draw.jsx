import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { X as XIcon, Calendar, TrendingUp, Clock, ArrowRight } from 'lucide-react';

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const StatsDrawer: React.FC<StatsDrawerProps> = ({ isOpen, onClose }) => {
  // Animation Variants (Matching the Social Drawer)
  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const drawerVariants: Variants = {
    hidden: { x: '100%', opacity: 0.8, scale: 0.95 },
    visible: { 
      x: 0, 
      opacity: 1, 
      scale: 1,
      transition: { type: 'spring', damping: 25, stiffness: 200, mass: 0.8 } 
    },
    exit: { 
      x: '100%', opacity: 0, scale: 0.98,
      transition: { duration: 0.3, ease: 'easeInOut' }
    },
  };

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Drawer Container - Slightly wider for charts (max-w-lg) */}
          <motion.div
            className="fixed top-2 right-2 bottom-2 w-full max-w-lg z-50 flex flex-col pointer-events-none"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* The Actual Card UI */}
            <div className="pointer-events-auto h-full bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-tomato-900/20 flex flex-col border border-white/60 overflow-hidden relative">
              
              {/* Background Decorations */}
              <VinePattern className="absolute -top-10 -right-10 w-64 h-64 text-leaf-400 opacity-10 pointer-events-none" />
              <VinePattern className="absolute bottom-10 -left-10 w-64 h-64 text-tomato-200 opacity-10 pointer-events-none transform rotate-90" />

              {/* Header */}
              <div className="flex items-center justify-between p-8 pb-4 z-10">
                <div>
                  <h2 className="text-2xl font-black text-stone-800 tracking-tight">Your Progress</h2>
                  <p className="text-stone-500 font-medium text-sm">You are doing great, Explorer!</p>
                </div>
                <TomatoCloseButton onClick={onClose} />
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar z-10 pb-10 space-y-8">
                
                {/* 1. Focus Rhythm Chart */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-tomato-600">
                      <TrendingUp size={18} />
                      <h3 className="font-bold text-stone-800">Focus Rhythm</h3>
                    </div>
                    <div className="flex bg-stone-100 rounded-lg p-1">
                      <button className="px-3 py-1 text-xs font-bold text-white bg-tomato-500 rounded-md shadow-sm">Week</button>
                      <button className="px-3 py-1 text-xs font-bold text-stone-400 hover:text-stone-600">Month</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                     {/* The Chart */}
                     <FocusBarChart />
                  </div>
                </section>

                {/* 2. Today Hourly Focus */}
                <section>
                  <div className="flex items-center gap-2 text-tomato-600 mb-4">
                    <Clock size={18} />
                    <h3 className="font-bold text-stone-800">Today's Flow</h3>
                  </div>
                  <div className="bg-gradient-to-b from-tomato-50 to-white rounded-3xl p-5 shadow-sm border border-tomato-100 relative overflow-hidden">
                    <HourlyAreaChart />
                    <div className="flex justify-between mt-2 text-xs font-bold text-stone-400 px-2">
                       <span>4 AM</span>
                       <span>8 AM</span>
                       <span>12 PM</span>
                       <span>4 PM</span>
                       <span>8 PM</span>
                    </div>
                  </div>
                </section>


              </div>
              
              {/* Bottom Fade */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none rounded-b-[2.5rem]" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Custom Visual Components for Stats ---

// 1. Bar Chart with Bezier Curve
const FocusBarChart: React.FC = () => {
  const data = [30, 50, 45, 80, 60, 25, 65]; // Mon-Sun
  const max = 100;
  
  return (
    <div className="h-40 w-full relative flex items-end justify-between px-2 pt-6">
      {/* Dashed Trend Line Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
         <path 
           d="M 20 100 Q 80 80 140 100 T 260 80 T 380 90" 
           fill="none" 
           stroke="#a8a29e" 
           strokeWidth="2" 
           strokeDasharray="4 4" 
           className="opacity-30"
           vectorEffect="non-scaling-stroke"
         />
      </svg>

      {data.map((value, i) => (
        <div key={i} className="flex flex-col items-center gap-2 w-full group relative">
           {/* Tooltip */}
           <div className="absolute -top-8 bg-stone-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:-translate-y-1">
             {value}m
           </div>
           
           {/* Bar Container */}
           <div className="w-2.5 sm:w-4 h-24 bg-stone-100 rounded-full flex items-end overflow-hidden relative">
              {/* Animated Bar */}
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${value}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, type: 'spring' }}
                className="w-full bg-tomato-500 rounded-t-full relative"
              >
                {/* Glare effect */}
                <div className="absolute top-1 left-1 right-1 h-1 bg-white/30 rounded-full"></div>
              </motion.div>
           </div>
           
           <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
             {['M','T','W','T','F','S','S'][i]}
           </span>
        </div>
      ))}
    </div>
  );
};

// 2. Liquid Area Chart
const HourlyAreaChart: React.FC = () => (
  <div className="h-32 w-full relative">
    <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tomatoGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0"/>
        </linearGradient>
      </defs>
      {/* Soft Wave */}
      <motion.path
        d="M0,40 L0,30 Q10,25 20,32 T40,20 T60,25 T80,15 T100,30 L100,40 Z"
        fill="url(#tomatoGradient)"
        initial={{ d: "M0,40 L0,40 Q10,40 20,40 T40,40 T60,40 T80,40 T100,40 L100,40 Z" }}
        animate={{ d: "M0,40 L0,30 Q10,25 20,32 T40,20 T60,25 T80,15 T100,30 L100,40 Z" }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      {/* Line on top */}
      <motion.path
        d="M0,30 Q10,25 20,32 T40,20 T60,25 T80,15 T100,30"
        fill="none"
        stroke="#e11d48"
        strokeWidth="0.8"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />
    </svg>
  </div>
);

// 3. Heatmap Grid
const HeatmapGrid: React.FC = () => {
  // Generate a fake month layout
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const getIntensity = (day: number) => {
    // Random pattern
    if ([2, 5, 12, 13, 20, 21, 27, 28].includes(day)) return 'bg-tomato-500'; // High
    if ([1, 3, 8, 9, 15, 19, 22].includes(day)) return 'bg-tomato-300'; // Med
    if ([4, 6, 7, 10, 25].includes(day)) return 'bg-tomato-100'; // Low
    return 'bg-stone-200'; // None
  };

  return (
    <div className="grid grid-cols-7 gap-2">
       {['S','M','T','W','T','F','S'].map(d => (
         <div key={d} className="text-center text-[10px] font-bold text-stone-400 mb-1">{d}</div>
       ))}
       {days.map(day => (
         <motion.div 
           key={day}
           whileHover={{ scale: 1.2 }}
           className={`aspect-square rounded-md ${getIntensity(day)} flex items-center justify-center cursor-pointer relative group`}
         >
            <span className={`text-[9px] font-bold ${getIntensity(day) === 'bg-stone-200' ? 'text-stone-400' : 'text-white/90'}`}>
              {day}
            </span>
         </motion.div>
       ))}
    </div>
  );
};

// --- Shared Components (Duplicated for isolation as per instructions) ---

const TomatoCloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button 
    onClick={onClick}
    className="group relative w-10 h-10 flex items-center justify-center transition-transform hover:rotate-12 active:scale-95"
  >
    <div className="absolute inset-0 bg-tomato-500 rounded-full shadow-md group-hover:bg-tomato-600 transition-colors"></div>
    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-3 bg-leaf-500 rounded-full"></div>
    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-leaf-600"></div>
    <XIcon size={18} strokeWidth={3} className="relative z-10 text-white" />
  </button>
);

const VinePattern: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 40 C 50 40, 50 100, 100 100 C 150 100, 150 160, 200 160" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M60 50 Q 80 30 90 60 Z" fill="currentColor" />
    <path d="M140 110 Q 160 90 170 120 Z" fill="currentColor" />
    <path d="M30 150 Q 10 130 40 120 Z" fill="currentColor" />
  </svg>
);

export default StatsDrawer;