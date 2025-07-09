import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { simpleApi } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';
import ChatModal from './ChatModal';
import HelpOffersModal from './HelpOffersModal';
import LoadingScreen from './LoadingScreen';
import ConfirmModal from './ConfirmModal';

interface Conversation {
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatModal, setChatModal] = useState<{
    isOpen: boolean;
    otherUserId: string;
    otherUserName: string;
    postTitle?: string;
    postType?: 'offer' | 'request';
  }>({
    isOpen: false,
    otherUserId: '',
    otherUserName: '',
    postTitle: undefined,
    postType: undefined
  });
  const [isHelpOffersModalOpen, setIsHelpOffersModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    conversation: Conversation | null;
  }>({
    isOpen: false,
    conversation: null
  });

  const { showError, showSuccess } = useToast();

  useEffect(() => {
    // Check authentication first
    if (!simpleApi.isAuthenticated()) {
      showError('Sie müssen angemeldet sein, um Nachrichten zu sehen');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return;
    }

    loadConversations();
    checkForUnreadHelpOffers();
  }, [showError]);

  const checkForUnreadHelpOffers = async () => {
    try {
      const helpOffers = await simpleApi.getHelpOffers();
      const unreadOffers = helpOffers.filter(offer => !offer.is_read && offer.status === 'pending');

      // NUR wenn echte ungelesene Hilfe-Angebote vorhanden sind, Modal automatisch öffnen
      if (unreadOffers.length > 0) {
        setTimeout(() => {
          setIsHelpOffersModalOpen(true);
        }, 500); // Kurze Verzögerung für bessere UX
      }
    } catch (error) {
      console.error('Error checking help offers:', error);
      // Fehler ignorieren - Modal wird nicht geöffnet
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('auth_token');
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002'
        : `http://${window.location.hostname}:3002`;
      const response = await fetch(`${apiBaseUrl}/api/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Fehler beim Laden der Unterhaltungen');
      }
    } catch (err: unknown) {
      console.error('Error loading conversations:', err);
      setError('Fehler beim Laden der Unterhaltungen');
    } finally {
      setLoading(false);
    }
  };

  const openChat = (conversation: Conversation) => {
    setChatModal({
      isOpen: true,
      otherUserId: conversation.other_user_id,
      otherUserName: conversation.other_user_name,
      // postTitle: conversation.post_title,
      // postType: conversation.post_type
    });
  };

  const openDeleteConfirm = (conversation: Conversation, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening chat when clicking delete
    setConfirmModal({
      isOpen: true,
      conversation
    });
  };

  const deleteConversation = async (conversation: Conversation) => {
    // Use dynamic API URL for network compatibility
    const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3002'
      : `http://${window.location.hostname}:3002`;

    try {
      const response = await fetch(`${apiBaseUrl}/api/conversations/${conversation.other_user_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Unterhaltung');
      }

      // const result = await response.json();
      showSuccess(`Unterhaltung mit ${conversation.other_user_name} wurde gelöscht`);

      // Conversations neu laden
      loadConversations();
    } catch (error: unknown) {
      console.error('Error deleting conversation:', error);
      showError(error.message || 'Fehler beim Löschen der Unterhaltung');
    }
  };

  const handleStartChatFromHelpOffer = (otherUserId: string, otherUserName: string) => {
    setChatModal({
      isOpen: true,
      otherUserId,
      otherUserName
    });
    setIsHelpOffersModalOpen(false);
  };

  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours} Std.`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)} Tagen`;
    
    return date.toLocaleDateString('de-DE');
  };

  if (loading) {
    return (
      <LoadingScreen
        text="Nachrichten werden geladen"
        subtitle="Ihre Unterhaltungen werden vorbereitet..."
        fullScreen={true}
      />
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '16px 20px', 
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link 
            to="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              textDecoration: 'none', 
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Zurück zur Startseite
          </Link>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            💬 Nachrichten
          </h1>
          <div style={{ width: '120px' }}></div>
        </div>

        <div style={{ 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Fehler beim Laden</h3>
          <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={loadConversations}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '16px 20px', 
        marginBottom: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link 
          to="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            textDecoration: 'none', 
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← Zurück zur Startseite
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            💬 Nachrichten
          </h1>
          <span style={{
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {conversations.length} Unterhaltungen
          </span>
        </div>
        <button
          onClick={() => setIsHelpOffersModalOpen(true)}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Hilfe-Angebote
        </button>
      </div>

      {/* Conversations */}
      {conversations.length === 0 ? (
        <div style={{ 
          backgroundColor: 'white',
          padding: '40px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>Keine Nachrichten</h3>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px' }}>
            Sie haben noch keine Unterhaltungen. Starten Sie einen Chat über die Hilfe-Anfragen!
          </p>
          <Link 
            to="/posts"
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Zu den Hilfe-Anfragen
          </Link>
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {conversations.map((conversation, index) => (
            <div 
              key={conversation.other_user_id}
              onClick={() => openChat(conversation)}
              style={{
                padding: '16px 20px',
                borderBottom: index < conversations.length - 1 ? '1px solid #f3f4f6' : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                    {conversation.other_user_name}
                  </h4>
                  {conversation.unread_count > 0 && (
                    <span style={{
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '11px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '8px'
                    }}>
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </span>
                  )}
                </div>

                {/* { Post Context  }
                {conversation.post_title && (
                  <div style={{
                    marginBottom: '4px',
                    padding: '4px 8px',
                    backgroundColor: conversation.post_type === 'request' ? '#dbeafe' : '#dcfce7',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: conversation.post_type === 'request' ? '#1e40af' : '#166534',
                    fontWeight: '500'
                  }}>
                    📋 {conversation.post_type === 'request' ? 'Hilfe-Anfrage' : 'Hilfe-Angebot'}: {conversation.post_title}
                  </div>
                )} 
*/}
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#6b7280',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '300px'
                }}>
                  {conversation.last_message || 'Keine Nachrichten'}
                </p>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <button
                  onClick={(e) => openDeleteConfirm(conversation, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Unterhaltung löschen"
                >
                  🗑️
                </button>
                <p style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  {formatTimeAgo(conversation.last_message_time)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModal.isOpen}
        onClose={() => {
          setChatModal(prev => ({ ...prev, isOpen: false }));
          // Refresh conversations after closing chat
          loadConversations();
        }}
        otherUserId={chatModal.otherUserId}
        otherUserName={chatModal.otherUserName}
        postTitle={chatModal.postTitle}
        postType={chatModal.postType}
        onDeleteConversation={() => {
          // Find the conversation and open confirm modal
          const conversation = conversations.find(c => c.other_user_id === chatModal.otherUserId);
          if (conversation) {
            setConfirmModal({
              isOpen: true,
              conversation
            });
          }
        }}
      />

      {/* Help Offers Modal */}
      <HelpOffersModal
        isOpen={isHelpOffersModalOpen}
        onClose={() => {
          setIsHelpOffersModalOpen(false);
          // Conversations neu laden nach Schließen des Modals
          loadConversations();
        }}
        onStartChat={handleStartChatFromHelpOffer}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, conversation: null })}
        onConfirm={() => {
          if (confirmModal.conversation) {
            deleteConversation(confirmModal.conversation);
          }
        }}
        title="Unterhaltung löschen"
        message={`Möchten Sie die Unterhaltung mit ${confirmModal.conversation?.other_user_name} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        confirmText="Löschen"
        cancelText="Abbrechen"
        confirmColor="#ef4444"
      />
    </div>
  );
}

export default MessagesPage;
