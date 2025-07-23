import React, { useState, useEffect } from 'react';

import { useToast } from '../hooks/useToast';
import { simpleApi } from '../services/simpleApi';
import type { User } from '../types';

import Modal from './Modal';

interface GoogleOAuthProfileModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onProfileUpdated?: () => void;
  readonly credential?: string;
  readonly onSuccess?: () => void;
}

const GoogleOAuthProfileModal = ({ isOpen, onClose, onProfileUpdated }: GoogleOAuthProfileModalProps) => {
  const [profile, setProfile] = useState<Partial<User>>({
    first_name: '',
    last_name: '',
    postal_code: '',
    description: '',
    skills: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Prüfe ob User authentifiziert ist
        if (!simpleApi.isAuthenticated()) {
          throw new Error('Kein Token verfügbar für Profil-Update');
        }

        // Versuche zuerst Namen aus user_data zu laden (für Google-User)
        const userData = localStorage.getItem('user_data');
        let initialFirstName = '';
        let initialLastName = '';

        if (userData) {
          try {
            const user = JSON.parse(userData);
            initialFirstName = user.first_name || '';
            initialLastName = user.last_name || '';
          } catch {
            // Falls JSON parsing fehlschlägt, ignorieren
          }
        }

        // Profil laden
        const userProfile = await simpleApi.getCurrentUserProfile();
        setProfile({
          first_name: userProfile.first_name || initialFirstName,
          last_name: userProfile.last_name || initialLastName,
          postal_code: userProfile.postal_code ?? '',
          description: userProfile.description ?? '',
          skills: userProfile.skills ?? '',
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        showError('Fehler beim Laden des Profils');
      } finally {
        setInitialLoading(false);
      }
    };

    if (isOpen) {
      void loadProfile();
    }
  }, [isOpen, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.first_name?.trim() || !profile.last_name?.trim() || !profile.postal_code?.trim()) {
      showError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    setLoading(true);
    try {
      await simpleApi.updateProfile({
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
        postal_code: profile.postal_code.trim(),
        description: profile.description?.trim() ?? '',
        skills: profile.skills?.trim() ?? '',
      });

      showSuccess('Profil erfolgreich aktualisiert!');
      onProfileUpdated?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Fehler beim Aktualisieren des Profils');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof User, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (initialLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Profil vervollständigen">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Lade Profil...</span>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profil vervollständigen">
      <div className="space-y-6 p-6">
        <p className="text-gray-600 text-center">
          Bitte vervollständigen Sie Ihr Profil, um die App nutzen zu können.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vorname *
              </label>
              <input
                type="text"
                value={profile.first_name ?? ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ihr Vorname"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nachname *
              </label>
              <input
                type="text"
                value={profile.last_name ?? ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ihr Nachname"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postleitzahl *
            </label>
            <input
              type="text"
              value={profile.postal_code ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                // Nur Ziffern erlauben und maximal 5 Zeichen
                if (/^\d{0,5}$/.test(value)) {
                  handleInputChange('postal_code', value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ihre Postleitzahl"
              maxLength={5}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Über mich
            </label>
            <textarea
              value={profile.description ?? ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Erzählen Sie etwas über sich..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fähigkeiten
            </label>
            <textarea
              value={profile.skills ?? ''}
              onChange={(e) => handleInputChange('skills', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ihre Fähigkeiten und Interessen..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              aria-label="Profil-Bearbeitung abbrechen"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={loading ? "Profil wird gespeichert..." : "Profil speichern"}
            >
              {loading ? 'Speichere...' : 'Profil speichern'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default GoogleOAuthProfileModal;
