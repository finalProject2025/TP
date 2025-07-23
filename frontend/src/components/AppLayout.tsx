import React from 'react';
import FloatingNotificationBadge from './FloatingNotificationBadge';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <>
      {children}
      <FloatingNotificationBadge />
    </>
  );
};

export default AppLayout; 