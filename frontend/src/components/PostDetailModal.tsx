import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from '../hooks/useToast';
import RatingModal from './RatingModal';
import RatingDisplay from './RatingDisplay';
import { simpleApi, getApiBaseUrl } from '../services/simpleApi';
import type { ExtendedPost, RatingInfo } from '../types';

interface PostDetailModalProps {
  post: ExtendedPost;
  onClose: () => void;
  onHelp: (post: ExtendedPost) => void;
  onContact?: (post: ExtendedPost) => void;
  currentUserId?: string;
  onPostClosed?: () => void;
  isHelping?: boolean;
  setIsHelping?: (helping: boolean) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onHelp,
  onContact,
  currentUserId,
  onPostClosed,
  isHelping = false,
  setIsHelping
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [checkingRating, setCheckingRating] = useState(true);
  const [isLoadingHelp, setIsLoadingHelp] = useState(false); // Temporary loading state during API call
  const [ratingInfo, setRatingInfo] = useState<RatingInfo>({
    canRate: false,
    hasRated: false,
    reason: '',
    ratedUserId: '',
    ratedUserName: '',
    postId: 0,
    raterId: ''
  });
  const { showSuccess, showError } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'; // green
      case 'in_progress': return '#f59e0b'; // yellow
      case 'rated': return '#8b5cf6'; // purple
      case 'closed': return '#6b7280'; // gray
      case 'auto_closed': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'in_progress': return 'In Bearbeitung';
      case 'rated': return 'Bewertet';
      case 'closed': return 'Geschlossen';
      case 'auto_closed': return 'Automatisch geschlossen';
      default: return 'Unbekannt';
    }
  };

  const getTimeUntilClose = (autoCloseDate: string) => {
    const now = new Date();
    const closeDate = new Date(autoCloseDate);
    const diffInHours = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffInHours <= 0) return 'Läuft ab';
    if (diffInHours < 24) return `Läuft ab in ${diffInHours} Std.`;
    const days = Math.ceil(diffInHours / 24);
    return `Läuft ab in ${days} Tag${days > 1 ? 'en' : ''}`;
  };

  const handleClosePost = async () => {
    setIsClosing(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/posts/${post.id}/close`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Fehler beim Schließen des Posts');
      }

      showSuccess('Post erfolgreich geschlossen');
      onClose();
      if (onPostClosed) {
        onPostClosed();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Schließen des Posts';
      showError(errorMessage);
    } finally {
      setIsClosing(false);
    }
  };

  const handleHelpClick = async () => {
    if (post.type === 'request') {
      setIsLoadingHelp(true); // Start loading
      
      try {
        // onHelp ist eine void-Funktion, daher direkt aufrufen
        onHelp(post);
        // Button bleibt deaktiviert nach erfolgreichem Hilfe-Angebot
        if (setIsHelping) {
          setIsHelping(true);
        }
      } catch (error) {
        console.error('Error in handleHelpClick:', error);
        if (setIsHelping) {
          setIsHelping(false); // Re-enable button on error
        }
      } finally {
        setIsLoadingHelp(false); // Stop loading regardless of outcome
      }
    } else if (post.type === 'offer' && onContact) {
      onContact(post);
    }
  };



  // Prüfe ob bereits bewertet wurde
  useEffect(() => {
    const checkExistingRating = async () => {
      if (!currentUserId) {
        setCheckingRating(false);
        return;
      }

      try {
        console.log('Checking rating for post:', post.id, 'currentUserId:', currentUserId);
        const data = await simpleApi.checkExistingRating(post.id);
        console.log('Rating check result:', data);
        
        setRatingInfo({
          canRate: data.canRate || false,
          hasRated: data.hasRated || false,
          reason: data.reason || '',
          ratedUserId: data.ratedUserId || '',
          ratedUserName: data.ratedUserName || '',
          postId: data.postId || 0,
          raterId: data.raterId || ''
        });
      } catch (error) {
        console.error('Error checking rating:', error);
        // Set default values on error
        setRatingInfo({
          canRate: false,
          hasRated: false,
          reason: 'Fehler beim Laden der Bewertungsinformationen',
          ratedUserId: '',
          ratedUserName: '',
          postId: 0,
          raterId: ''
        });
      } finally {
        setCheckingRating(false);
      }
    };

    checkExistingRating();
  }, [currentUserId, post.id]);

  // Zentrale Funktion für Bewertungsbuttons
  const renderRatingButton = () => {
    console.log('Rendering rating button:', {
      checkingRating,
      canRate: ratingInfo.canRate,
      hasRated: ratingInfo.hasRated,
      reason: ratingInfo.reason,
      ratedUserName: ratingInfo.ratedUserName
    });

    if (checkingRating) {
      return (
        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
      );
    }

    if (ratingInfo.hasRated) {
      return (
        <div className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-lg bg-gray-100 text-gray-600 text-sm sm:text-base">
          <span style={{ fontSize: '16px' }}>✅</span>
          Bereits bewertet
        </div>
      );
    }

    if (ratingInfo.canRate) {
      return (
        <button
          onClick={() => setIsRatingModalOpen(true)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 sm:px-6 py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base"
        >
          <span style={{ fontSize: '16px' }}>⭐</span>
          {ratingInfo.ratedUserName} bewerten
        </button>
      );
    }

    // Debug-Info anzeigen, wenn kein Button angezeigt wird
    if (currentUserId && !ratingInfo.canRate && !ratingInfo.hasRated) {
      return (
        <div className="text-center text-gray-500 text-sm">
          <p>Keine Bewertung möglich</p>
          <p className="text-xs">{ratingInfo.reason}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="">
      <div className="w-full h-full max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              post.type === 'request'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {post.type === 'request' ? 'Hilfe gesucht' : '🤝 Hilfe angeboten'}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {post.category}
            </span>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: getStatusColor(post.status) }}
            >
              {getStatusText(post.status)}
            </span>
            {/* Zusammenarbeit Badge - nur anzeigen wenn aktiv UND noch nicht bewertet */}
            {post.has_active_collaboration && post.status !== 'rated' && (
              <span className="inline-flex animate-pulse items-center px-2 py-1 rounded-full text-[12px] text-center font-medium bg-purple-600 text-white">
                Jetzt Bewerten!
              </span>
            )}
          </div>
          
          {/* Auto-close warning - nur bei 'active' Status */}
          {post.status === 'active' && post.auto_close_date && (
            <div className="text-xs text-gray-400 font-medium bg-gray-50 px-0.5 py-0.5 rounded text-right">
              {getTimeUntilClose(post.auto_close_date)}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h2>
          </div>
          
          {/* Description */}
          <div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">Beschreibung</h3>
            <div className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{post.description}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Location & Time */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Details</h4>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-700 text-sm sm:text-base">{post.location}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 text-sm sm:text-base">{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Kontakt</h4>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm sm:text-base md:text-lg">
                    {post.user.first_name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{post.user.first_name || 'Unbekannt'} {post.user.last_name || ''}</p>
                  <div style={{ marginBottom: '2px' }}>
                    <RatingDisplay userId={post.user_id} size="small" inline={true} />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">PLZ: {post.user.postal_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 p-3 sm:p-4 md:p-6 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
            {/* Aktive Posts - Hilfe anbieten/kontaktieren */}
            {post.status === 'active' && currentUserId && currentUserId !== post.user_id && (
              <button
                onClick={handleHelpClick}
                disabled={isLoadingHelp || isHelping}
                className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg transform text-sm sm:text-base ${
                  isLoadingHelp || isHelping
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-60' 
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:-translate-y-0.5'
                }`}
                style={{
                  backgroundColor: (isLoadingHelp || isHelping) ? '#9ca3af' : undefined,
                  cursor: (isLoadingHelp || isHelping) ? 'not-allowed' : 'pointer',
                  opacity: (isLoadingHelp || isHelping) ? 0.6 : 1
                }}
              >
                {isLoadingHelp ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Helfe...
                  </>
                ) : isHelping ? (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Hilfe gesendet
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.type === 'request' ? 'Helfen' : 'Kontakt aufnehmen'}
                  </>
                )}
              </button>
            )}

            {/* Post schließen - nur für Post-Ersteller bei 'rated' Status */}
            {currentUserId === post.user_id && post.status === 'rated' && (
              <button
                onClick={handleClosePost}
                disabled={isClosing}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                aria-label={isClosing ? "Post wird geschlossen..." : "Post schließen"}
              >
                {isClosing ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Schließe...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Post schließen
                  </>
                )}
              </button>
            )}

            {/* Bewertungsbutton - für beide Parteien */}
            {currentUserId && renderRatingButton()}

            {/* Inaktive Posts - Info für nicht-beteiligte Nutzer */}
            {post.status !== 'active' && (!currentUserId || (currentUserId !== post.user_id && !ratingInfo.canRate)) && (
              <div className="text-center text-gray-500">
                <p className="text-sm">Dieser Post ist nicht mehr aktiv</p>
                <p className="text-xs">Status: {getStatusText(post.status)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        ratedUserId={ratingInfo.ratedUserId}
        ratedUserName={ratingInfo.ratedUserName}
        postId={post.id}
        postTitle={post.title}
        onRatingSubmitted={() => {
          setRatingInfo({ ...ratingInfo, hasRated: true });
          setIsRatingModalOpen(false);
        }}
      />
    </Modal>
  );
};

export default PostDetailModal;
