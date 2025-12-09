import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  Project,
  Category,
  PaymentPackage,
  Payment,
  MasterNDAStatus,
  ProjectNDAStatus,
  MeetingRequest,
  Message,
  SAFENote,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  DashboardStats,
  InvestorDashboard,
  DeveloperDashboard,
  InvestorProfile,
  AuditLog,
  PaginatedResponse,
  ProjectFilters,
  UserFilters,
  ProjectFormData,
  TeamMember,
  TeamMemberFormData,
  ProjectImage,
  ProjectUnlock,
  ProjectReadiness,
  UploadResponse,
  Notification,
} from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://angelvault-api-775051091524.europe-west4.run.app';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================
  // AUTH ENDPOINTS
  // ============================================

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/api/auth/me');
    return response.data;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.client.put<User>('/api/auth/profile', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.put('/api/auth/password', { current_password: currentPassword, new_password: newPassword });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.client.post('/api/auth/password/reset-request', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.client.post('/api/auth/password/reset', { token, new_password: newPassword });
  }

  async verifyEmail(token: string): Promise<void> {
    await this.client.get(`/api/auth/verify-email?token=${token}`);
  }

  getGoogleAuthUrl(): string {
    return `${API_BASE_URL}/api/auth/google`;
  }

  getLinkedInAuthUrl(): string {
    return `${API_BASE_URL}/api/auth/linkedin`;
  }

  getAppleAuthUrl(): string {
    return `${API_BASE_URL}/api/auth/apple`;
  }

  // ============================================
  // PUBLIC ENDPOINTS
  // ============================================

  async getPublicStats(): Promise<{ projects: number; investors: number; funded: number; capital_deployed: number }> {
    const response = await this.client.get('/api/public/stats');
    return response.data;
  }

  async getCategories(): Promise<Category[]> {
    const response = await this.client.get<{ categories: Category[] }>('/api/public/categories');
    return response.data.categories;
  }

  async getCategory(slug: string): Promise<Category> {
    const response = await this.client.get<Category>(`/api/public/categories/${slug}`);
    return response.data;
  }

  // ============================================
  // PROJECTS ENDPOINTS
  // ============================================

  async listProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const response = await this.client.get<PaginatedResponse<Project>>('/api/projects', { params: filters });
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.client.get<Project>(`/api/projects/${id}`);
    return response.data;
  }

  async getProjectBySlug(slug: string): Promise<Project> {
    const response = await this.client.get<Project>(`/api/projects/slug/${slug}`);
    return response.data;
  }

  // ============================================
  // DEVELOPER ENDPOINTS
  // ============================================

  async getDeveloperDashboard(): Promise<DeveloperDashboard> {
    const response = await this.client.get<DeveloperDashboard>('/api/developer/dashboard');
    return response.data;
  }

  async getDeveloperProjects(): Promise<Project[]> {
    const response = await this.client.get<{ projects: Project[] }>('/api/developer/projects');
    return response.data.projects;
  }

  async createProject(data: ProjectFormData): Promise<Project> {
    const response = await this.client.post<Project>('/api/developer/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<ProjectFormData>): Promise<Project> {
    const response = await this.client.put<Project>(`/api/developer/projects/${id}`, data);
    return response.data;
  }

  async submitProject(id: string): Promise<Project> {
    const response = await this.client.post<Project>(`/api/developer/projects/${id}/submit`);
    return response.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/api/developer/projects/${id}`);
  }

  // Team Members
  async addTeamMember(projectId: string, data: TeamMemberFormData): Promise<TeamMember> {
    const response = await this.client.post<TeamMember>(`/api/developer/projects/${projectId}/team`, data);
    return response.data;
  }

  async updateTeamMember(projectId: string, memberId: string, data: Partial<TeamMemberFormData>): Promise<TeamMember> {
    const response = await this.client.put<TeamMember>(`/api/developer/projects/${projectId}/team/${memberId}`, data);
    return response.data;
  }

  async deleteTeamMember(projectId: string, memberId: string): Promise<void> {
    await this.client.delete(`/api/developer/projects/${projectId}/team/${memberId}`);
  }

  async reorderTeamMembers(projectId: string, memberIds: string[]): Promise<void> {
    await this.client.put(`/api/developer/projects/${projectId}/team/reorder`, { member_ids: memberIds });
  }

  // Project Images
  async addProjectImage(projectId: string, file: File, isPrimary: boolean = false): Promise<ProjectImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_primary', String(isPrimary));
    const response = await this.client.post<ProjectImage>(`/api/developer/projects/${projectId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async deleteProjectImage(projectId: string, imageId: string): Promise<void> {
    await this.client.delete(`/api/developer/projects/${projectId}/images/${imageId}`);
  }

  async setProjectPrimaryImage(projectId: string, imageId: string): Promise<void> {
    await this.client.put(`/api/developer/projects/${projectId}/images/${imageId}/primary`);
  }

  // Project Readiness
  async getProjectReadiness(projectId: string): Promise<ProjectReadiness> {
    const response = await this.client.get<ProjectReadiness>(`/api/developer/projects/${projectId}/readiness`);
    return response.data;
  }

  async updateProjectReadiness(projectId: string, data: Partial<ProjectReadiness>): Promise<ProjectReadiness> {
    const response = await this.client.put<ProjectReadiness>(`/api/developer/projects/${projectId}/readiness`, data);
    return response.data;
  }

  // Developer NDA Config
  async updateProjectNDAConfig(projectId: string, data: { custom_terms?: string; ip_clauses?: string; require_addendum: boolean }): Promise<void> {
    await this.client.put(`/api/developer/projects/${projectId}/nda-config`, data);
  }

  async getProjectNDASignatures(projectId: string): Promise<{ signatures: Array<{ investor: User; signed_at: string }> }> {
    const response = await this.client.get(`/api/developer/projects/${projectId}/nda-signatures`);
    return response.data;
  }

  // Developer Meetings
  async getDeveloperMeetings(): Promise<{ meetings: MeetingRequest[] }> {
    const response = await this.client.get('/api/developer/meetings');
    return response.data;
  }

  async respondToMeeting(id: string, status: 'accepted' | 'declined', scheduledAt?: string, meetingLink?: string): Promise<void> {
    await this.client.post(`/api/developer/meetings/${id}/respond`, { status, scheduled_at: scheduledAt, meeting_link: meetingLink });
  }

  async completeMeeting(id: string, notes?: string): Promise<void> {
    await this.client.post(`/api/developer/meetings/${id}/complete`, { notes });
  }

  // ============================================
  // INVESTOR ENDPOINTS
  // ============================================

  async getInvestorDashboard(): Promise<InvestorDashboard> {
    const response = await this.client.get<InvestorDashboard>('/api/investor/dashboard');
    return response.data;
  }

  async updateInvestorProfile(data: Partial<InvestorProfile>): Promise<InvestorProfile> {
    const response = await this.client.put<InvestorProfile>('/api/investor/profile', data);
    return response.data;
  }

  // Payments
  async getPaymentStatus(): Promise<PaymentPackage> {
    const response = await this.client.get<PaymentPackage>('/api/investor/payments/status');
    return response.data;
  }

  async createPaymentIntent(): Promise<{ client_secret: string; payment_intent_id: string }> {
    const response = await this.client.post('/api/investor/payments/create-intent');
    return response.data;
  }

  async createCheckoutSession(): Promise<{ checkout_url: string; session_id: string }> {
    const response = await this.client.post('/api/investor/payments/create-checkout');
    return response.data;
  }

  async confirmPayment(paymentIntentId: string): Promise<void> {
    await this.client.post('/api/investor/payments/confirm', { payment_intent_id: paymentIntentId });
  }

  async getPaymentHistory(): Promise<{ payments: Payment[] }> {
    const response = await this.client.get('/api/investor/payments/history');
    return response.data;
  }

  async getViewedProjects(): Promise<{ unlocks: ProjectUnlock[] }> {
    const response = await this.client.get('/api/investor/payments/viewed');
    return response.data;
  }

  async unlockProject(projectId: string): Promise<{ success: boolean; views_remaining: number }> {
    const response = await this.client.post(`/api/investor/projects/${projectId}/unlock`);
    return response.data;
  }

  // NDA
  async getMasterNDAStatus(): Promise<MasterNDAStatus> {
    const response = await this.client.get<MasterNDAStatus>('/api/investor/nda/status');
    return response.data;
  }

  async getMasterNDAContent(): Promise<{ content: string; version: string }> {
    const response = await this.client.get('/api/investor/nda/content');
    return response.data;
  }

  async signMasterNDA(signature: string, agreedToTerms: boolean): Promise<{ signed_at: string; expires_at: string }> {
    const response = await this.client.post('/api/investor/nda/sign', { signature, agreed_to_terms: agreedToTerms });
    return response.data;
  }

  async getInvestorNDAs(): Promise<{ ndas: Array<{ project: Project; signed_at: string }> }> {
    const response = await this.client.get('/api/investor/nda/list');
    return response.data;
  }

  async getProjectNDAStatus(projectId: string): Promise<ProjectNDAStatus> {
    const response = await this.client.get<ProjectNDAStatus>(`/api/investor/nda/project/${projectId}/status`);
    return response.data;
  }

  async getProjectAddendumContent(projectId: string): Promise<{ content: string; project_terms?: string }> {
    const response = await this.client.get(`/api/investor/nda/project/${projectId}/content`);
    return response.data;
  }

  async signProjectAddendum(projectId: string, signature: string): Promise<{ signed_at: string }> {
    const response = await this.client.post(`/api/investor/nda/project/${projectId}/sign`, { signature });
    return response.data;
  }

  // Investor Meetings
  async createMeetingRequest(projectId: string, message: string, proposedTimes?: string[]): Promise<MeetingRequest> {
    const response = await this.client.post<MeetingRequest>('/api/investor/meetings', {
      project_id: projectId,
      message,
      proposed_times: proposedTimes,
    });
    return response.data;
  }

  async getInvestorMeetings(): Promise<{ meetings: MeetingRequest[] }> {
    const response = await this.client.get('/api/investor/meetings');
    return response.data;
  }

  async getMeeting(id: string): Promise<MeetingRequest> {
    const response = await this.client.get<MeetingRequest>(`/api/investor/meetings/${id}`);
    return response.data;
  }

  async cancelMeeting(id: string, reason?: string): Promise<void> {
    await this.client.post(`/api/investor/meetings/${id}/cancel`, { reason });
  }

  async getMeetingMessages(meetingId: string): Promise<{ messages: Message[] }> {
    const response = await this.client.get(`/api/investor/meetings/${meetingId}/messages`);
    return response.data;
  }

  async sendMeetingMessage(meetingId: string, content: string): Promise<Message> {
    const response = await this.client.post<Message>(`/api/investor/meetings/${meetingId}/messages`, { content });
    return response.data;
  }

  async getUnreadMessageCount(): Promise<{ count: number }> {
    const response = await this.client.get('/api/investor/messages/unread');
    return response.data;
  }

  async markMessagesAsRead(meetingId: string): Promise<void> {
    await this.client.post(`/api/investor/meetings/${meetingId}/messages/read`);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  async getAdminStats(): Promise<DashboardStats> {
    const response = await this.client.get<DashboardStats>('/api/admin/stats');
    return response.data;
  }

  async getRecentActivity(limit?: number): Promise<{ activity: AuditLog[] }> {
    const response = await this.client.get('/api/admin/activity', { params: { limit } });
    return response.data;
  }

  async getAuditLogs(params?: { page?: number; per_page?: number; user_id?: string; action?: string; entity_type?: string }): Promise<PaginatedResponse<AuditLog>> {
    const response = await this.client.get<PaginatedResponse<AuditLog>>('/api/admin/audit', { params });
    return response.data;
  }

  async getUserActivityHistory(userId: string): Promise<{ activity: AuditLog[] }> {
    const response = await this.client.get(`/api/admin/audit/user/${userId}`);
    return response.data;
  }

  async getInvestorAccessHistory(investorId: string): Promise<{ accesses: Array<{ project: Project; viewed_at: string }> }> {
    const response = await this.client.get(`/api/admin/audit/investor/${investorId}`);
    return response.data;
  }

  async getProjectViewHistory(projectId: string): Promise<{ views: Array<{ investor: User; viewed_at: string }> }> {
    const response = await this.client.get(`/api/admin/audit/project/${projectId}/views`);
    return response.data;
  }

  // Admin - Users
  async listUsers(filters?: UserFilters): Promise<PaginatedResponse<User>> {
    const response = await this.client.get<PaginatedResponse<User>>('/api/admin/users', { params: filters });
    return response.data;
  }

  async getUser(id: string): Promise<User> {
    const response = await this.client.get<User>(`/api/admin/users/${id}`);
    return response.data;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(`/api/admin/users/${id}`, data);
    return response.data;
  }

  async createDeveloper(data: { email: string; first_name: string; last_name: string; company_name?: string }): Promise<User> {
    const response = await this.client.post<User>('/api/admin/users/developer', data);
    return response.data;
  }

  async deactivateUser(id: string): Promise<void> {
    await this.client.post(`/api/admin/users/${id}/deactivate`);
  }

  async activateUser(id: string): Promise<void> {
    await this.client.post(`/api/admin/users/${id}/activate`);
  }

  // Admin - Admins
  async listAdmins(): Promise<{ admins: User[] }> {
    const response = await this.client.get('/api/admin/admins');
    return response.data;
  }

  async createAdmin(data: { email: string; first_name: string; last_name: string; password: string }): Promise<User> {
    const response = await this.client.post<User>('/api/admin/admins', data);
    return response.data;
  }

  async updateAdmin(id: string, data: Partial<User>): Promise<User> {
    const response = await this.client.put<User>(`/api/admin/admins/${id}`, data);
    return response.data;
  }

  async deleteAdmin(id: string): Promise<void> {
    await this.client.delete(`/api/admin/admins/${id}`);
  }

  async resetAdminPassword(id: string): Promise<{ temporary_password: string }> {
    const response = await this.client.post(`/api/admin/admins/${id}/reset-password`);
    return response.data;
  }

  // Admin - Projects
  async listAllProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const response = await this.client.get<PaginatedResponse<Project>>('/api/admin/projects', { params: filters });
    return response.data;
  }

  async getPendingProjects(): Promise<{ projects: Project[] }> {
    const response = await this.client.get('/api/admin/projects/pending');
    return response.data;
  }

  async adminCreateProject(data: ProjectFormData & { developer_id: string }): Promise<Project> {
    const response = await this.client.post<Project>('/api/admin/projects', data);
    return response.data;
  }

  async adminUpdateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await this.client.put<Project>(`/api/admin/projects/${id}`, data);
    return response.data;
  }

  async approveProject(id: string, notes?: string): Promise<Project> {
    const response = await this.client.post<Project>(`/api/admin/projects/${id}/approve`, { notes });
    return response.data;
  }

  async rejectProject(id: string, reason: string): Promise<Project> {
    const response = await this.client.post<Project>(`/api/admin/projects/${id}/reject`, { reason });
    return response.data;
  }

  async adminDeleteProject(id: string): Promise<void> {
    await this.client.delete(`/api/admin/projects/${id}`);
  }

  async featureProject(id: string, featured: boolean): Promise<void> {
    await this.client.post(`/api/admin/projects/${id}/feature`, { featured });
  }

  // Admin - Project Images
  async adminAddProjectImage(projectId: string, file: File, isPrimary: boolean = false): Promise<ProjectImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('is_primary', String(isPrimary));
    const response = await this.client.post<ProjectImage>(`/api/admin/projects/${projectId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async adminDeleteProjectImage(projectId: string, imageId: string): Promise<void> {
    await this.client.delete(`/api/admin/projects/${projectId}/images/${imageId}`);
  }

  // Admin - Categories
  async adminListCategories(): Promise<{ categories: Category[] }> {
    const response = await this.client.get('/api/admin/categories');
    return response.data;
  }

  async createCategory(data: { name: string; description?: string; icon?: string; color?: string }): Promise<Category> {
    const response = await this.client.post<Category>('/api/admin/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await this.client.put<Category>(`/api/admin/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.client.delete(`/api/admin/categories/${id}`);
  }

  // Admin - Project Readiness
  async verifyProjectReadiness(projectId: string, notes?: string): Promise<void> {
    await this.client.post(`/api/admin/projects/${projectId}/readiness/verify`, { notes });
  }

  // Admin - Get single project
  async adminGetProject(id: string): Promise<Project> {
    const response = await this.client.get<Project>(`/api/admin/projects/${id}`);
    return response.data;
  }

  // Admin - Get single user
  async adminGetUser(id: string): Promise<User> {
    const response = await this.client.get<User>(`/api/admin/users/${id}`);
    return response.data;
  }

  // Admin - Get user activity
  async adminGetUserActivity(userId: string): Promise<{ activity: AuditLog[] }> {
    const response = await this.client.get(`/api/admin/users/${userId}/activity`);
    return response.data;
  }

  // Admin - Get project activity
  async adminGetProjectActivity(projectId: string): Promise<{ activity: AuditLog[] }> {
    const response = await this.client.get(`/api/admin/projects/${projectId}/activity`);
    return response.data;
  }

  // Admin - SAFE Notes
  async adminListSAFENotes(params?: { page?: number; limit?: number; status?: string; project_id?: string }): Promise<{ safe_notes: SAFENote[]; total_pages: number }> {
    const response = await this.client.get('/api/admin/safe-notes', { params });
    return response.data;
  }

  // Admin - NDAs
  async adminListNDAs(params?: { project_id?: string }): Promise<{ ndas: any[] }> {
    const response = await this.client.get('/api/admin/ndas', { params });
    return response.data;
  }

  // Admin - Payments
  async getAdminPayments(params?: { page?: number; limit?: number; status?: string }): Promise<{ payments: Payment[]; total_pages: number }> {
    const response = await this.client.get('/api/admin/payments', { params });
    return response.data;
  }

  // Admin - Commissions
  async adminListCommissions(params?: { page?: number; limit?: number; status?: string }): Promise<{ commissions: any[]; total_pages: number }> {
    const response = await this.client.get('/api/admin/commissions', { params });
    return response.data;
  }

  async adminMarkCommissionPaid(commissionId: string): Promise<void> {
    await this.client.post(`/api/admin/commissions/${commissionId}/paid`);
  }

  // ============================================
  // STRIPE CONFIG
  // ============================================

  async getStripeConfig(): Promise<{ publishable_key: string; package_price: number; views_per_package: number }> {
    const response = await this.client.get('/api/config/stripe');
    return response.data;
  }

  // ============================================
  // FILE UPLOAD
  // ============================================

  async uploadFile(file: File, type: 'pitch_deck' | 'financial_model' | 'logo' | 'cover' | 'image' | 'document'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await this.client.post<UploadResponse>('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================

  async getNotifications(unreadOnly?: boolean): Promise<{ notifications: Notification[] }> {
    const response = await this.client.get('/api/notifications', { params: { unread_only: unreadOnly } });
    return response.data;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.client.post(`/api/notifications/${id}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.client.post('/api/notifications/read-all');
  }

  // ============================================
  // SAFE NOTE ENDPOINTS
  // ============================================

  async getInvestorSAFENotes(params?: { status?: string; page?: number; limit?: number }): Promise<{ safe_notes: SAFENote[]; total_pages: number }> {
    const response = await this.client.get('/api/investor/safe-notes', { params });
    return response.data;
  }

  async getDeveloperSAFENotes(params?: { status?: string; page?: number; limit?: number }): Promise<{ safe_notes: SAFENote[]; total_pages: number }> {
    const response = await this.client.get('/api/developer/safe-notes', { params });
    return response.data;
  }

  async getSAFENote(id: string): Promise<SAFENote> {
    const response = await this.client.get<SAFENote>(`/api/safe-notes/${id}`);
    return response.data;
  }

  async createSAFENote(data: {
    project_id: string;
    investment_amount: number;
    valuation_cap?: number;
    discount_rate?: number;
    is_mfn?: boolean;
    pro_rata_rights?: boolean;
    custom_terms?: string;
  }): Promise<SAFENote> {
    const response = await this.client.post<SAFENote>('/api/investor/safe-notes', data);
    return response.data;
  }

  async updateSAFENote(id: string, data: Partial<SAFENote>): Promise<SAFENote> {
    const response = await this.client.put<SAFENote>(`/api/investor/safe-notes/${id}`, data);
    return response.data;
  }

  async sendSAFENote(id: string): Promise<SAFENote> {
    const response = await this.client.post<SAFENote>(`/api/investor/safe-notes/${id}/send`);
    return response.data;
  }

  async signSAFENote(id: string, signature: string): Promise<SAFENote> {
    const response = await this.client.post<SAFENote>(`/api/safe-notes/${id}/sign`, { signature });
    return response.data;
  }

  async cancelSAFENote(id: string, reason?: string): Promise<void> {
    await this.client.post(`/api/safe-notes/${id}/cancel`, { reason });
  }

  // ============================================
  // ADDITIONAL MEETING METHODS
  // ============================================

  async getInvestorMeeting(id: string): Promise<MeetingRequest> {
    const response = await this.client.get<MeetingRequest>(`/api/investor/meetings/${id}`);
    return response.data;
  }

  async getDeveloperMeeting(id: string): Promise<MeetingRequest> {
    const response = await this.client.get<MeetingRequest>(`/api/developer/meetings/${id}`);
    return response.data;
  }

  async acceptMeetingRequest(id: string, scheduledAt: string, meetingLink?: string): Promise<void> {
    await this.client.post(`/api/developer/meetings/${id}/respond`, {
      status: 'accepted',
      scheduled_at: scheduledAt,
      meeting_link: meetingLink
    });
  }

  async declineMeetingRequest(id: string, reason?: string): Promise<void> {
    await this.client.post(`/api/developer/meetings/${id}/respond`, {
      status: 'declined',
      reason
    });
  }

  async requestMeeting(projectId: string, data: {
    message: string;
    meeting_type?: string;
    duration_minutes?: number;
    proposed_times: string[];
  }): Promise<MeetingRequest> {
    const response = await this.client.post<MeetingRequest>('/api/investor/meetings', {
      project_id: projectId,
      ...data
    });
    return response.data;
  }

  // ============================================
  // ADDITIONAL INVESTOR METHODS
  // ============================================

  async getInvestorProfile(): Promise<InvestorProfile> {
    const response = await this.client.get<InvestorProfile>('/api/investor/profile');
    return response.data;
  }

  async getPaymentPackageStatus(): Promise<PaymentPackage> {
    return this.getPaymentStatus();
  }

  // ============================================
  // ADDITIONAL ADMIN METHODS
  // ============================================

  async adminListProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    return this.listAllProjects(filters);
  }

  async adminUpdateUser(id: string, data: Partial<User>): Promise<User> {
    return this.updateUser(id, data);
  }

  // ============================================
  // PROJECT ACCESS CHECK
  // ============================================

  async checkProjectAccess(projectId: string): Promise<{ has_access: boolean; needs_nda: boolean; needs_payment: boolean }> {
    const response = await this.client.get(`/api/projects/${projectId}/access`);
    return response.data;
  }

  // ============================================
  // COMMISSION STATS (Admin)
  // ============================================

  async adminGetCommissionStats(): Promise<{
    total_earned: number;
    pending_collection: number;
    collected_this_month: number;
    average_rate: number;
  }> {
    const response = await this.client.get('/api/admin/commissions/stats');
    return response.data;
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  async healthCheck(): Promise<{ status: string; database: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // ============================================
  // SETTINGS
  // ============================================

  async updateNotificationSettings(settings: {
    email_notifications: boolean;
    project_updates: boolean;
    meeting_reminders: boolean;
    marketing_emails: boolean;
  }): Promise<void> {
    await this.client.put('/api/auth/settings/notifications', settings);
  }

  async updatePrivacySettings(settings: {
    profile_visibility: 'public' | 'private' | 'investors_only';
    show_investment_activity: boolean;
  }): Promise<void> {
    await this.client.put('/api/auth/settings/privacy', settings);
  }
}

export const api = new ApiService();
export default api;
