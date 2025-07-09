import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useToast } from '../hooks/useToast';
import { simpleApi } from '../services/simpleApi';
import LoadingSpinner from './LoadingSpinner';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  const [formData, setFormData] = useState({
    type: 'request' as 'request' | 'offer',
    title: '',
    description: '',
    category: '',
    location: ''
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const categoriesData = await simpleApi.getCategories();
      setCategories(categoriesData);
    } catch (err: unknown) {
      console.error('Failed to load categories:', err);
      // Fallback categories
      setCategories(['Einkaufen', 'Gartenarbeit', 'Handwerk', 'Transport', 'Kinderbetreuung', 'Seniorenhilfe', 'Haustiere', 'Umzug', 'Technik', 'Sonstiges']);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.title.trim()) {
      setError('Bitte geben Sie einen Titel ein');
      return;
    }
    if (!formData.description.trim()) {
      setError('Bitte geben Sie eine Beschreibung ein');
      return;
    }
    if (!formData.category) {
      setError('Bitte wählen Sie eine Kategorie');
      return;
    }

    // Check if user is logged in
    if (!simpleApi.isAuthenticated()) {
      setError('Sie müssen angemeldet sein, um einen Post zu erstellen');
      return;
    }

    setIsLoading(true);

    try {
      await simpleApi.createPost({
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        location: formData.location.trim() || 'Nicht angegeben',
        postal_code: '12345' // Default for demo
      });

      // Success
      showSuccess(`${formData.type === 'request' ? 'Hilfe-Anfrage' : 'Hilfe-Angebot'} erfolgreich erstellt!`);

      // Reset form
      setFormData({
        type: 'request',
        title: '',
        description: '',
        category: '',
        location: ''
      });
      
      // Close modal and refresh posts
      onClose();
      onPostCreated();
      
    } catch (err: unknown) {
      showError(err.message || 'Fehler beim Erstellen des Posts');
      setError(err.message || 'Fehler beim Erstellen des Posts');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Neue Hilfe-Anfrage erstellen">
      <p className="text-gray-600 text-center mb-6">
        Erstellen Sie eine neue Hilfe-Anfrage oder bieten Sie Ihre Hilfe an
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Art der Anfrage
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="request"
                checked={formData.type === 'request'}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm">Ich suche Hilfe</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="offer"
                checked={formData.type === 'offer'}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm">Ich biete Hilfe an</span>
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Titel *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            placeholder={formData.type === 'request' ? 'z.B. Hilfe beim Einkaufen gesucht' : 'z.B. Biete Gartenhilfe an'}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Kategorie *
          </label>
          {loadingCategories ? (
            <div style={inputStyle}>Lade Kategorien...</div>
          ) : (
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="">Kategorie wählen</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Beschreibung *
          </label>
          <textarea
            id="description"
            name="description"
            required
            value={formData.description}
            onChange={handleChange}
            placeholder={formData.type === 'request' 
              ? 'Beschreiben Sie, wobei Sie Hilfe benötigen...' 
              : 'Beschreiben Sie, wobei Sie helfen können...'}
            rows={4}
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Standort (optional)
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location}
            onChange={handleChange}
            placeholder="z.B. Musterstraße 123"
            style={inputStyle}
            onFocus={(e) => e.target.style.borderColor = '#2563eb'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || loadingCategories}
          className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" showText={false} className="mr-2" />
              Wird erstellt...
            </div>
          ) : (
            `${formData.type === 'request' ? 'Hilfe-Anfrage' : 'Hilfe-Angebot'} erstellen`
          )}
        </button>
      </form>
    </Modal>
  );
}

export default CreatePostModal;
