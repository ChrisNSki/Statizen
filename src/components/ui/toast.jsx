import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const Toast = ({ message, type = 'error', duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(), 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'error':
      default:
        return 'bg-red-500 text-white border-red-600';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-[9999] max-w-sm w-full p-4 rounded-lg border shadow-lg transition-all duration-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'} ${getToastStyles()}`}>
      <div className='flex items-start justify-between'>
        <div className='flex-1'>
          <p className='text-sm font-medium'>{message}</p>
        </div>
        <button onClick={handleClose} className='ml-3 flex-shrink-0 p-1 rounded-md hover:bg-black/20 transition-colors'>
          <X className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
};

export default Toast;
