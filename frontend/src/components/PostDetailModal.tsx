import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from '../hooks/useToast';
import RatingModal from './RatingModal';
import RatingDisplay from './RatingDisplay';
import { simpleApi, getApiBaseUrl } from '../services/simpleApi';
import type { ExtendedPost } from '../types';

interface PostDetailModalProps {
  post: ExtendedPost;
  onClose: () => void;
  onHelp: (post: ExtendedPost) => void;
  onContact?: (post: ExtendedPost) => void;
  currentUserId?: string;
  onPostClosed?: () => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  onClose,
  onHelp,
  onContact,
  currentUserId,
  onPostClosed
}) => {
  const [isClosing, setIsClosing] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [canRate, setCanRate] = useState(false);
  const [ratingReason, setRatingReason] = useState('');
  const [checkingRating, setCheckingRating] = useState(true);
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
      case 'closed': return '#6b7280'; // gray
      case 'auto_closed': return '#ef4444'; // red
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'in_progress': return 'In Bearbeitung';
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

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Einkaufen': '🛒',
      'Gartenarbeit': '🌱',
      'Haustiere': '🐕',
      'Handwerk': '🔨',
      'Transport': '🚗',
      'Kinderbetreuung': '👶',
      'Senioren': '👴',
      'Sonstiges': '💡'
    };
    return icons[category] || '💡';
  };

  // Prüfe ob bereits bewertet wurde
  useEffect(() => {
    const checkExistingRating = async () => {
      if (!currentUserId || currentUserId === post.user_id) {
        setCheckingRating(false);
        return;
      }

      try {
        const data = await simpleApi.checkExistingRating(post.id);
        setHasRated(data.hasRated || false);
        setCanRate(data.canRate || false);
        setRatingReason(data.reason || '');
      } catch (error) {
        console.error('Error checking rating:', error);
      } finally {
        setCheckingRating(false);
      }
    };

    checkExistingRating();
  }, [currentUserId, post.id, post.user_id]);

  return (
    <Modal isOpen={true} onClose={onClose} title="">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{getCategoryIcon(post.category)}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  post.type === 'request'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {post.type === 'request' ? '🙏 Hilfe gesucht' : '🤝 Hilfe angeboten'}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {post.category}
                </span>
                <span
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getStatusColor(post.status) }}
                >
                  {getStatusText(post.status)}
                </span>
              </div>
              {post.status === 'active' && post.auto_close_date && (
                <div className="text-xs text-orange-600 font-medium">
                  ⏰ {getTimeUntilClose(post.auto_close_date)}
                </div>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h2>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Beschreibung</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.description}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Location & Time */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Details</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-700">{post.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Kontakt</h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {post.user.first_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{post.user.first_name} {post.user.last_name}</p>
                  <div style={{ marginBottom: '4px' }}>
                    <RatingDisplay userId={post.user_id} size="small" inline={true} />
                  </div>
                  <p className="text-sm text-gray-500">PLZ: {post.user.postal_code}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 pt-6 border-t border-gray-200">
            {post.status === 'active' && currentUserId !== post.user_id && (
              <>
                <button
                  onClick={() => {
                    if (post.type === 'request') {
                      onHelp(post);
                    } else if (post.type === 'offer' && onContact) {
                      onContact(post);
                    }
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {post.type === 'request' ? 'Helfen' : 'Kontakt aufnehmen'}
                </button>

                {checkingRating ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                ) : hasRated ? (
                  <div className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gray-100 text-gray-600">
                    <span style={{ fontSize: '16px' }}>✅</span>
                    Bereits bewertet
                  </div>
                ) : canRate && (
                  <button
                    onClick={() => setIsRatingModalOpen(true)}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <span style={{ fontSize: '16px' }}>⭐</span>
                    Bewerten
                  </button>
                )}
              </>
            )}

            {currentUserId === post.user_id && post.status === 'active' && (
              <button
                onClick={handleClosePost}
                disabled={isClosing}
                className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-600 hover:to-gray-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClosing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Schließe...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Post schließen
                  </>
                )}
              </button>
            )}

            {post.status !== 'active' && currentUserId && currentUserId !== post.user_id && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">Dieser Post ist nicht mehr aktiv</p>
                <p className="text-xs text-gray-400 mb-4">Status: {getStatusText(post.status)}</p>

                {/* Rating Button für abgeschlossene Posts */}
                {checkingRating ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : hasRated ? (
                  <div className="text-center text-gray-500">
                    <p className="text-sm">Bereits bewertet</p>
                    <p className="text-xs">Status: {getStatusText(post.status)}</p>
                  </div>
                ) : canRate && (
                  <button
                    onClick={() => setIsRatingModalOpen(true)}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-2 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
                  >
                    <span style={{ fontSize: '16px' }}>⭐</span>
                    {post.user.first_name} bewerten
                  </button>
                )}
              </div>
            )}

            {post.status !== 'active' && (!currentUserId || currentUserId === post.user_id) && (
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
        ratedUserId={post.user_id}
        ratedUserName={`${post.user.first_name} ${post.user.last_name}`}
        postId={post.id}
        postTitle={post.title}
        onRatingSubmitted={() => {
          setHasRated(true);
          setIsRatingModalOpen(false);
        }}
      />
    </Modal>
  );
};

export default PostDetailModal;
