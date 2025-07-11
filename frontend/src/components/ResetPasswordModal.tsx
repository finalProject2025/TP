import React, { useState } from 'react';
import Modal from './Modal';
import { simpleApi } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { validatePassword } from '../utils/validation';
import { inputStyle } from '../utils/styles';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  token: string;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose, email, token }) => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    // Passwort-Validierung
    if (name === 'newPassword') {
      setPasswordErrors(validatePassword(value));
      setPasswordMatch(value === formData.confirmPassword || formData.confirmPassword === '');
    }

    // Passwort-Bestätigung prüfen
    if (name === 'confirmPassword') {
      setPasswordMatch(value === formData.newPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validierung vor Submit
    const currentPasswordErrors = validatePassword(formData.newPassword);
    const currentPasswordMatch = formData.newPassword === formData.confirmPassword;

    setPasswordErrors(currentPasswordErrors);
    setPasswordMatch(currentPasswordMatch);

    if (currentPasswordErrors.length > 0 || !currentPasswordMatch) {
      return;
    }

    setIsLoading(true);
    try {
      await simpleApi.resetPassword(email, token, formData.newPassword);
      setSuccess('Passwort erfolgreich zurückgesetzt! Du kannst dich jetzt einloggen.');
      showSuccess('Passwort erfolgreich zurückgesetzt!');
      setFormData({ newPassword: '', confirmPassword: '' });
      // Nach erfolgreichem Reset zur Startseite weiterleiten
      setTimeout(() => {
        navigate('/');
        onClose();
      }, 2000); // 2 Sekunden warten, damit der User die Erfolgsmeldung sieht
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Zurücksetzen des Passworts';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Passwort zurücksetzen">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Neues Passwort
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Neues Passwort"
            style={{
              ...inputStyle,
              borderColor: passwordErrors.length > 0 ? '#ef4444' : '#d1d5db'
            }}
            onFocus={(e) => e.target.style.borderColor = passwordErrors.length > 0 ? '#ef4444' : '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = passwordErrors.length > 0 ? '#ef4444' : '#d1d5db'}
          />

          {/* Passwort-Anforderungen */}
          {formData.newPassword && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-gray-700">Passwort-Anforderungen:</p>
              {[
                { check: formData.newPassword.length >= 8, text: 'Mindestens 8 Zeichen' },
                { check: /[A-Z]/.test(formData.newPassword), text: 'Mindestens ein Großbuchstabe' },
                { check: /[a-z]/.test(formData.newPassword), text: 'Mindestens ein Kleinbuchstabe' },
                { check: /[0-9]/.test(formData.newPassword), text: 'Mindestens eine Zahl' },
                { check: /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword), text: 'Mindestens ein Sonderzeichen' }
              ].map((requirement, index) => (
                <div key={index} className="flex items-center text-xs">
                  <span className={`mr-2 ${requirement.check ? 'text-green-500' : 'text-red-500'}`}>
                    {requirement.check ? '✓' : '✗'}
                  </span>
                  <span className={requirement.check ? 'text-green-700' : 'text-red-600'}>
                    {requirement.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Passwort bestätigen"
            style={{
              ...inputStyle,
              borderColor: !passwordMatch ? '#ef4444' : '#d1d5db'
            }}
            onFocus={(e) => e.target.style.borderColor = !passwordMatch ? '#ef4444' : '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = !passwordMatch ? '#ef4444' : '#d1d5db'}
          />

          {/* Passwort-Match Anzeige */}
          {formData.confirmPassword && (
            <div className="mt-2">
              <div className="flex items-center text-xs">
                <span className={`mr-2 ${passwordMatch ? 'text-green-500' : 'text-red-500'}`}>
                  {passwordMatch ? '✓' : '✗'}
                </span>
                <span className={passwordMatch ? 'text-green-700' : 'text-red-600'}>
                  {passwordMatch ? 'Passwörter stimmen überein' : 'Passwörter stimmen nicht überein'}
                </span>
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{success}</div>}

        <button
          type="submit"
          disabled={isLoading || passwordErrors.length > 0 || !passwordMatch || !formData.newPassword || !formData.confirmPassword}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <LoadingSpinner size="sm" showText={false} className="mr-2" /> : 'Passwort zurücksetzen'}
        </button>
      </form>
    </Modal>
  );
};

export default ResetPasswordModal; 