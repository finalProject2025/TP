import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

// Simple Toast component defined inline to avoid import issues
const SimpleToast: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}> = ({ message, type, duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success': return { backgroundColor: '#10b981', icon: '✓' };
      case 'error': return { backgroundColor: '#ef4444', icon: '✕' };
      case 'warning': return { backgroundColor: '#f59e0b', icon: '⚠' };
      case 'info': return { backgroundColor: '#3b82f6', icon: 'ℹ' };
      default: return { backgroundColor: '#6b7280', icon: '•' };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        backgroundColor: typeStyles.backgroundColor,
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        minWidth: '300px',
        maxWidth: '500px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      <div style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '20px' }}>
        {typeStyles.icon}
      </div>
      <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.4' }}>
        {message}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0',
          opacity: 0.8
        }}
      >
        ×
      </button>
    </div>
  );
};

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
            <SimpleToast
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

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
