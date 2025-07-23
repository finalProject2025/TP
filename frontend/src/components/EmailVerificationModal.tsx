import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from './Modal';
import { simpleApi } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';
import { useLoadingState } from '../hooks/useLoadingState';
import LoadingSpinner from './LoadingSpinner';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  token?: string;
  onVerificationSuccess?: () => void;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({ 
  isOpen, 
  onClose, 
  email, 
  token,
  onVerificationSuccess
}) => {
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const { isLoading, handleAsyncOperation } = useLoadingState();
  const { showSuccess, showError } = useToast();
  const hasVerified = useRef(false);
  const hasShownToast = useRef(false);

  const verifyEmail = useCallback(async () => {
    if (!token || hasVerified.current) return;

    try {
      hasVerified.current = true;
      await handleAsyncOperation(
        () => simpleApi.verifyEmail(email, token),
        'Fehler bei der E-Mail-Verifizierung'
      );
      setVerificationStatus('success');
    } catch (error) {
      setVerificationStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unbekannter Fehler');
    }
  }, [token, email, handleAsyncOperation]);

  // Show toast messages based on verification status (only once)
  useEffect(() => {
    if (verificationStatus === 'success' && !hasShownToast.current) {
      hasShownToast.current = true;
      showSuccess('E-Mail-Adresse erfolgreich bestätigt!');
      onVerificationSuccess?.();
    } else if (verificationStatus === 'error' && !hasShownToast.current) {
      hasShownToast.current = true;
      showError('E-Mail-Verifizierung fehlgeschlagen');
    }
  }, [verificationStatus, showSuccess, showError, onVerificationSuccess]);

  useEffect(() => {
    if (isOpen && token && !hasVerified.current) {
      verifyEmail();
    }
  }, [isOpen, token, verifyEmail]);

  // Reset verification state when modal opens with new token
  useEffect(() => {
    if (isOpen && token) {
      hasVerified.current = false;
      hasShownToast.current = false;
      setVerificationStatus('pending');
      setErrorMessage('');
    }
  }, [isOpen, token]);

  const resendEmail = async () => {
    try {
      await handleAsyncOperation(
        () => simpleApi.resendVerificationEmail(email),
        'Fehler beim erneuten Senden der E-Mail'
      );
      showSuccess('Verifizierungs-E-Mail wurde erneut gesendet');
    } catch {
      showError('Fehler beim erneuten Senden der E-Mail');
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
          <span className="ml-3 text-gray-600">Verifiziere E-Mail...</span>
        </div>
      );
    }

    if (verificationStatus === 'success') {
      return (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">E-Mail bestätigt!</h3>
          <p className="text-gray-600 mb-6">
            Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie können sich jetzt anmelden.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Schließen
          </button>
        </div>
      );
    }

    if (verificationStatus === 'error') {
      return (
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Verifizierung fehlgeschlagen</h3>
          <p className="text-gray-600 mb-4">
            {errorMessage || 'Der Verifizierungs-Link ist ungültig oder abgelaufen.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={resendEmail}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? <LoadingSpinner /> : 'E-Mail erneut senden'}
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      );
    }

    // Pending state (no token provided)
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">E-Mail-Verifizierung</h3>
        <p className="text-gray-600 mb-6">
          Bitte überprüfen Sie Ihre E-Mails und klicken Sie auf den Verifizierungs-Link.
        </p>
        <div className="space-y-3">
          <button
            onClick={resendEmail}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner /> : 'E-Mail erneut senden'}
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="E-Mail-Verifizierung">
      <div className="p-6">
        {renderContent()}
      </div>
    </Modal>
  );
};

export default EmailVerificationModal;