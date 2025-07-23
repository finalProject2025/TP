import React, { useState } from 'react';
import Modal from './Modal';
import { useToast } from '../hooks/useToast';
import { getApiBaseUrl } from '../services/simpleApi';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ratedUserId: string;
  ratedUserName: string;
  postId: string;
  postTitle: string;
  onRatingSubmitted?: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  ratedUserId,
  ratedUserName,
  postId,
  postTitle,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      showError('Bitte wählen Sie eine Bewertung aus');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          rated_user_id: ratedUserId,
          post_id: postId,
          rating,
          comment: comment.trim() || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Erstellen der Bewertung');
      }

      showSuccess(`Bewertung für ${ratedUserName} erfolgreich erstellt!`);
      
      // Reset form
      setRating(0);
      setComment('');
      
      // Notify parent component
      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
      
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Erstellen der Bewertung';
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    onClose();
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      // Stern ist gelb, wenn er kleiner/gleich hoveredRating ODER (kein Hover aktiv und kleiner/gleich rating)
      const isHovered = hoveredRating > 0;
      const shouldBeYellow = isHovered ? i <= hoveredRating : i <= rating;

      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '32px',
            cursor: 'pointer',
            padding: '4px',
            transition: 'all 0.2s',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: '1'
          }}
          disabled={isSubmitting}
        >
          {shouldBeYellow ? '⭐' : '☆'}
        </button>
      );
    }
    return stars;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827'
          }}>
            ⭐ {ratedUserName} bewerten
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Für: "{postTitle}"
          </p>
        </div>

        {/* Rating Stars */}
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: '16px',
            fontWeight: '500',
            color: '#374151'
          }}>
            Wie war die Zusammenarbeit?
          </p>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '4px',
            marginBottom: '8px'
          }}>
            {renderStars()}
          </div>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            {rating === 0 && 'Klicken Sie auf die Sterne'}
            {rating === 1 && 'Sehr schlecht'}
            {rating === 2 && 'Schlecht'}
            {rating === 3 && 'Okay'}
            {rating === 4 && 'Gut'}
            {rating === 5 && 'Sehr gut'}
          </p>
        </div>

        {/* Comment */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Kommentar (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Teilen Sie Ihre Erfahrung mit..."
            maxLength={500}
            disabled={isSubmitting}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          <p style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            color: '#9ca3af',
            textAlign: 'right'
          }}>
            {comment.length}/500
          </p>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#d1d5db';
              }
            }}
            aria-label="Bewertung abbrechen"
          >
            Abbrechen
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: (isSubmitting || rating === 0) ? '#9ca3af' : '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (isSubmitting || rating === 0) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && rating > 0) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSubmitting && rating > 0) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
            aria-label={isSubmitting ? "Bewertung wird gesendet..." : "Bewertung senden"}
          >
            {isSubmitting && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ffffff',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {isSubmitting ? 'Wird gesendet...' : 'Bewertung senden'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  );
};

export default RatingModal;
