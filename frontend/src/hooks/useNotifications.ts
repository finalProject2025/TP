import { useState, useEffect, useCallback } from 'react';
import { simpleApi, getApiBaseUrl } from '../services/simpleApi';

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

      // Verwende den korrekten API-Endpunkt
      const response = await fetch(`${getApiBaseUrl()}/messages/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count || 0);
      } else {
        console.log('API Response not ok:', response.status);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Neue Funktion: Sofortige Aktualisierung des unreadCount
  const refreshUnreadCount = useCallback(async () => {
    await fetchUnreadCount();
  }, []);

  useEffect(() => {
    // Initial load
    fetchUnreadCount();

    // Poll for updates every 10 seconds if user is authenticated
    const interval = setInterval(() => {
      if (simpleApi.isAuthenticated()) {
        fetchUnreadCount();
      }
    }, 5000);

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
    refresh: fetchUnreadCount,
    refreshUnreadCount // Neue Funktion exportieren
  };
}
