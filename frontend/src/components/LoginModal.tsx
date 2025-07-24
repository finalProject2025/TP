import React, { useState, useEffect } from "react";
import { GoogleLogin } from "@react-oauth/google";
import Modal from "./Modal";
import { simpleApi } from "../services/simpleApi";
import { useToast } from "../hooks/useToast";
import { useLoadingState } from "../hooks/useLoadingState";
import LoadingSpinner from "./LoadingSpinner";
import ForgotPasswordModal from "./ForgotPasswordModal";
import GoogleOAuthProfileModal from "./GoogleOAuthProfileModal";
import EmailVerificationModal from "./EmailVerificationModal";
import { PasswordInput } from "./PasswordInput";
import type { CredentialResponse } from "@react-oauth/google";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showGoogleOAuthProfile, setShowGoogleOAuthProfile] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [googleCredential, setGoogleCredential] = useState<CredentialResponse | null>(null);

  const { showSuccess, showError } = useToast();
  const { isLoading, handleAsyncOperation } = useLoadingState();

  // WICHTIG: Reset showEmailVerification when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowEmailVerification(false);
      setUnverifiedEmail("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await handleAsyncOperation(
        () => simpleApi.login(email, password),
        "Fehler beim Login"
      );

      // Show success message
      showSuccess(`Willkommen zurück, ${response.user.first_name}!`);

      // Close modal and reset form
      onClose();
      setEmail("");
      setPassword("");
      setShowEmailVerification(false);
      setUnverifiedEmail("");
      
    } catch (error: unknown) {
      // Prüfen ob E-Mail-Validierung erforderlich ist
      if (error && typeof error === 'object' && 'requiresEmailVerification' in error) {
        setUnverifiedEmail(email);
        setShowEmailVerification(true);
      }
      // Error is already handled by handleAsyncOperation
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setGoogleCredential(credentialResponse);
    
    try {
      const response = await handleAsyncOperation(
        () => simpleApi.googleLogin(credentialResponse.credential || ""),
        "Fehler beim Google Login"
      );

      if (response.requiresProfileCompletion) {
        setShowGoogleOAuthProfile(true);
      } else {
        showSuccess(`Willkommen zurück, ${response.user.first_name}!`);
        onClose();
        setGoogleCredential(null);
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleGoogleError = () => {
    showError("Google Login fehlgeschlagen");
  };

  const handleEmailVerificationClose = () => {
    setShowEmailVerification(false);
    setUnverifiedEmail("");
    // NICHT onClose() aufrufen - nur das EmailVerificationModal schließen
  };

  const handleEmailVerificationSuccess = () => {
    setShowEmailVerification(false);
    setUnverifiedEmail("");
    showSuccess("E-Mail erfolgreich verifiziert! Sie können sich jetzt anmelden.");
    // NICHT onClose() aufrufen - nur das EmailVerificationModal schließen
  };

  if (showForgotPassword) {
    return (
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    );
  }

  if (showGoogleOAuthProfile && googleCredential) {
    return (
      <GoogleOAuthProfileModal
        isOpen={showGoogleOAuthProfile}
        onClose={() => setShowGoogleOAuthProfile(false)}
        credential={googleCredential.credential || ""}
        onSuccess={() => {
          setShowGoogleOAuthProfile(false);
          onClose();
          setGoogleCredential(null);
        }}
      />
    );
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="flex flex-col items-center p-6">
          {/* Logo */}
          <div className="mb-5 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl" translate="no" >N</span>
              </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Anmelden
          </h2>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ihre@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort
              </label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ihr Passwort"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <LoadingSpinner /> : "Anmelden"}
            </button>
          </form>

          {/* Forgot Password Link */}
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800"
          >
            Passwort vergessen?
          </button>

          {/* Divider */}
          <div className="w-full flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-sm text-gray-500">oder</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Google Login */}
          <div className="w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
            />
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Noch kein Konto?{" "}
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                // Hier würde normalerweise das Register-Modal geöffnet
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Jetzt registrieren
            </button>
          </div>
        </div>
      </Modal>

      {/* E-Mail-Verifizierung Modal */}
      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={handleEmailVerificationClose}
        email={unverifiedEmail}
        onVerificationSuccess={handleEmailVerificationSuccess}
      />
    </>
  );
};

export default LoginModal;