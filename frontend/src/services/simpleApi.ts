import type { User, Post, CreatePostData, UpdatePostData, CreateMessageData, CreateReviewData, PostFilters } from '../types';

// Dynamic API URL detection
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;

  // If accessing via localhost, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3002/api';
  }

  // If accessing via external IP, use the same IP for API
  return `http://${hostname}:3002/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.href = '/';
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  
  return response.json();
};

// Extended Post interface for status field
export interface ExtendedPost extends Post {
  status: 'active' | 'in_progress' | 'closed' | 'auto_closed';
  auto_close_date: string;
  user: User & { initials?: string };
}

interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// API Functions
// Helper functions
export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'vor wenigen Sekunden';
  if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Min.`;
  if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)} Std.`;
  if (diffInSeconds < 604800) return `vor ${Math.floor(diffInSeconds / 86400)} Tagen`;

  return date.toLocaleDateString('de-DE');
};

export const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Einkaufen': '#3b82f6',
    'Transport': '#10b981',
    'Haushalt': '#f59e0b',
    'Garten': '#22c55e',
    'Handwerk': '#8b5cf6',
    'Betreuung': '#ef4444',
    'Sonstiges': '#6b7280'
  };
  return colors[category] || '#6b7280';
};

export const simpleApi = {
  // Auth
  async register(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    postal_code: string;
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();

    // Store token and user data
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
    }

    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Store token and user data
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_data', JSON.stringify(data.user));
    }

    return data;
  },

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  },

  // Posts - Alias für getAllPosts für Kompatibilität
  async getPosts(): Promise<ExtendedPost[]> {
    return this.getAllPosts();
  },

  async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/posts/categories`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    const data = await handleResponse(response);
    return data.categories || [];
  },

  async createPost(postData: CreatePostData): Promise<ExtendedPost> {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(postData),
    });

    const data = await handleResponse(response);
    return data.post;
  },

  // Help Offers
  async offerHelp(postId: string, message?: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/help`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        message: message || null
      }),
    });

    return handleResponse(response);
  },

  async getHelpOffers(): Promise<unknown[]> {
    const response = await fetch(`${API_BASE_URL}/help-offers`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await handleResponse(response);
    return data.help_offers || [];
  },

  async markHelpOfferAsRead(offerId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/help-offers/${offerId}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async acceptHelpOffer(offerId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/help-offers/${offerId}/accept`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async declineHelpOffer(offerId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/help-offers/${offerId}/decline`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },



  async startConversation(otherUserId: string, postId?: string, initialMessage?: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/conversations/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        other_user_id: otherUserId,
        post_id: postId,
        initial_message: initialMessage
      }),
    });

    return handleResponse(response);
  },

  // Utility
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  getCurrentUserId(): string | null {
    const userData = localStorage.getItem('user_data');
    if (!userData) return null;

    try {
      const user = JSON.parse(userData);
      return user.id || null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },

  // Ratings
  async createRating(ratedUserId: string, postId: string, rating: number, comment?: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/ratings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        rated_user_id: ratedUserId,
        post_id: postId,
        rating,
        comment
      }),
    });

    return handleResponse(response);
  },

  async getUserRatingSummary(userId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/rating-summary`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  async getUserRatings(userId: string, limit: number = 10): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/ratings?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    return handleResponse(response);
  },

  // User Profile
  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  async getUserById(id: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // POSTS
  async getAllPosts(filters?: PostFilters): Promise<ExtendedPost[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
                  if (value !== undefined && value !== '' && value !== null) {
          params.append(key, value.toString());
        }
        });
      }
      
      const response = await fetch(`${API_BASE_URL}/posts?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      
      const data = await handleResponse(response);
      return data.posts || [];
    } catch (error) {
      console.error('Error in getAllPosts:', error);
      throw error;
    }
  },

  async getPostById(id: string): Promise<ExtendedPost> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async updatePost(id: string, postData: UpdatePostData): Promise<ExtendedPost> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(postData),
    });
    return handleResponse(response);
  },

  async deletePost(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getUserPosts(): Promise<ExtendedPost[]> {
    const response = await fetch(`${API_BASE_URL}/posts/user/my-posts`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // CATEGORIES (nur falls nicht vorhanden)
  // getCategories ist bereits vorhanden

  // MESSAGES (neue Versionen mit fetch)
  async getMessages(type?: 'sent' | 'received' | 'all'): Promise<unknown> {
    const params = type ? `?type=${type}` : '';
    const response = await fetch(`${API_BASE_URL}/messages${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getConversations(): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async sendMessage(messageData: CreateMessageData): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(messageData),
    });
    return handleResponse(response);
  },

  async getMessageById(id: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/messages/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async markAsRead(id: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/messages/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  // REVIEWS
  async createReview(reviewData: CreateReviewData): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse(response);
  },

  async getUserReviews(userId: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/reviews/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async canUserReview(userId: string, postId?: string): Promise<unknown> {
    const params = postId ? `?postId=${postId}` : '';
    const response = await fetch(`${API_BASE_URL}/reviews/can-review/${userId}${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async deleteReview(id: string): Promise<unknown> {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Senden der E-Mail');
    }
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, newPassword }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Fehler beim Zurücksetzen des Passworts');
    }
  },
};

// Duplicate exports removed - functions are already defined above

export type { User, Post, AuthResponse };
