import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import type { User } from '../types';

const ProfilePage = React.memo(function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [passwordMode, setPasswordMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showSuccess, showError } = useToast();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    postal_code: '',
    profile_image_url: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Dynamic API URL
  const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3002'
    : `http://${window.location.hostname}:3002`;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        window.location.href = '/';
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfileForm({
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          postal_code: data.user.postal_code || '',
          profile_image_url: data.user.profile_image || ''
        });
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/';
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
    
    if (!profileForm.first_name.trim() || !profileForm.last_name.trim()) {
      showError('Vor- und Nachname sind erforderlich');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      
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
      showError('Neues Passwort und Bestätigung stimmen nicht überein');
      return;
    }

    if (passwordForm.new_password.length < 6) {
      showError('Das neue Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${apiBaseUrl}/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordForm)
      });

      if (response.ok) {
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        setPasswordMode(false);
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
      window.location.href = '/';
    }
  };

  const getProfileImageUrl = () => {
    if (user?.profile_image) {
      return user.profile_image;
    }
    // Default avatar with initials
    const initials = user ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}` : 'U';
    return `https://ui-avatars.com/api/?name=${initials}&size=128&background=3b82f6&color=ffffff&bold=true`;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#6b7280'
      }}>
        Lade Profil...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#ef4444'
      }}>
        Fehler beim Laden des Profils
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#111827',
          margin: 0
        }}>
          👤 Mein Profil
        </h1>
        
        <button
          onClick={handleLogout}
          style={{
            backgroundColor: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Abmelden
        </button>
      </div>

      {/* Profile Card */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '20px'
      }}>
        {/* Profile Image */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <img
            src={getProfileImageUrl()}
            alt="Profilbild"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              marginRight: '20px',
              objectFit: 'cover'
            }}
          />
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 4px 0'
            }}>
              {user.first_name} {user.last_name}
            </h2>
            <p style={{
              color: '#6b7280',
              margin: 0,
              fontSize: '14px'
            }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Profile Form or Display */}
        {editMode ? (
          <form onSubmit={handleProfileSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Vorname *
              </label>
              <input
                type="text"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm({...profileForm, first_name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Nachname *
              </label>
              <input
                type="text"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm({...profileForm, last_name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Postleitzahl
              </label>
              <input
                type="text"
                value={profileForm.postal_code}
                onChange={(e) => setProfileForm({...profileForm, postal_code: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Profilbild-URL
              </label>
              <input
                type="url"
                value={profileForm.profile_image_url}
                onChange={(e) => setProfileForm({...profileForm, profile_image_url: e.target.value})}
                placeholder="https://example.com/bild.jpg"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  backgroundColor: saving ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                style={{
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Abbrechen
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <strong style={{ color: '#374151' }}>Postleitzahl:</strong>
              <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                {user.postal_code || 'Nicht angegeben'}
              </span>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <strong style={{ color: '#374151' }}>Mitglied seit:</strong>
              <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                {new Date(user.created_at).toLocaleDateString('de-DE')}
              </span>
            </div>

            <button
              onClick={() => setEditMode(true)}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                marginRight: '12px'
              }}
            >
              Profil bearbeiten
            </button>

            <button
              onClick={() => setPasswordMode(true)}
              style={{
                backgroundColor: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Passwort ändern
            </button>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {passwordMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 20px 0'
            }}>
              🔒 Passwort ändern
            </h3>

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Aktuelles Passwort *
                </label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Neues Passwort *
                </label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Neues Passwort bestätigen *
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    backgroundColor: saving ? '#9ca3af' : '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    flex: 1
                  }}
                >
                  {saving ? 'Ändern...' : 'Passwort ändern'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordMode(false);
                    setPasswordForm({
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProfilePage;
