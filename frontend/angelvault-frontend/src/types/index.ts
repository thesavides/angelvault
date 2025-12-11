// User types
export type UserRole = 'investor' | 'developer' | 'admin';
export type AuthProvider = 'email' | 'google' | 'linkedin' | 'apple';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  role: UserRole;
  auth_provider: AuthProvider;
  profile_image_url?: string;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
  investor_profile?: InvestorProfile;
}

export interface InvestorProfile {
  id: string;
  user_id: string;
  investor_type: 'individual' | 'institutional';
  bio?: string;
  linkedin_url?: string;
  website_url?: string;
  profile_image_url?: string;
  min_check_size?: number;
  max_check_size?: number;
  focus_areas?: string[];
  preferred_stages?: string[];
  is_profile_public: boolean;
  // Institutional fields
  company_legal_name?: string;
  company_registration?: string;
  company_jurisdiction?: string;
  company_address?: string;
  signatory_name?: string;
  signatory_title?: string;
  signatory_email?: string;
}

// Project types
export type ProjectStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'live' | 'funded' | 'archived';
export type FundingStage = 'pre_seed' | 'seed' | 'series_a';

export interface Project {
  id: string;
  developer_id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category_id: string;
  category?: Category;
  funding_stage: FundingStage;
  funding_goal: number;
  minimum_investment: number;
  maximum_investment?: number;
  valuation_cap?: number;
  discount_rate?: number;
  equity_offered?: number;
  use_of_funds?: string;
  pitch_deck_url?: string;
  demo_url?: string;
  website_url?: string;
  video_url?: string;
  logo_url?: string;
  cover_image_url?: string;
  status: ProjectStatus;
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  approved_at?: string;
  team_members?: TeamMember[];
  images?: ProjectImage[];
  developer?: User;
}

export interface TeamMember {
  id: string;
  project_id: string;
  name: string;
  role: string;
  bio?: string;
  linkedin_url?: string;
  image_url?: string;
  is_founder: boolean;
  order: number;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  project_count?: number;
}

// Payment types
export interface PaymentStatus {
  has_active_package: boolean;
  views_remaining: number;
  total_views_purchased: number;
  views_used: number;
  last_purchase_at?: string;
  expires_at?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripe_payment_intent_id?: string;
  views_purchased: number;
  created_at: string;
}

// NDA types
export interface NDAStatus {
  has_signed_master_nda: boolean;
  signed_at?: string;
  expires_at?: string;
  is_valid: boolean;
}

export interface ProjectNDAStatus {
  project_id: string;
  has_signed_master_nda: boolean;
  has_signed_project_addendum: boolean;
  requires_addendum: boolean;
  can_view_sensitive_info: boolean;
  addendum_signed_at?: string;
}

// Meeting types
export type MeetingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';

export interface MeetingRequest {
  id: string;
  investor_id: string;
  project_id: string;
  status: MeetingStatus;
  message?: string;
  proposed_times?: string[];
  scheduled_at?: string;
  meeting_link?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  investor?: User;
  project?: Project;
}

export interface Message {
  id: string;
  meeting_request_id: string;
  sender_id: string;
  content: string;
  read_at?: string;
  created_at: string;
  sender?: User;
}

// Audit types
export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  user?: User;
}

// Dashboard types
export interface DashboardStats {
  total_users: number;
  total_investors: number;
  total_developers: number;
  total_projects: number;
  live_projects: number;
  pending_projects: number;
  total_revenue: number;
  monthly_revenue: number;
}

export interface InvestorDashboard {
  views_remaining: number;
  projects_viewed: number;
  ndas_signed: number;
  meetings_requested: number;
  meetings_completed: number;
  recent_views: ProjectView[];
}

export interface ProjectView {
  id: string;
  project_id: string;
  investor_id: string;
  viewed_at: string;
  project?: Project;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  role: 'investor' | 'developer';
}

export interface AuthResponse {
  token: string;
  user: User;
}
