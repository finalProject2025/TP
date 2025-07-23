import React, { useState } from 'react';
import Modal from './Modal';
import { simpleApi } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';
import { useLoadingState } from '../hooks/useLoadingState';
import LoadingSpinner from './LoadingSpinner';

interface PostalCodeModalProps {
  isOpen: boolean;
  onPostalCodeSubmitted: () => void;
}

function PostalCodeModal({ isOpen, onPostalCodeSubmitted }: PostalCodeModalProps) {
  const [postalCode, setPostalCode] = useState('');
  const { isLoading, error, setError, handleAsyncOperation } = useLoadingState();
  const { showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!postalCode.trim()) {
      setError('Bitte geben Sie eine Postleitzahl ein');
      return;
    }

    // Backend-Validierung wird verwendet - keine Frontend-Validierung mehr
    try {
      await handleAsyncOperation(
        () => simpleApi.updatePostalCode(postalCode.trim()),
        'Fehler beim Speichern der Postleitzahl'
      );
      showSuccess('Postleitzahl erfolgreich gespeichert!');
      onPostalCodeSubmitted();
    } catch {
      // Error is already handled by handleAsyncOperation
    }
  };

  // Das Modal kann nicht geschlossen werden - es ist verpflichtend
  const handleClose = () => {
    // Keine Aktion - Modal kann nicht geschlossen werden
    return;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Postleitzahl erforderlich"
      canClose={false} // Modal kann nicht geschlossen werden
    >
      <div className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Postleitzahl erforderlich
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Um die Nachbarschaftshilfe nutzen zu können, benötigen wir Ihre Postleitzahl.
            Diese wird für die lokale Zuordnung Ihrer Anfragen benötigt.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
              Postleitzahl *
            </label>
            <input
              id="postalCode"
              type="text"
              required
              value={postalCode}
              onChange={(e) => {
                const value = e.target.value;
                // Nur Ziffern erlauben und maximal 5 Zeichen
                if (/^\d{0,5}$/.test(value)) {
                  setPostalCode(value);
                }
              }}
              className="input-field"
              placeholder="12345"
              maxLength={5}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              aria-describedby="postal-code-error"
            />
            <p className="text-xs text-gray-500 mt-1">
              Bitte geben Sie eine gültige 5-stellige deutsche Postleitzahl ein
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !postalCode.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isLoading ? "Postleitzahl wird gespeichert..." : "Postleitzahl speichern"}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" showText={false} className="mr-2" />
                Speichern...
              </div>
            ) : (
              'Postleitzahl speichern'
            )}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500">
          <p>⚠️ Diese Eingabe ist verpflichtend und kann nicht übersprungen werden.</p>
        </div>
      </div>
    </Modal>
  );
}

export default PostalCodeModal; 