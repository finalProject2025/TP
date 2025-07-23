import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import './FloatingNotificationBadge.css';

interface FloatingNotificationBadgeProps {
  className?: string;
}

const FloatingNotificationBadge: React.FC<FloatingNotificationBadgeProps> = ({ 
  className = '' 
}) => {
  const { unreadCount, loading } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Production-ready logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('FloatingNotificationBadge - unreadCount:', unreadCount, 'loading:', loading);
  }

  // Show badge with animation when unreadCount changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('FloatingNotificationBadge - useEffect triggered, unreadCount:', unreadCount);
    }
    
    if (unreadCount > 0) {
      setIsVisible(true);
      
      // Trigger new notification animation
      if (unreadCount > 0) {
        setHasNewNotification(true);
        const timer = setTimeout(() => setHasNewNotification(false), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [unreadCount]);

  // Don't render if no unread messages
  if (unreadCount === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.log('FloatingNotificationBadge - returning null, unreadCount is 0');
    }
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('FloatingNotificationBadge - rendering badge with count:', unreadCount);
  }

  return (
    <div 
      className={`
        floating-notification-badge
        fixed z-[9999]
        bottom-4 right-3 
        md:bottom-6 md:right-3 
        lg:bottom-25 lg:right-5.5
        transform transition-all duration-300 ease-in-out
        hover:scale-110
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${hasNewNotification ? 'floating-notification-badge-new' : ''}
        ${className}
      `}

      role="button"
      tabIndex={0}
      aria-label={`${unreadCount} ungelesene Nachrichten - Klicken Sie hier, um zu den Nachrichten zu gehen`}
    >
      <Link
        to="/messages"
        className="
          block
          bg-gradient-to-r from-blue-500 to-blue-600
          hover:from-blue-600 hover:to-blue-700
          text-white
          rounded-full
          p-4
          transition-all duration-200
          transform hover:-translate-y-1
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          focus:ring-offset-white
        "
        style={{
          minWidth: '3.5rem',
          minHeight: '3.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2), 0 4px 8px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
        }}
        onClick={() => {
          // Track notification click for analytics (optional)
          if (process.env.NODE_ENV === 'development') {
            console.log('Notification badge clicked');
          }
          // Sofortige Aktualisierung des unreadCount beim Klick auf das Badge
          // Der unreadCount wird automatisch aktualisiert, wenn die MessagesPage geladen wird
        }}
      >
        <div className="relative flex items-center justify-center">
          {/* Message Icon */}
          <svg
            className="w-6 h-6 md:w-7 md:h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>

          {/* Badge */}
          <span 
            className={`
              absolute -top-2 -right-2
              bg-red-500 text-white
              rounded-full
              text-xs font-semibold
              flex items-center justify-center
              min-w-5 h-5
              px-1
              ${hasNewNotification ? 'animate-bounce' : 'animate-pulse'}
            `}
            style={{
              animation: hasNewNotification 
                ? 'bounce 1s infinite' 
                : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
            aria-label={`${unreadCount} neue Nachrichten`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      </Link>
    </div>
  );
};

export default FloatingNotificationBadge; 