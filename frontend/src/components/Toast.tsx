import React, { useEffect, useState } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);

    // Auto-close after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10b981',
          borderColor: '#059669',
          icon: '✓'
        };
      case 'error':
        return {
          backgroundColor: '#ef4444',
          borderColor: '#dc2626',
          icon: '✕'
        };
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
          borderColor: '#d97706',
          icon: '⚠'
        };
      case 'info':
        return {
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          icon: 'ℹ'
        };
      default:
        return {
          backgroundColor: '#6b7280',
          borderColor: '#4b5563',
          icon: '•'
        };
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
        border: `2px solid ${typeStyles.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          minWidth: '20px',
          textAlign: 'center'
        }}
      >
        {typeStyles.icon}
      </div>

      {/* Message */}
      <div style={{ flex: 1, fontSize: '14px', lineHeight: '1.4' }}>
        {message}
      </div>

      {/* Close Button */}
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
          minWidth: '20px',
          opacity: 0.8,
          transition: 'opacity 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
        onMouseOut={(e) => e.currentTarget.style.opacity = '0.8'}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
