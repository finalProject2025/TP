import React from 'react';

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

export default SimpleToast; 