import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { simpleApi, getApiBaseUrl } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';
import { useNotifications } from '../hooks/useNotifications';
import ChatModal from './ChatModal';
import HelpOffersModal from './HelpOffersModal';
import LoadingScreen from './LoadingScreen';
import ConfirmModal from './ConfirmModal';
import { formatTimeAgo } from '../utils/dateUtils';
import type { Conversation } from '../types';

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
  const { refreshUnreadCount } = useNotifications();

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
    // Sofortige Aktualisierung des unreadCount beim Laden der Seite
    refreshUnreadCount();
  }, [showError, refreshUnreadCount]);

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
      const response = await fetch(`${getApiBaseUrl()}/conversations`, {
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
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Konversationen';
      setError(errorMessage);
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
    try {
      const response = await fetch(`${getApiBaseUrl()}/conversations/${conversation.other_user_id}`, {
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
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Löschen der Konversation';
      setError(errorMessage);
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="container-custom">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between">
                          <Link 
              to="/" 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors">
                <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            </Link>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                Nachrichten
              </h1>
              <div className="w-24"></div>
            </div>
          </div>

          {/* Error */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-red-800 mb-2">Fehler beim Laden</h3>
            <p className="text-red-700 mb-6">{error}</p>
            <button
              onClick={loadConversations}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700  shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="container-custom">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm"
            >
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-blue-300 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <span className="hidden sm:inline">Nachrichten</span>
              </h1>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                <span className="sm:hidden text-xs">{conversations.length}</span>
                <span className="hidden sm:inline">{conversations.length} Unterhaltungen</span>
              </span>
            </div>
            <button
              onClick={() => setIsHelpOffersModalOpen(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
              aria-label="Hilfe-Angebote anzeigen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden sm:inline">Hilfe-Angebote</span>
            </button>
          </div>
        </div>

        {/* Conversations */}
        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Keine Nachrichten</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Sie haben noch keine Unterhaltungen. Starten Sie einen Chat über die Hilfe-Anfragen!
            </p>
            <Link 
              to="/posts"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Zu den Hilfe-Anfragen
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {conversations.map((conversation, index) => (
              <div 
                key={conversation.other_user_id}
                onClick={() => openChat(conversation)}
                className={`p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  index < conversations.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-4">
                        {conversation.other_user_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {conversation.other_user_name}
                          </h4>
                          {conversation.unread_count > 0 && (
                            <span className="bg-red-500 text-white rounded-full w-6 h-6 text-xs font-semibold flex items-center justify-center">
                              {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1 truncate max-w-md">
                          {conversation.last_message || 'Keine Nachrichten'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={(e) => openDeleteConfirm(conversation, e)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Unterhaltung löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(conversation.last_message_time)}
                    </span>
                  </div>
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
            refreshUnreadCount(); // Aktualisiere unreadCount beim Schließen des Chats
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
            refreshUnreadCount(); // Aktualisiere unreadCount beim Schließen des Modals
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
    </div>
  );
}

export default MessagesPage;
