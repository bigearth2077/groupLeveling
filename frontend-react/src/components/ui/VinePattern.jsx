import React from 'react';

const VinePattern = ({ className }) => (
  <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 40 C 50 40, 50 100, 100 100 C 150 100, 150 160, 200 160" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M60 50 Q 80 30 90 60 Z" fill="currentColor" />
    <path d="M140 110 Q 160 90 170 120 Z" fill="currentColor" />
    <path d="M30 150 Q 10 130 40 120 Z" fill="currentColor" />
  </svg>
);

export default VinePattern;
