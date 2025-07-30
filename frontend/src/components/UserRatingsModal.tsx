import React, { useState, useEffect, useCallback } from 'react';
import { simpleApi } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';
import { formatTimeAgo } from '../utils/dateUtils';
import type { UserRating } from '../types';

interface UserRatingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

const UserRatingsModal: React.FC<UserRatingsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName
}) => {
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  // Verbesserte Version des UserRatingsModal
  const loadUserRatings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await simpleApi.getUserRatings(userId, 50);
      
      // Debug-Logging
      console.log('UserRatings API Response:', response);
      
      // Handle different response structures
      let ratings = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          ratings = response;
        } else if ('ratings' in response && Array.isArray((response as Record<string, unknown>).ratings)) {
          ratings = (response as Record<string, unknown>).ratings as UserRating[];
        } else if ('data' in response && Array.isArray((response as Record<string, unknown>).data)) {
          ratings = (response as Record<string, unknown>).data as UserRating[];
        }
      }
      
      console.log('Processed ratings:', ratings);
      setRatings(ratings);
    } catch (error: unknown) {
      console.error('Error loading user ratings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Laden der Bewertungen';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, showError]);

  useEffect(() => {
    if (isOpen && userId) {
      loadUserRatings();
    }
  }, [isOpen, userId, loadUserRatings]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          style={{
            fontSize: '14px',
            color: i <= rating ? '#fbbf24' : '#d1d5db'
          }}
        >
          {i <= rating ? '⭐' : '☆'}
        </span>
      );
    }
    return stars;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Bewertungen von {userName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {ratings.length} Bewertung{ratings.length !== 1 ? 'en' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Lade Bewertungen...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadUserRatings}
                className="mt-2 text-red-600 hover:text-red-800 font-medium"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {!loading && !error && ratings.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Bewertungen</h3>
              <p className="text-gray-600">
                {userName} hat noch keine Bewertungen erhalten.
              </p>
            </div>
          )}

          {!loading && !error && ratings.length > 0 && (
            <div className="space-y-4">
              {ratings.map((rating) => (
                <div
                  key={rating.id}
                  className="border rounded-lg p-4 bg-white border-gray-200"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {rating.rater_first_name.charAt(0)}{rating.rater_last_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {rating.rater_first_name} {rating.rater_last_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {renderStars(rating.rating)}
                          </div>
                          <span className="text-xs text-gray-500">
                            {rating.rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatTimeAgo(rating.created_at)}</p>
                    </div>
                  </div>

                  {/* Post Info */}
                  {rating.post_title && (
                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                      <p className="text-gray-700 font-medium">Für: {rating.post_title}</p>
                    </div>
                  )}

                  {/* Comment */}
                  {rating.comment && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-700 italic">"{rating.comment}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRatingsModal; 