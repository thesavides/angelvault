// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = 'investor' | 'developer' | 'admin';
export type AuthProvider = 'email' | 'google' | 'linkedin' | 'apple';
export type InvestorType = 'individual' | 'institutional';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  role: UserRole;
  auth_provider: AuthProvider;
  oauth_id?: string;
  profile_image_url?: string;
  email_verified: boolean;
  is_active: boolean;
  status?: 'active' | 'pending' | 'suspended';
  views_remaining?: number;
  views_used?: number;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  investor_profile?: InvestorProfile;
}

export interface InvestorProfile {
  id: string;
  user_id: string;
  investor_type: InvestorType;
  bio?: string;
  linkedin_url?: string;
  website_url?: string;
  profile_image_url?: string;
  min_check_size?: number;
  max_check_size?: number;
  focus_areas: string[];
  preferred_stages: string[];
  is_profile_public: boolean;
  // Institutional fields
  company_legal_name?: string;
  company_registration?: string;
  company_jurisdiction?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_postal_code?: string;
  company_country?: string;
  tax_id?: string;
  // Signatory
  signatory_name?: string;
  signatory_title?: string;
  signatory_email?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// PROJECT TYPES
// ============================================

export type ProjectStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'live' | 'funded' | 'archived';
export type FundingStage = 'pre_seed' | 'seed' | 'series_a';
export type BusinessStage = 'idea' | 'prototype' | 'mvp' | 'revenue' | 'growth';

export interface Project {
  id: string;
  developer_id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  problem_statement?: string;
  solution?: string;
  target_market?: string;
  business_model?: string;
  competitive_advantage?: string;
  traction?: string;
  category_id: string;
  category?: Category;
  funding_stage: FundingStage;
  stage?: string;
  funding_goal: number;
  funding_raised?: number;
  target_raise?: number;
  minimum_investment: number;
  maximum_investment?: number;
  valuation_cap?: number;
  discount_rate?: number;
  equity_offered?: number;
  use_of_funds?: string;
  pitch_deck_url?: string;
  financial_model_url?: string;
  demo_url?: string;
  website_url?: string;
  video_url?: string;
  logo_url?: string;
  cover_image_url?: string;
  status: ProjectStatus;
  is_featured: boolean;
  featured?: boolean;
  view_count: number;
  rejection_reason?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  approved_at?: string;
  team_members?: TeamMember[];
  images?: ProjectImage[];
  developer?: User;
  nda_config?: ProjectNDAConfig;
  readiness?: ProjectReadiness;
  // Computed fields
  is_unlocked?: boolean;
  nda_signed?: boolean;
}

export interface TeamMember {
  id: string;
  project_id: string;
  name: string;
  role: string;
  bio?: string;
  linkedin_url?: string;
  twitter_url?: string;
  image_url?: string;
  is_founder: boolean;
  equity_percentage?: number;
  order: number;
  created_at: string;
}

export interface ProjectImage {
  id: string;
  project_id: string;
  url: string;
  alt_text?: string;
  caption?: string;
  is_primary: boolean;
  order: number;
  created_at: string;
}

export interface ProjectNDAConfig {
  id: string;
  project_id: string;
  require_addendum: boolean;
  custom_terms?: string;
  ip_clauses?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectReadiness {
  id: string;
  project_id: string;
  business_stage: BusinessStage;
  has_legal_entity: boolean;
  legal_entity_type?: string;
  legal_entity_jurisdiction?: string;
  has_bank_account: boolean;
  has_existing_investors: boolean;
  existing_investor_details?: string;
  has_ip: boolean;
  ip_details?: string;
  verified_by_admin: boolean;
  verified_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  project_count?: number;
  is_active: boolean;
  order: number;
  created_at: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface PaymentPackage {
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
  user?: User;
  amount: number;
  currency: string;
  status: PaymentStatus;
  type?: string;
  stripe_payment_intent_id?: string;
  stripe_checkout_session_id?: string;
  views_purchased: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectUnlock {
  id: string;
  investor_id: string;
  project_id: string;
  payment_id?: string;
  unlocked_at: string;
  project?: Project;
}

// ============================================
// NDA TYPES
// ============================================

export interface MasterNDA {
  id: string;
  investor_id: string;
  version: string;
  signed_at: string;
  expires_at: string;
  signature: string;
  ip_address?: string;
  user_agent?: string;
  is_valid: boolean;
}

export interface MasterNDAStatus {
  has_signed: boolean;
  has_signed_master_nda?: boolean; // Alias for API compatibility
  signed_at?: string;
  expires_at?: string;
  is_valid: boolean;
  needs_renewal: boolean;
}

export interface ProjectNDASignature {
  id: string;
  project_id: string;
  investor_id: string;
  master_nda_id: string;
  signed_at: string;
  signature: string;
  ip_address?: string;
  user_agent?: string;
  investor?: User;
}

export interface ProjectNDAStatus {
  project_id: string;
  has_signed_master_nda: boolean;
  has_signed_project_addendum: boolean;
  requires_addendum: boolean;
  can_view_sensitive_info: boolean;
  addendum_signed_at?: string;
}

// NDA type alias for admin pages
export type NDA = ProjectNDASignature;

// ============================================
// MEETING TYPES
// ============================================

export type MeetingStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled' | 'no_show';

export interface MeetingRequest {
  id: string;
  investor_id: string;
  project_id: string;
  developer_id: string;
  status: MeetingStatus;
  message?: string;
  proposed_times: string[];
  scheduled_at?: string;
  meeting_link?: string;
  meeting_type?: 'video' | 'phone' | 'in_person';
  duration_minutes?: number;
  notes?: string;
  developer_notes?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  investor?: User;
  project?: Project;
  developer?: User;
  messages?: Message[];
  unread_count?: number;
}

export interface Message {
  id: string;
  meeting_request_id: string;
  sender_id: string;
  content: string;
  attachments?: MessageAttachment[];
  read_at?: string;
  created_at: string;
  sender?: User;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  filename: string;
  url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

// ============================================
// SAFE NOTE TYPES
// ============================================

export type SAFEStatus = 'draft' | 'sent' | 'signed_investor' | 'signed_founder' | 'executed' | 'cancelled';

export interface SAFENote {
  id: string;
  project_id: string;
  investor_id: string;
  developer_id: string;
  status: SAFEStatus;
  investment_amount: number;
  valuation_cap?: number;
  discount_rate?: number;
  is_mfn: boolean;
  pro_rata_rights: boolean;
  custom_terms?: string;
  document_url?: string;
  investor_signed_at?: string;
  developer_signed_at?: string;
  executed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  commission_amount?: number;
  commission_paid: boolean;
  commission_paid_at?: string;
  created_at: string;
  updated_at: string;
  investor?: User;
  project?: Project;
  developer?: User;
}

// ============================================
// AUDIT & ANALYTICS TYPES
// ============================================

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

export interface DashboardStats {
  total_users: number;
  total_investors: number;
  total_developers: number;
  total_projects: number;
  live_projects: number;
  pending_projects: number;
  funded_projects: number;
  total_revenue: number;
  monthly_revenue: number;
  total_investments: number;
  monthly_investments: number;
  active_meetings: number;
  conversion_rate: number;
}

export interface InvestorDashboard {
  views_remaining: number;
  total_views_purchased: number;
  projects_viewed: number;
  ndas_signed: number;
  meetings_requested: number;
  meetings_completed: number;
  unread_messages: number;
  recent_views: ProjectUnlock[];
  pending_meetings: MeetingRequest[];
}

export interface DeveloperDashboard {
  projects: Project[];
  total_views: number;
  total_meetings: number;
  pending_meetings: number;
  completed_meetings: number;
  nda_signatures: number;
  recent_activity: AuditLog[];
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

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

export interface UploadResponse {
  url: string;
  filename: string;
  file_type: string;
  file_size: number;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface ProjectFilters {
  category?: string;
  stage?: FundingStage;
  min_investment?: number;
  max_investment?: number;
  status?: ProjectStatus;
  search?: string;
  developer_id?: string;
  sort_by?: 'created_at' | 'funding_goal' | 'view_count' | 'title';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
  sort_by?: 'created_at' | 'email' | 'last_login_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface ProjectFormData {
  title: string;
  tagline: string;
  description: string;
  problem_statement?: string;
  solution?: string;
  target_market?: string;
  business_model?: string;
  competitive_advantage?: string;
  traction?: string;
  category_id: string;
  funding_stage: FundingStage;
  funding_goal: number;
  minimum_investment: number;
  maximum_investment?: number;
  valuation_cap?: number;
  discount_rate?: number;
  use_of_funds?: string;
  website_url?: string;
  demo_url?: string;
  video_url?: string;
}

export interface TeamMemberFormData {
  name: string;
  role: string;
  bio?: string;
  linkedin_url?: string;
  twitter_url?: string;
  is_founder: boolean;
  equity_percentage?: number;
}

export interface InvestorProfileFormData {
  investor_type: InvestorType;
  bio?: string;
  linkedin_url?: string;
  website_url?: string;
  min_check_size?: number;
  max_check_size?: number;
  focus_areas: string[];
  preferred_stages: string[];
  is_profile_public: boolean;
  // Institutional
  company_legal_name?: string;
  company_registration?: string;
  company_jurisdiction?: string;
  company_address?: string;
  company_city?: string;
  company_state?: string;
  company_postal_code?: string;
  company_country?: string;
  tax_id?: string;
  signatory_name?: string;
  signatory_title?: string;
  signatory_email?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | 'project_approved'
  | 'project_rejected'
  | 'new_view'
  | 'meeting_request'
  | 'meeting_accepted'
  | 'meeting_declined'
  | 'new_message'
  | 'nda_signed'
  | 'payment_received'
  | 'safe_signed';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read_at?: string;
  created_at: string;
}
