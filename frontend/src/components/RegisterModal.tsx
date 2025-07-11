import React, { useState } from 'react';
import Modal from './Modal';
import { simpleApi } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';
import { validatePassword } from '../utils/validation';
import { inputStyle } from '../utils/styles';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [error, setError] = useState('');
  const { showSuccess } = useToast();



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value
    });

    // Passwort-Validierung
    if (name === 'password') {
      setPasswordErrors(validatePassword(value));
      setPasswordMatch(value === formData.confirmPassword || formData.confirmPassword === '');
    }

    // Passwort-Bestätigung prüfen
    if (name === 'confirmPassword') {
      setPasswordMatch(value === formData.password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validierung vor Submit
    const currentPasswordErrors = validatePassword(formData.password);
    const currentPasswordMatch = formData.password === formData.confirmPassword;

    setPasswordErrors(currentPasswordErrors);
    setPasswordMatch(currentPasswordMatch);

    // Name validation
    if (!formData.name.trim()) {
      setError('Bitte geben Sie Ihren Namen ein');
      return;
    }

    const nameParts = formData.name.trim().split(' ');
    if (nameParts.length < 2 || nameParts[1].trim() === '') {
      setError('Bitte geben Sie Vor- und Nachname ein (z.B. "Max Mustermann")');
      return;
    }

    if (formData.name.trim().length < 3) {
      setError('Der Name muss mindestens 3 Zeichen lang sein');
      return;
    }

    if (currentPasswordErrors.length > 0 || !currentPasswordMatch) {
      return;
    }

    setIsLoading(true);

    try {
      // Split name into first and last name
      const nameParts = formData.name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || first_name.charAt(0); // Fallback to first letter if no last name

      const response = await simpleApi.register({
        email: formData.email,
        password: formData.password,
        first_name,
        last_name,
        postal_code: '12345' // Default for demo
      });



      // Show success message
      showSuccess(`Willkommen, ${response.user.first_name}! Registrierung erfolgreich.`);

      // Close modal and reset form
      onClose();
      setFormData({
        name: '',
        email: '',
        address: '',
        password: '',
        confirmPassword: ''
      });

      // Optionally redirect or update app state
      window.location.reload(); // Simple reload for demo

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler bei der Registrierung';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Konto erstellen">
      <p className="text-gray-600 text-center mb-6">
        Werden Sie Teil der Nachbarschaftsgemeinschaft
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Vollständiger Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Max Mustermann"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
          <p className="text-xs text-gray-500 mt-1">
            Bitte geben Sie Vor- und Nachname ein (z.B. "Max Mustermann")
          </p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            E-Mail-Adresse
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="ihre.email@beispiel.de"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Adresse
          </label>
          <input
            id="address"
            name="address"
            type="text"
            required
            value={formData.address}
            onChange={handleChange}
            placeholder="Musterstraße 123, 12345 Stadt"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            style={{
              ...inputStyle,
              borderColor: passwordErrors.length > 0 ? '#ef4444' : '#d1d5db'
            }}
            onFocus={(e) => e.target.style.borderColor = passwordErrors.length > 0 ? '#ef4444' : '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = passwordErrors.length > 0 ? '#ef4444' : '#d1d5db'}
          />

          {/* Passwort-Anforderungen */}
          {formData.password && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-gray-700">Passwort-Anforderungen:</p>
              {[
                { check: formData.password.length >= 8, text: 'Mindestens 8 Zeichen' },
                { check: /[A-Z]/.test(formData.password), text: 'Mindestens ein Großbuchstabe' },
                { check: /[a-z]/.test(formData.password), text: 'Mindestens ein Kleinbuchstabe' },
                { check: /[0-9]/.test(formData.password), text: 'Mindestens eine Zahl' },
                { check: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), text: 'Mindestens ein Sonderzeichen' }
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
            placeholder="••••••••"
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

        <div className="flex items-start">
          <input
            type="checkbox"
            required
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 mr-2"
          />
          <label className="text-sm text-gray-600">
            Ich stimme den{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Nutzungsbedingungen
            </a>{' '}
            und der{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Datenschutzerklärung
            </a>{' '}
            zu.
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading || passwordErrors.length > 0 || !passwordMatch || !formData.password || !formData.confirmPassword}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Konto wird erstellt...
            </div>
          ) : (
            'Konto erstellen'
          )}
        </button>
      </form>

      {/* Sign in link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Bereits ein Konto?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Jetzt anmelden
          </button>
        </p>
      </div>
    </Modal>
  );
}

export default RegisterModal;
