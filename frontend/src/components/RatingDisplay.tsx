import React, { useState, useEffect, useCallback } from 'react';
import { simpleApi } from '../services/simpleApi';
import type { RatingSummary } from '../types';

interface RatingDisplayProps {
  userId: string;
  showCount?: boolean;
  size?: 'small' | 'medium' | 'large';
  inline?: boolean;
}

const RatingDisplay: React.FC<RatingDisplayProps> = ({
  userId,
  showCount = true,
  size = 'medium',
  inline = false
}) => {
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRatingSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await simpleApi.getUserRatingSummary(userId) as RatingSummary;
      setRatingSummary(data);
      setError('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Bewertung';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadRatingSummary();
  }, [loadRatingSummary]);

  const getSizeStyles = (): { fontSize: string; starSize: string; gap: string } => {
    switch (size) {
      case 'small':
        return {
          fontSize: '12px',
          starSize: '14px',
          gap: '4px'
        };
      case 'large':
        return {
          fontSize: '18px',
          starSize: '20px',
          gap: '8px'
        };
      default: // medium
        return {
          fontSize: '14px',
          starSize: '16px',
          gap: '6px'
        };
    }
  };

  const renderStars = (rating: number, starSize: string) => {
    // Stelle sicher, dass rating zwischen 0 und 5 liegt
    const clampedRating = Math.max(0, Math.min(5, rating));
    
    // Berechne die Anzahl der vollen Sterne
    const fullStars = Math.floor(clampedRating);
    
    // Berechne, ob ein Halbstern angezeigt werden soll
    const decimalPart = clampedRating - fullStars;
    const hasHalfStar = decimalPart >= 0.3 && decimalPart <= 0.7;
    
    // Berechne die Anzahl der leeren Sterne
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
        {/* Full stars */}
        {Array.from({ length: fullStars }, (_, i) => (
          <span key={`full-${i}`} style={{ fontSize: starSize, color: '#fbbf24' }}>⭐</span>
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <span key="half" style={{ fontSize: starSize, color: '#fbbf24', position: 'relative' }}>
            <span style={{ color: '#d1d5db' }}>⭐</span>
            <span style={{ 
              position: 'absolute', 
              left: 0, 
              top: 0, 
              width: '50%', 
              overflow: 'hidden',
              color: '#fbbf24'
            }}>⭐</span>
          </span>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }, (_, i) => (
          <span key={`empty-${i}`} style={{ fontSize: starSize, color: '#d1d5db' }}>⭐</span>
        ))}
      </span>
    );
  };

  if (loading) {
    return (
      <span style={{
        display: inline ? 'inline-flex' : 'flex',
        alignItems: 'center',
        gap: getSizeStyles().gap,
        color: '#9ca3af',
        fontSize: getSizeStyles().fontSize
      }}>
        <span style={{ fontSize: getSizeStyles().starSize }}>⭐</span>
        Lädt...
      </span>
    );
  }

  if (error || !ratingSummary) {
    return null; // Don't show anything if there's an error
  }

  if (ratingSummary.total_ratings === 0) {
    return (
      <span style={{
        display: inline ? 'inline-flex' : 'flex',
        alignItems: 'center',
        gap: getSizeStyles().gap,
        color: '#9ca3af',
        fontSize: getSizeStyles().fontSize
      }}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={`empty-${i}`} style={{ fontSize: getSizeStyles().starSize, color: '#d1d5db' }}>☆</span>
        ))}
        Noch keine Bewertungen
      </span>
    );
  }

  const styles = getSizeStyles();
  const averageRating = parseFloat(ratingSummary.average_rating) || 0;

  return (
    <span style={{
      display: inline ? 'inline-flex' : 'flex',
      alignItems: 'center',
      gap: styles.gap,
      fontSize: styles.fontSize,
      color: '#374151'
    }}>
      {renderStars(averageRating, String(styles.starSize))}
      
      <span style={{ fontWeight: '500' }}>
        {averageRating.toFixed(1)}
      </span>
      
      {showCount && (
        <span style={{ color: '#6b7280' }}>
          ({ratingSummary.total_ratings})
        </span>
      )}
    </span>
  );
};

export default RatingDisplay;
