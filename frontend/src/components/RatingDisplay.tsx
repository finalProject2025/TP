import React, { useState, useEffect } from 'react';

interface RatingDisplayProps {
  userId: string;
  showCount?: boolean;
  size?: 'small' | 'medium' | 'large';
  inline?: boolean;
}

interface RatingSummary {
  total_ratings: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
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

  useEffect(() => {
    loadRatingSummary();
  }, [userId]);

  const loadRatingSummary = async () => {
    try {
      setLoading(true);
      setError('');

      // Use dynamic API URL for network compatibility
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002'
        : `http://${window.location.hostname}:3002`;

      const response = await fetch(`${apiBaseUrl}/api/users/${userId}/rating-summary`);

      if (!response.ok) {
        throw new Error('Fehler beim Laden der Bewertungen');
      }

      const data = await response.json();
      setRatingSummary(data);
    } catch (err: unknown) {
      console.error('Error loading rating summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSizeStyles = () => {
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
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
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
        <span style={{ fontSize: getSizeStyles().starSize, color: '#d1d5db' }}>⭐</span>
        Noch keine Bewertungen
      </span>
    );
  }

  const styles = getSizeStyles();

  return (
    <span style={{
      display: inline ? 'inline-flex' : 'flex',
      alignItems: 'center',
      gap: styles.gap,
      fontSize: styles.fontSize,
      color: '#374151'
    }}>
      {renderStars(ratingSummary.average_rating, styles.starSize)}
      
      <span style={{ fontWeight: '500' }}>
        {ratingSummary.average_rating.toFixed(1)}
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
