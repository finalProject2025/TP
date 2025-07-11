export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  postal_code: string;
  description?: string;
  skills?: string;
  profile_image?: string;
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  type: 'offer' | 'request';
  category: string;
  title: string;
  description: string;
  location: string;
  postal_code: string;
  available_from?: string;
  available_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  post_id?: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
  receiver?: User;
  post?: Post;
}

export interface Conversation {
  other_user_id: string;
  other_user_name: string;
  related_post_id?: string;
  post_title?: string;
  post_type?: 'offer' | 'request';
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  post_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer?: User;
  post?: Post;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  postal_code: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface CreatePostData {
  type: 'offer' | 'request';
  category: string;
  title: string;
  description: string;
  location: string;
  postal_code: string;
  available_from?: string;
  available_until?: string;
}

export interface UpdatePostData {
  category?: string;
  title?: string;
  description?: string;
  location?: string;
  postal_code?: string;
  available_from?: string;
  available_until?: string;
  is_active?: boolean;
}

export interface CreateMessageData {
  receiver_id: string;
  post_id?: string;
  subject: string;
  content: string;
}

export interface CreateReviewData {
  reviewed_user_id: string;
  post_id?: string;
  rating: number;
  comment?: string;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export interface PostFilters {
  type?: string;
  category?: string;
  postal_code?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface UserStats {
  totalPosts: number;
  totalReviews: number;
  averageRating: number;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: number]: number };
}

// Extended Post interface for status field
export interface ExtendedPost extends Post {
  status: 'active' | 'in_progress' | 'closed' | 'auto_closed';
  auto_close_date: string;
  user: User & { initials?: string };
}

// Auth Response interface
export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

// Help Offer interface
export interface HelpOffer {
  id: string;
  post_id: string;
  helper_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  is_read: boolean;
  created_at: string;
  post_title: string;
  post_type: string;
  post_category: string;
  first_name: string;
  last_name: string;
  postal_code: string;
}

// Chat Message interface (different from Message in types/index.ts)
export interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  sender_name?: string;
  is_own_message?: boolean;
}

// Rating Summary interface
export interface RatingSummary {
  total_ratings: number;
  average_rating: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
