// Database Models
export interface User {
  id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  postal_code: string;
  description?: string;
  skills?: string;
  profile_image?: string;
  profile_image_url?: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  created_at?: string;
  updated_at?: string;
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
  status: 'active' | 'in_progress' | 'rated' | 'closed' | 'auto_closed';
  auto_close_date: string;
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

export interface HelpOffer {
  id: string;
  post_id: string;
  helper_id: string;
  post_owner_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  is_read: boolean;
  created_at: string;
  updated_at: string;
  post_title?: string;
  post_type?: string;
  post_category?: string;
  first_name?: string;
  last_name?: string;
  postal_code?: string;
}

export interface Review {
  id: string;
  rater_id: string;
  rated_user_id: string;
  post_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  rater?: User;
  rated_user?: User;
  post?: Post;
}

// Request/Response Types
export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  postal_code: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message?: string;
  user?: User;
  token?: string;
  error?: string;
}

export interface CreatePostRequest {
  type: 'offer' | 'request';
  category: string;
  title: string;
  description: string;
  location?: string;
  postal_code: string;
  available_from?: string;
  available_until?: string;
}

export interface UpdatePostRequest {
  category?: string;
  title?: string;
  description?: string;
  location?: string;
  postal_code?: string;
  available_from?: string;
  available_until?: string;
  is_active?: boolean;
}

export interface CreateMessageRequest {
  receiver_id: string;
  other_user_id?: string;
  post_id?: string;
  subject?: string;
  content?: string;
  initial_message?: string;
}

export interface CreateHelpOfferRequest {
  message?: string;
}

export interface CreateReviewRequest {
  rated_user_id: string;
  post_id: string;
  rating: number;
  comment?: string;
}

export interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
  postal_code: string;
  profile_image_url?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  new_password: string;
}

// JWT Types
export interface JWTPayload {
  userId: string;
  email: string;
  postal_code: string;
  iat?: number;
  exp?: number;
}

// Database Query Types
export interface UserRow {
  id: string;
  email: string;
  password_hash?: string;
  first_name: string;
  last_name: string;
  postal_code: string;
  description?: string;
  skills?: string;
  profile_image?: string;
  profile_image_url?: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
  google_id?: string;
  auth_provider?: string;
  email_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostRow {
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
  status: 'active' | 'in_progress' | 'rated' | 'closed' | 'auto_closed';
  auto_close_date: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  post_id?: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface HelpOfferRow {
  id: string;
  post_id: string;
  helper_id: string;
  post_owner_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  rater_id: string;
  rated_user_id: string;
  post_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
}

// API Response Types
export interface ApiResponse<T = Record<string, unknown>> {
  message?: string;
  data?: T;
  error?: string;
  success?: boolean;
}

export interface PostsResponse {
  posts: Post[];
}

export interface CategoriesResponse {
  categories: string[];
}

export interface HelpOffersResponse {
  help_offers: HelpOffer[];
}

export interface RatingInfoResponse {
  hasRated: boolean;
  canRate: boolean;
  reason: string;
  ratedUserId: string;
  ratedUserName: string;
  postId: number;
  raterId: string;
}

export interface RatingResponse {
  success: boolean;
  message: string;
  rating: Review;
}

export interface UserRatingSummaryResponse {
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

// Extended Types for API Responses
export interface ExtendedPost extends Post {
  user: User & { initials?: string };
}

// Filter Types
export interface PostFilters {
  type?: string;
  category?: string;
  postal_code?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Utility Types
export type PostType = 'offer' | 'request';
export type PostStatus = 'active' | 'in_progress' | 'rated' | 'closed' | 'auto_closed';
export type HelpOfferStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export type RatingValue = 1 | 2 | 3 | 4 | 5;

export interface Conversation {
  other_user_id: string;
  other_user_name: string;
  related_post_id?: string;
  post_title?: string;
  post_type?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
} 