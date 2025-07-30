import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import { useNotifications } from '../hooks/useNotifications';
import { getApiBaseUrl } from '../services/simpleApi';
import type { ChatMessage } from '../types';

// XSS-Schutz: HTML-Escaping-Funktion
const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
  postTitle?: string;
  postType?: 'offer' | 'request';
  onDeleteConversation?: () => void;
}

const ChatModal = React.memo(function ChatModal({ isOpen, onClose, otherUserId, otherUserName, postTitle, postType, onDeleteConversation }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { showError } = useToast();
  const { refreshUnreadCount } = useNotifications();

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      // Verwende setTimeout um sicherzustellen, dass das DOM aktualisiert ist
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
    }
  }, []);

  const loadMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/messages/${otherUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];

        // Only update if messages actually changed
        setMessages(prevMessages => {
          if (JSON.stringify(prevMessages) !== JSON.stringify(newMessages)) {
            setLastMessageCount(newMessages.length);
            return newMessages;
          }
          return prevMessages;
        });
      } else {
        if (!silent) {
          setMessages([]);
        }
      }
    } catch (error) {
      if (!silent) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    if (isOpen) {
      // Initial load
      loadMessages();
      // Sofortige Aktualisierung des unreadCount beim Öffnen des Chats
      refreshUnreadCount();

      // Set up polling with silent updates
      intervalRef.current = setInterval(() => {
        loadMessages(true); // Silent refresh
      }, 5000); // Increased to 5 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      // Clear interval when modal closes
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isOpen, loadMessages, refreshUnreadCount]);

  // Scroll to bottom when messages are loaded or new messages arrive
  useEffect(() => {
    // Scroll to bottom when messages are first loaded
    if (messages.length > 0 && !loading) {
      scrollToBottom();
    }
  }, [messages.length, loading, scrollToBottom]);

  // Additional scroll when new messages are added
  useEffect(() => {
    // Only scroll if new messages were added
    if (messages.length > lastMessageCount) {
      scrollToBottom();
    }
  }, [messages.length, lastMessageCount, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending) return;

    const messageToSend = newMessage.trim();

    // Frontend-Validierung für Nachrichtenlänge
    if (messageToSend.length > 1000) {
      showError('Nachricht zu lang (max. 1000 Zeichen)');
      return;
    }

    // Optimistic update - add message immediately
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: messageToSend,
      sender_id: 'current-user',
      receiver_id: otherUserId,
      created_at: new Date().toISOString(),
      is_own_message: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setSending(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${getApiBaseUrl()}/conversations/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          other_user_id: otherUserId,
          initial_message: messageToSend
        })
      });

      if (response.ok) {
        // Reload messages to get the real message with proper ID
        await loadMessages(true);
      } else {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        setNewMessage(messageToSend); // Restore message
        const error = await response.json();
        showError(error.error || 'Fehler beim Senden der Nachricht');
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageToSend); // Restore message
      console.error('Error sending message:', error);
      showError('Fehler beim Senden der Nachricht');
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, otherUserId, loadMessages, showError]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        height: '600px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              💬 Chat mit {escapeHtml(otherUserName)}
            </h3>
            {postTitle && (
              <div style={{
                margin: '4px 0 0 0',
                padding: '4px 8px',
                backgroundColor: postType === 'request' ? '#dbeafe' : '#dcfce7',
                borderRadius: '4px',
                fontSize: '12px',
                color: postType === 'request' ? '#1e40af' : '#166534',
                fontWeight: '500',
                display: 'inline-block'
              }}>
                📋 {postType === 'request' ? 'Hilfe-Anfrage' : 'Hilfe-Angebot'}: {escapeHtml(postTitle)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {onDeleteConversation && (
              <button
                onClick={() => {
                  onDeleteConversation();
                  onClose();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#ef4444',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Unterhaltung löschen"
                aria-label="Unterhaltung löschen"
              >
                🗑️
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px'
              }}
              aria-label="Chat schließen"
            >
              ×
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280'
            }}>
              Lade Nachrichten...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              <div>
                <p>Noch keine Nachrichten</p>
                <p style={{ fontSize: '12px' }}>Schreiben Sie die erste Nachricht!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.is_own_message ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '70%',
                  padding: '8px 12px',
                  borderRadius: '12px',
                  backgroundColor: message.is_own_message ? '#3b82f6' : '#f3f4f6',
                  color: message.is_own_message ? 'white' : '#374151'
                }}>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                    {escapeHtml(message.content)}
                  </p>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '11px', 
                    opacity: 0.7,
                    textAlign: 'right'
                  }}>
                    {formatTime(message.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nachricht schreiben..."
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '20px',
              fontSize: '14px',
              outline: 'none'
            }}
            disabled={sending}
            aria-label="Nachricht eingeben"
          />
          {/* Submit */}
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            style={{
              backgroundColor: sending ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: sending ? 'not-allowed' : 'pointer'
            }}
            aria-label="Nachricht senden"
          >
            {sending ? '...' : 'Senden'}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ChatModal;