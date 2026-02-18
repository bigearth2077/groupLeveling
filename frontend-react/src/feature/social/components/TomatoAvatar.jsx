import React from 'react';
import { cn } from '@/lib/utils';

const TomatoAvatar = ({ face, shade, className = "w-10 h-10" }) => {
  
  const colors = {
    red: { body: '#f43f5e', shadow: '#be123c', highlight: '#fb7185' },
    orange: { body: '#f97316', shadow: '#c2410c', highlight: '#fb923c' },
    pink: { body: '#ec4899', shadow: '#be185d', highlight: '#f472b6' },
  };
  
  const c = colors[shade];

  // Face Paths
  const renderFace = () => {
    switch (face) {
      case 'happy':
        return (
          <g fill="none" stroke="#3f1a1a" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 14c0 0 2 1 4 0" stroke="none" fill="#3f1a1a" className="opacity-10"/> {/* Blush */}
            <path d="M10 12a2 2 0 0 1 2-2" /> {/* Left Eye */}
            <path d="M20 12a2 2 0 0 1 2-2" /> {/* Right Eye */}
            <path d="M13 18c1.5 1.5 4.5 1.5 6 0" /> {/* Smile */}
          </g>
        );
      case 'focus':
        return (
          <g fill="none" stroke="#3f1a1a" strokeWidth="2">
             <circle cx="11" cy="12" r="3.5" fill="rgba(255,255,255,0.4)"/>
             <circle cx="21" cy="12" r="3.5" fill="rgba(255,255,255,0.4)"/>
             <path d="M14.5 12h3" /> {/* Bridge */}
             <path d="M13 19h6" strokeLinecap="round" /> {/* Mouth */}
          </g>
        );
      case 'sleep':
        return (
          <g fill="none" stroke="#3f1a1a" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 13c1-1 3-1 4 0" /> {/* Closed Eye L */}
            <path d="M18 13c1-1 3-1 4 0" /> {/* Closed Eye R */}
            <circle cx="16" cy="18" r="1.5" fill="#3f1a1a" stroke="none" /> {/* Mouth */}
            <text x="22" y="8" fontSize="8" fill="#3f1a1a" style={{fontFamily: 'sans-serif'}}>z</text>
          </g>
        );
      case 'cool':
        return (
           <g>
             <path d="M8 11h16v4a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4v-4z" fill="#1f2937" />
             <path d="M8 11h16" stroke="#1f2937" strokeWidth="2"/>
             <path d="M14 17h4" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round"/>
           </g>
        );
      case 'wink':
        return (
          <g fill="none" stroke="#3f1a1a" strokeWidth="2.5" strokeLinecap="round">
            <path d="M10 12a2 2 0 0 1 2-2" /> {/* Open Eye */}
            <path d="M18 12h4" /> {/* Wink Eye */}
            <path d="M13 17c1.5 1.5 4.5 1.5 6 0" /> {/* Smile */}
          </g>
        );
      default: return null;
    }
  };

  return (
    <div className={`${className} relative`}>
      <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-sm transition-transform hover:scale-110 duration-300">
        {/* Body */}
        <circle cx="16" cy="17" r="14" fill={c.body} />
        {/* Highlight */}
        <ellipse cx="12" cy="10" rx="3" ry="2" fill="white" fillOpacity="0.3" transform="rotate(-45 12 10)" />
        {/* Stem */}
        <path d="M16 3c-1 0-2 2-1 3 1 1 3 1 4-1 1-3-2-2-3-2z" fill="#4ade80" />
        <path d="M16 4c-2 1-4-1-3-3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <path d="M13 5c-1.5 1-1.5 3 0 3" fill="#4ade80" />
        <path d="M19 5c1.5 1 1.5 3 0 3" fill="#4ade80" />
        {/* Face */}
        {renderFace()}
      </svg>
    </div>
  );
};

export default TomatoAvatar;
