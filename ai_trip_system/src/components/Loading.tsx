'use client';

import React from 'react';

interface LoadingProps {
  message?: string;
  color?: string;
  backgroundColor?: string;
  opacity?: number;
}

const Loading: React.FC<LoadingProps> = ({
  message = 'Đang tải...',
  color = '#3B82F6', // Blue color
  backgroundColor = 'rgba(255, 255, 255, 0.8)',
  opacity = 0.9,
}) => {
  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center z-50"
      style={{ backgroundColor, opacity }}
    >
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-transparent rounded-full animate-spin" 
          style={{ borderTopColor: color }}></div>
      </div>
      
      {message && (
        <p className="mt-4 text-lg font-medium" style={{ color: '#333' }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default Loading;