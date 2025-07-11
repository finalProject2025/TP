import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { simpleApi } from '../services/simpleApi';
import { useToast } from '../hooks/useToast';
import CreatePostModal from './CreatePostModal';
import ChatModal from './ChatModal';
import PostDetailModal from './PostDetailModal';
import LoadingScreen from './LoadingScreen';
import RatingDisplay from './RatingDisplay';

// Import the ExtendedPost type from simpleApi
import type { ExtendedPost } from '../services/simpleApi';

function SimplePostsPage() {
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showMyPostsOnly, setShowMyPostsOnly] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ExtendedPost | null>(null);
  const [chatModal, setChatModal] = useState<{
    isOpen: boolean;
    otherUserId: string;
    otherUserName: string;
    postTitle: string;
  }>({
    isOpen: false,
    otherUserId: '',
    otherUserName: '',
    postTitle: ''
  });

  const { showSuccess, showError } = useToast();

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const postsData = await simpleApi.getPosts();
      setPosts(postsData);
      setError('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Posts';
      setError(errorMessage);
      showError('Fehler beim Laden der Posts');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleHelp = async (post: ExtendedPost) => {
    if (!simpleApi.isAuthenticated()) {
      showError('Sie müssen angemeldet sein, um Hilfe anzubieten');
      return;
    }

    try {
      await simpleApi.offerHelp(post.id);
      showSuccess(`Hilfe-Angebot für "${post.title}" erfolgreich gesendet! Der Ersteller wird benachrichtigt.`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Hilfe anbieten';
      setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleContact = async (post: ExtendedPost) => {
    if (!simpleApi.isAuthenticated()) {
      showError('Sie müssen angemeldet sein, um Kontakt aufzunehmen');
      return;
    }

    try {
      // Use dynamic API URL for network compatibility
      const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002'
        : `http://${window.location.hostname}:3002`;

      const response = await fetch(`${apiBaseUrl}/api/posts/${post.id}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message: 'Ich bin interessiert an Ihrem Hilfe-Angebot!'
        })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Senden der Kontaktanfrage');
      }

      showSuccess(`Kontaktanfrage für "${post.title}" erfolgreich gesendet! Der Anbieter wird benachrichtigt.`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Kontaktieren des Hilfeangebots';
      setError(errorMessage);
      showError(errorMessage);
    }
  };



  // Filter and sort posts
  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || post.category === selectedCategory;
      const matchesType = !selectedType || post.type === selectedType;
      const matchesOwner = !showMyPostsOnly || post.user_id === simpleApi.getCurrentUserId();

      return matchesSearch && matchesCategory && matchesType && matchesOwner;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'location':
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });

  const categories = ['Einkaufen', 'Gartenarbeit', 'Haustiere', 'Handwerk', 'Transport', 'Kinderbetreuung', 'Senioren', 'Sonstiges'];

  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'vor wenigen Minuten';
    if (diffInHours < 24) return `vor ${diffInHours} Std.`;
    if (diffInHours < 168) return `vor ${Math.floor(diffInHours / 24)} Tagen`;

    return date.toLocaleDateString('de-DE');
  };

  if (loading) {
    return (
      <LoadingScreen
        text="Posts werden geladen"
        subtitle="Nachbarschaftshilfe wird vorbereitet..."
        fullScreen={true}
      />
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '16px 20px',
          marginBottom: '20px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            ← Zurück zur Startseite
          </Link>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            Nachbarschaftshilfe
          </h1>
          <div style={{ width: '120px' }}></div>
        </div>

        {/* Error */}
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '0 auto'
        }}>
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>Fehler beim Laden</h3>
          <p style={{ color: '#7f1d1d', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={loadPosts}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px 20px',
        marginBottom: '20px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          ← Zurück zur Startseite
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            Nachbarschaftshilfe
          </h1>
          <span style={{
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500'
          }}>
            {filteredPosts.length} Posts
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowMyPostsOnly(!showMyPostsOnly)}
            style={{
              backgroundColor: showMyPostsOnly ? '#3b82f6' : '#f3f4f6',
              color: showMyPostsOnly ? 'white' : '#374151',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (showMyPostsOnly) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              } else {
                e.currentTarget.style.backgroundColor = '#e5e7eb';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = showMyPostsOnly ? '#3b82f6' : '#f3f4f6';
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {showMyPostsOnly ? 'Alle Posts' : 'Meine Posts'}
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Neuen Post erstellen
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
          Filter & Suche
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Search */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Suche
            </label>
            <input
              type="text"
              placeholder="Titel, Beschreibung, Ort..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Kategorie
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="">Alle Kategorien</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Typ
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="">Alle Typen</option>
              <option value="request">Hilfe gesucht</option>
              <option value="offer">Hilfe angeboten</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Sortierung
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                backgroundColor: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            >
              <option value="newest">Neueste zuerst</option>
              <option value="oldest">Älteste zuerst</option>
              <option value="title">Nach Titel</option>
              <option value="location">Nach Ort</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || selectedCategory || selectedType || showMyPostsOnly) && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>Aktive Filter:</span>

              {searchTerm && (
                <span style={{
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Suche: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', padding: '0', fontSize: '12px' }}
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedCategory && (
                <span style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory('')}
                    style={{ background: 'none', border: 'none', color: '#166534', cursor: 'pointer', padding: '0', fontSize: '12px' }}
                  >
                    ×
                  </button>
                </span>
              )}

              {selectedType && (
                <span style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {selectedType === 'request' ? 'Hilfe gesucht' : 'Hilfe angeboten'}
                  <button
                    onClick={() => setSelectedType('')}
                    style={{ background: 'none', border: 'none', color: '#92400e', cursor: 'pointer', padding: '0', fontSize: '12px' }}
                  >
                    ×
                  </button>
                </span>
              )}

              {showMyPostsOnly && (
                <span style={{
                  backgroundColor: '#e0e7ff',
                  color: '#3730a3',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Meine Posts
                  <button
                    onClick={() => setShowMyPostsOnly(false)}
                    style={{ background: 'none', border: 'none', color: '#3730a3', cursor: 'pointer', padding: '0', fontSize: '12px' }}
                  >
                    ×
                  </button>
                </span>
              )}

              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedType('');
                  setShowMyPostsOnly(false);
                }}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '4px 8px',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Alle Filter löschen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div style={{
          backgroundColor: 'white',
          padding: '40px 20px',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#6b7280', marginBottom: '8px' }}>Keine Posts gefunden</h3>
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>
            {posts.length === 0
              ? 'Noch keine Hilfe-Anfragen vorhanden.'
              : 'Keine Posts entsprechen Ihrer Suche.'
            }
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px'
        }}>
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: post.type === 'request' ? '#f59e0b' : '#10b981',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '14px',
                  marginRight: '12px'
                }}>
                  {post.user.first_name.charAt(0)}{post.user.last_name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    {post.user.first_name} {post.user.last_name}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <RatingDisplay userId={post.user_id} size="small" inline={true} />
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                    📍 {post.location}
                  </p>
                </div>
                <span style={{
                  backgroundColor: post.type === 'request' ? '#fef3c7' : '#d1fae5',
                  color: post.type === 'request' ? '#92400e' : '#065f46',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '500'
                }}>
                  {post.type === 'request' ? 'Sucht Hilfe' : 'Bietet Hilfe'}
                </span>
              </div>

              {/* Content */}
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827',
                lineHeight: '1.4'
              }}>
                {post.title}
              </h3>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '14px',
                color: '#6b7280',
                lineHeight: '1.5',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {post.description}
              </p>

              {/* Footer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #f3f4f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {post.category}
                  </span>
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    {formatTimeAgo(post.created_at)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHelp(post);
                    }}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    {post.type === 'request' ? 'Helfen' : 'Kontakt'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={loadPosts}
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModal.isOpen}
        onClose={() => setChatModal(prev => ({ ...prev, isOpen: false }))}
        otherUserId={chatModal.otherUserId}
        otherUserName={chatModal.otherUserName}
        postTitle={chatModal.postTitle}
      />

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onHelp={handleHelp}
          onContact={handleContact}
          currentUserId={simpleApi.getCurrentUserId() ?? undefined}
          onPostClosed={() => {
            setSelectedPost(null);
            loadPosts(); // Posts neu laden
          }}
        />
      )}
    </div>
  );
}

export default SimplePostsPage;
