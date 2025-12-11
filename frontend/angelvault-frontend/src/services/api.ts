import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  User,
  Project,
  Category,
  PaymentStatus,
  NDAStatus,
  ProjectNDAStatus,
  MeetingRequest,
  Message,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  DashboardStats,
  InvestorDashboard,
  InvestorProfile,
  AuditLog,
  PaginatedResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://angelvault-api-775051091524.europe-west4.run.app';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
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

  async updateInvestorProfile(data: Partial<InvestorProfile>): Promise<InvestorProfile> {
    const response = await this.client.put<InvestorProfile>('/api/investor/profile', data);
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

  // OAuth URLs
  getGoogleAuthUrl(): string {
    return `${API_BASE_URL}/api/auth/google`;
  }

  getLinkedInAuthUrl(): string {
    return `${API_BASE_URL}/api/auth/linkedin`;
  }

  getAppleAuthUrl(): string {
    return `${API_BASE_URL}/api/auth/apple`;
  }

  // Public endpoints
  async getPublicStats(): Promise<{ projects: number; investors: number; funded: number }> {
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

  // Projects endpoints
  async listProjects(params?: {
    category?: string;
    stage?: string;
    min_investment?: number;
    max_investment?: number;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<Project>> {
    const response = await this.client.get<PaginatedResponse<Project>>('/api/projects', { params });
    return response.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.client.get<Project>(`/api/projects/${id}`);
    return response.data;
  }

  // Developer endpoints
  async getDeveloperProjects(): Promise<Project[]> {
    const response = await this.client.get<{ projects: Project[] }>('/api/developer/projects');
    return response.data.projects;
  }

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await this.client.post<Project>('/api/developer/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await this.client.put<Project>(`/api/developer/projects/${id}`, data);
    return response.data;
  }

  async submitProject(id: string): Promise<Project> {
    const response = await this.client.post<Project>(`/api/developer/projects/${id}/submit`);
    return response.data;
  }

  async addTeamMember(projectId: string, data: Partial<Project['team_members']>): Promise<void> {
    await this.client.post(`/api/developer/projects/${projectId}/team`, data);
  }

  async updateTeamMember(projectId: string, memberId: string, data: Partial<Project['team_members']>): Promise<void> {
    await this.client.put(`/api/developer/projects/${projectId}/team/${memberId}`, data);
  }

  async deleteTeamMember(projectId: string, memberId: string): Promise<void> {
    await this.client.delete(`/api/developer/projects/${projectId}/team/${memberId}`);
  }

  // Investor endpoints
  async getInvestorDashboard(): Promise<InvestorDashboard> {
    const response = await this.client.get<InvestorDashboard>('/api/investor/dashboard');
    return response.data;
  }

  async getPaymentStatus(): Promise<PaymentStatus> {
    const response = await this.client.get<PaymentStatus>('/api/investor/payments/status');
    return response.data;
  }

  async createPaymentIntent(): Promise<{ client_secret: string }> {
    const response = await this.client.post<{ client_secret: string }>('/api/investor/payments/create-intent');
    return response.data;
  }

  async confirmPayment(paymentIntentId: string): Promise<void> {
    await this.client.post('/api/investor/payments/confirm', { payment_intent_id: paymentIntentId });
  }

  async getPaymentHistory(): Promise<{ payments: Payment[] }> {
    const response = await this.client.get('/api/investor/payments/history');
    return response.data;
  }

  async getViewedProjects(): Promise<{ projects: Project[] }> {
    const response = await this.client.get('/api/investor/payments/viewed');
    return response.data;
  }

  async unlockProject(projectId: string): Promise<void> {
    await this.client.post(`/api/investor/projects/${projectId}/unlock`);
  }

  // NDA endpoints
  async getMasterNDAStatus(): Promise<NDAStatus> {
    const response = await this.client.get<NDAStatus>('/api/investor/nda/status');
    return response.data;
  }

  async getMasterNDAContent(): Promise<{ content: string }> {
    const response = await this.client.get('/api/investor/nda/content');
    return response.data;
  }

  async signMasterNDA(signature: string, agreedToTerms: boolean): Promise<void> {
    await this.client.post('/api/investor/nda/sign', { signature, agreed_to_terms: agreedToTerms });
  }

  async getProjectNDAStatus(projectId: string): Promise<ProjectNDAStatus> {
    const response = await this.client.get<ProjectNDAStatus>(`/api/investor/nda/project/${projectId}/status`);
    return response.data;
  }

  async getProjectAddendumContent(projectId: string): Promise<{ content: string }> {
    const response = await this.client.get(`/api/investor/nda/project/${projectId}/content`);
    return response.data;
  }

  async signProjectAddendum(projectId: string, signature: string): Promise<void> {
    await this.client.post(`/api/investor/nda/project/${projectId}/sign`, { signature });
  }

  // Meeting endpoints
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

  async getDeveloperMeetings(): Promise<{ meetings: MeetingRequest[] }> {
    const response = await this.client.get('/api/developer/meetings');
    return response.data;
  }

  async getMeeting(id: string): Promise<MeetingRequest> {
    const response = await this.client.get<MeetingRequest>(`/api/investor/meetings/${id}`);
    return response.data;
  }

  async respondToMeeting(id: string, status: 'accepted' | 'declined', scheduledAt?: string, meetingLink?: string): Promise<void> {
    await this.client.post(`/api/developer/meetings/${id}/respond`, {
      status,
      scheduled_at: scheduledAt,
      meeting_link: meetingLink,
    });
  }

  async cancelMeeting(id: string): Promise<void> {
    await this.client.post(`/api/investor/meetings/${id}/cancel`);
  }

  async completeMeeting(id: string, notes?: string): Promise<void> {
    await this.client.post(`/api/developer/meetings/${id}/complete`, { notes });
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

  // Admin endpoints
  async getAdminStats(): Promise<DashboardStats> {
    const response = await this.client.get<DashboardStats>('/api/admin/stats');
    return response.data;
  }

  async getRecentActivity(): Promise<{ activity: AuditLog[] }> {
    const response = await this.client.get('/api/admin/activity');
    return response.data;
  }

  async getAuditLogs(params?: { page?: number; per_page?: number; user_id?: string; action?: string }): Promise<PaginatedResponse<AuditLog>> {
    const response = await this.client.get<PaginatedResponse<AuditLog>>('/api/admin/audit', { params });
    return response.data;
  }

  async listUsers(params?: { page?: number; per_page?: number; role?: string; search?: string }): Promise<PaginatedResponse<User>> {
    const response = await this.client.get<PaginatedResponse<User>>('/api/admin/users', { params });
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

  async listAllProjects(params?: { page?: number; per_page?: number; status?: string }): Promise<PaginatedResponse<Project>> {
    const response = await this.client.get<PaginatedResponse<Project>>('/api/admin/projects', { params });
    return response.data;
  }

  async getPendingProjects(): Promise<{ projects: Project[] }> {
    const response = await this.client.get('/api/admin/projects/pending');
    return response.data;
  }

  async approveProject(id: string): Promise<void> {
    await this.client.post(`/api/admin/projects/${id}/approve`);
  }

  async rejectProject(id: string, reason: string): Promise<void> {
    await this.client.post(`/api/admin/projects/${id}/reject`, { reason });
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/api/admin/projects/${id}`);
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
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

  // Stripe config
  async getStripeConfig(): Promise<{ publishable_key: string }> {
    const response = await this.client.get('/api/config/stripe');
    return response.data;
  }
}

// Payment type for history
interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  views_purchased: number;
  created_at: string;
}

export const api = new ApiService();
export default api;
