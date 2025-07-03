import { useState, useEffect } from 'react';
import { simpleApi } from '../services/simpleApi';

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = async () => {
    if (!simpleApi.isAuthenticated()) {
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      console.log('Fetching unread count with token:', token ? 'Token exists' : 'No token');

      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002'
        : `http://${window.location.hostname}:3002`;
      const response = await fetch(`${apiBaseUrl}/api/messages/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Unread count response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Unread count data:', data);
        setUnreadCount(data.unread_count || 0);
      } else {
        const errorData = await response.json();
        console.log('Unread count error:', errorData);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    fetchUnreadCount();

    // Poll for updates every 10 seconds if user is authenticated
    const interval = setInterval(() => {
      if (simpleApi.isAuthenticated()) {
        fetchUnreadCount();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Refresh when authentication status changes
  useEffect(() => {
    const handleStorageChange = () => {
      fetchUnreadCount();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    unreadCount,
    loading,
    refresh: fetchUnreadCount
  };
}
