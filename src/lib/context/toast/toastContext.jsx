import { createContext, useContext, useState } from 'react';
import Toast from '@/components/ui/toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'error', duration = 5000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showError = (message, duration = 5000) => {
    addToast(message, 'error', duration);
  };

  const showSuccess = (message, duration = 5000) => {
    addToast(message, 'success', duration);
  };

  const showWarning = (message, duration = 5000) => {
    addToast(message, 'warning', duration);
  };

  const value = {
    addToast,
    removeToast,
    showError,
    showSuccess,
    showWarning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Render toasts */}
      <div className='fixed top-0 right-0 z-[9999] p-4 space-y-2'>
        {toasts.map((toast) => (
          <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
