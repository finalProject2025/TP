import React, { useState, useEffect } from 'react';
import { simpleApi } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';

interface HelpOffer {
  id: string;
  post_id: string;
  helper_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  is_read: boolean;
  created_at: string;
  post_title: string;
  post_type: string;
  post_category: string;
  first_name: string;
  last_name: string;
  postal_code: string;
}

interface HelpOffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (helperId: string, helperName: string) => void;
}

const HelpOffersModal: React.FC<HelpOffersModalProps> = ({
  isOpen,
  onClose,
  onStartChat
}) => {
  const [helpOffers, setHelpOffers] = useState<HelpOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadHelpOffers();
    }
  }, [isOpen]);

  const loadHelpOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const offers = await simpleApi.getHelpOffers();
      setHelpOffers(offers);
    } catch (error: unknown) {
      console.error('Error loading help offers:', error);
      setError(error.message || 'Fehler beim Laden der Hilfe-Angebote');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (offerId: string, helperId: string, helperName: string) => {
    try {
      await simpleApi.acceptHelpOffer(offerId);
      
      // Update local state
      setHelpOffers(prev => 
        prev.map(offer => 
          offer.id === offerId 
            ? { ...offer, status: 'accepted', is_read: true }
            : offer
        )
      );

      // Start chat
      onStartChat(helperId, helperName);

      // Show success message
      showSuccess('Hilfe-Angebot angenommen! Chat wird gestartet.');
    } catch (error: unknown) {
      console.error('Error accepting help offer:', error);
      showError(error.message || 'Fehler beim Annehmen des Hilfe-Angebots');
    }
  };

  const handleDecline = async (offerId: string) => {
    try {
      await simpleApi.declineHelpOffer(offerId);
      
      // Update local state
      setHelpOffers(prev => 
        prev.map(offer => 
          offer.id === offerId 
            ? { ...offer, status: 'declined', is_read: true }
            : offer
        )
      );
      
      showSuccess('Hilfe-Angebot abgelehnt.');
    } catch (error: unknown) {
      console.error('Error declining help offer:', error);
      showError(error.message || 'Fehler beim Ablehnen des Hilfe-Angebots');
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours} Std.`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)} Tagen`;

    return date.toLocaleDateString('de-DE');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#10b981';
      case 'declined': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return 'Angenommen';
      case 'declined': return 'Abgelehnt';
      default: return 'Ausstehend';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Hilfe-Angebote ({helpOffers.length})
          </h2>
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
              <p className="mt-2 text-gray-600">Lade Hilfe-Angebote...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={loadHelpOffers}
                className="mt-2 text-red-600 hover:text-red-800 font-medium"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {!loading && !error && helpOffers.length === 0 && (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Hilfe-Angebote</h3>
              <p className="text-gray-600">Sie haben noch keine Hilfe-Angebote erhalten.</p>
            </div>
          )}

          {!loading && !error && helpOffers.length > 0 && (
            <div className="space-y-4">
              {helpOffers.map((offer) => (
                <div
                  key={offer.id}
                  className={`border rounded-lg p-4 ${
                    !offer.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {offer.first_name.charAt(0)}{offer.last_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {offer.first_name} {offer.last_name}
                        </h4>
                        <p className="text-sm text-gray-600">📍 PLZ {offer.postal_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getStatusColor(offer.status) }}
                      >
                        {getStatusText(offer.status)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(offer.created_at)}</p>
                    </div>
                  </div>

                  {/* Post Info */}
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">Post: {offer.post_title}</p>
                    <p className="text-xs text-gray-600">{offer.post_category}</p>
                  </div>

                  {/* Message */}
                  {offer.message && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 italic">"{offer.message}"</p>
                    </div>
                  )}

                  {/* Actions */}
                  {offer.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(offer.id, offer.helper_id, `${offer.first_name} ${offer.last_name}`)}
                        className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors"
                      >
                        Annehmen & Chat starten
                      </button>
                      <button
                        onClick={() => handleDecline(offer.id)}
                        className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                      >
                        Ablehnen
                      </button>
                    </div>
                  )}

                  {offer.status === 'accepted' && (
                    <button
                      onClick={() => onStartChat(offer.helper_id, `${offer.first_name} ${offer.last_name}`)}
                      className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                    >
                      Chat öffnen
                    </button>
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

export default HelpOffersModal;
