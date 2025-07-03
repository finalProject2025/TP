import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import LoadingSpinner from './LoadingSpinner';
import { useToast } from '../hooks/useToast';
import type { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    postal_code: '',
    profile_image_url: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      if (!token) {
        showError('Sie müssen angemeldet sein');
        onClose();
        return;
      }

      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002'
        : `http://${window.location.hostname}:3002`;

      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfileForm({
          postal_code: data.user.postal_code || '',
          profile_image_url: data.user.profile_image || ''
        });
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        showError('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
        onClose();
      } else {
        showError('Fehler beim Laden des Profils');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showError('Fehler beim Laden des Profils');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002'
        : `http://${window.location.hostname}:3002`;

      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileForm)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditMode(false);
        showSuccess('Profil erfolgreich aktualisiert');
      } else {
        const error = await response.json();
        showError(error.error || 'Fehler beim Aktualisieren des Profils');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Fehler beim Aktualisieren des Profils');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      showError('Alle Passwort-Felder sind erforderlich');
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showError('Neue Passwörter stimmen nicht überein');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      showError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002'
        : `http://${window.location.hostname}:3002`;

      const response = await fetch(`${apiBaseUrl}/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });

      if (response.ok) {
        setPasswordMode(false);
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
        showSuccess('Passwort erfolgreich geändert');
      } else {
        const error = await response.json();
        showError(error.error || 'Fehler beim Ändern des Passworts');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError('Fehler beim Ändern des Passworts');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002'
        : `http://${window.location.hostname}:3002`;
      
      // Call logout API
      await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always remove token and redirect
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      showSuccess('Erfolgreich abgemeldet');
      onClose();
      window.location.href = '/';
    }
  };

  const getProfileImageUrl = () => {
    if (user?.profile_image_url) {
      return user.profile_image_url;
    }
    // Default avatar with initials
    const initials = user ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` : 'U';
    return `https://ui-avatars.com/api/?name=${initials}&size=128&background=3b82f6&color=ffffff&bold=true`;
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="👤 Mein Profil">
        <div className="py-8">
          <LoadingSpinner
            size="lg"
            text="Profil wird geladen..."
            className="py-4"
          />
        </div>
      </Modal>
    );
  }

  if (!user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Fehler">
        <p className="text-center text-gray-600">Profil konnte nicht geladen werden.</p>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👤 Mein Profil">
      <div className="space-y-6">
        {/* Profile Image */}
        <div className="flex items-center space-x-4">
          <img
            src={getProfileImageUrl()}
            alt="Profilbild"
            className="w-20 h-20 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.first_name} {user.last_name}
            </h3>
            <p className="text-gray-600 text-sm">{user.email}</p>
            <p className="text-gray-500 text-xs">
              Mitglied seit {new Date(user.created_at).toLocaleDateString('de-DE')}
            </p>
          </div>
        </div>

        {/* Profile Form or Display */}
        {editMode ? (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postleitzahl
              </label>
              <input
                type="text"
                value={profileForm.postal_code}
                onChange={(e) => setProfileForm({...profileForm, postal_code: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12345"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" showText={false} className="mr-2" />
                    Speichern...
                  </>
                ) : (
                  'Speichern'
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        ) : passwordMode ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aktuelles Passwort *
              </label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neues Passwort *
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neues Passwort bestätigen *
              </label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={6}
                required
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" showText={false} className="mr-2" />
                    Ändern...
                  </>
                ) : (
                  'Passwort ändern'
                )}
              </button>
              <button
                type="button"
                onClick={() => setPasswordMode(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <strong className="text-gray-700">Postleitzahl:</strong>
              <span className="ml-2 text-gray-600">
                {user.postal_code || 'Nicht angegeben'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={() => setEditMode(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                PLZ bearbeiten
              </button>
              <button
                onClick={() => setPasswordMode(true)}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Passwort ändern
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Abmelden
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ProfileModal;
