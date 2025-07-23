import React, { useState } from 'react';
import Toast from '../components/Toast';
import { ToastContext } from './useToast.context';

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  type ToastItem = {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
  };
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => {
    const id = Date.now().toString();
    const newToast: ToastItem = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message: string, duration?: number) => showToast(message, 'success', duration);
  const showError = (message: string, duration?: number) => showToast(message, 'error', duration);
  const showInfo = (message: string, duration?: number) => showToast(message, 'info', duration);
  const showWarning = (message: string, duration?: number) => showToast(message, 'warning', duration);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      {/* Render Toasts */}
      <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999 }}>
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            style={{
              marginTop: index > 0 ? '10px' : '0'
            }}
          >
            <Toast
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider; 