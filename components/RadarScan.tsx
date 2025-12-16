import React from 'react';

export const RadarScan: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-64 h-64 mb-8">
      {/* Core */}
      <div className="absolute w-4 h-4 bg-brand-500 rounded-full z-10 shadow-lg shadow-brand-500/50"></div>
      
      {/* Rings */}
      <div className="absolute w-full h-full border border-brand-200 rounded-full animate-ping-slow opacity-20"></div>
      <div className="absolute w-48 h-48 border border-brand-300 rounded-full animate-ping-slow opacity-40" style={{ animationDelay: '0.5s' }}></div>
      <div className="absolute w-32 h-32 border border-brand-400 rounded-full animate-ping-slow opacity-60" style={{ animationDelay: '1s' }}></div>
      
      {/* Scanning Text */}
      <div className="absolute -bottom-12 text-brand-600 font-medium tracking-wide text-sm animate-pulse">
        Scanning Local Network...
      </div>
    </div>
  );
};