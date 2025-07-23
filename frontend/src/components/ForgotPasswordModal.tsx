import React, { useState } from 'react';
import Modal from './Modal';
import { simpleApi } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';
import { useLoadingState } from '../hooks/useLoadingState';
import LoadingSpinner from './LoadingSpinner';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const { isLoading, error, handleAsyncOperation } = useLoadingState();
  const [success, setSuccess] = useState('');
  const { showSuccess } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    try {
      await handleAsyncOperation(
        () => simpleApi.forgotPassword(email),
        'Fehler beim Zurücksetzen des Passworts'
      );
      setSuccess('Wenn die E-Mail existiert, wurde eine Nachricht versendet.');
      showSuccess('Wenn die E-Mail existiert, wurde eine Nachricht versendet.');
      setEmail('');
    } catch {
      // Error is already handled by handleAsyncOperation
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Passwort vergessen?">
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
            Bitte gib deine E-Mail-Adresse ein
          </label>
          <input
            id="forgot-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="ihre.email@beispiel.de"
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
            aria-describedby="forgot-email-error"
          />
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg" role="alert" aria-live="assertive">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg" role="alert" aria-live="polite">{success}</div>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isLoading ? "E-Mail wird gesendet..." : "E-Mail senden"}
        >
          {isLoading ? <LoadingSpinner size="sm" showText={false} className="mr-2" /> : 'E-Mail senden'}
        </button>
      </form>
    </Modal>
  );
};

export default ForgotPasswordModal; 