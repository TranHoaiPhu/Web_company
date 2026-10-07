'use client';

import React, { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number; // Thời gian hiển thị (ms)
}

const Toast: React.FC<ToastProps> = ({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000, // 3 giây mặc định
}) => {
  const [progress, setProgress] = useState(100);
  const progressInterval = 10; // cập nhật progress bar mỗi 10ms
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    let progressTimer: NodeJS.Timeout;
    
    if (isVisible && duration > 0) {
      // Timer để đóng toast
      timer = setTimeout(() => {
        onClose();
      }, duration);
      
      // Timer để cập nhật progress bar
      const steps = duration / progressInterval;
      const decrementPerStep = 100 / steps;
      
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) return 0;
          return prev - decrementPerStep;
        });
      }, progressInterval);
    }
    
    // Reset progress khi toast hiển thị
    if (isVisible) {
      setProgress(100);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
      if (progressTimer) clearInterval(progressTimer);
    };
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  // Chọn màu sắc và icon dựa vào type
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'filter backdrop-blur-sm bg-white/30',
          textColor: 'text-gray-600',
          icon: <FaCheckCircle className="text-green-400" size={20} />,
          progressColor: 'bg-green-400'
        };
      case 'error':
        return {
          bgColor: 'filter backdrop-blur-sm bg-white/30',
          textColor: 'text-gray-600',
          icon: <FaExclamationTriangle className="text-red-400" size={20} />,
          progressColor: 'bg-red-400'
        };
      case 'warning':
        return {
          bgColor: 'filter backdrop-blur-sm bg-white/30',
          textColor: 'text-gray-600',
          icon: <FaExclamationTriangle className="text-yellow-400" size={20} />,
          progressColor: 'bg-yellow-400'
        };
      case 'info':
      default:
        return {
          bgColor: 'filter backdrop-blur-sm bg-white/30',
          textColor: 'text-gray-600',
          icon: <FaInfoCircle className="text-blue-400" size={20} />,
          progressColor: 'bg-blue-400'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center">
      <div 
        className={`${styles.bgColor} ${styles.textColor} py-2 px-4 rounded shadow-lg flex flex-col items-center max-w-md animate-fade-in overflow-hidden relative`}
      >
        <div className="flex items-center w-full">
          <div className="mr-2">
            {styles.icon}
          </div>
          
          <p className="text-sm font-medium">{message}</p>
          
          <button 
            onClick={onClose}
            className="ml-4 text-gray-300 hover:text-gray-600 focus:outline-none"
          >
            <FaTimes size={16} />
          </button>
        </div>
        
        {/* Thanh progress */}
        <div className="w-full h-1 bg-white-200 mt-2 rounded-full overflow-hidden">
          <div 
            className={`h-full ${styles.progressColor} transition-all ease-linear`} 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;