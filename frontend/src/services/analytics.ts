// Analytics and tracking service
// Handles Google Analytics 4, Google Tag Manager, and custom events

type EventCategory = 'auth' | 'project' | 'payment' | 'nda' | 'meeting' | 'navigation' | 'engagement';

interface TrackingEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, unknown>;
}

interface PageViewData {
  page_title: string;
  page_location: string;
  page_path: string;
}

interface UserProperties {
  user_id?: string;
  user_role?: string;
  user_type?: string;
  account_created_at?: string;
}

// Window type extension (shared with utils/analytics.ts)
// Note: Window interface is extended in utils/analytics.ts

class AnalyticsService {
  private initialized = false;
  private userId?: string;
  private userRole?: string;

  init() {
    if (this.initialized) return;
    
    // Check if gtag is available
    if (typeof window !== 'undefined' && window.gtag) {
      this.initialized = true;
    }
  }

  setUser(userId: string, role: string) {
    this.userId = userId;
    this.userRole = role;

    if (window.gtag) {
      window.gtag('set', 'user_properties', {
        user_id: userId,
        user_role: role,
      });
    }
  }

  clearUser() {
    this.userId = undefined;
    this.userRole = undefined;
  }

  // Track page views
  trackPageView(data: PageViewData) {
    if (!window.gtag) return;

    window.gtag('event', 'page_view', {
      page_title: data.page_title,
      page_location: data.page_location,
      page_path: data.page_path,
      user_id: this.userId,
      user_role: this.userRole,
    });
  }

  // Track custom events
  trackEvent(event: TrackingEvent) {
    if (!window.gtag) return;

    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      user_id: this.userId,
      user_role: this.userRole,
      ...event.custom_parameters,
    });
  }

  // Pre-defined event methods
  
  // Auth events
  trackLogin(method: 'email' | 'google' | 'linkedin' | 'apple') {
    this.trackEvent({
      category: 'auth',
      action: 'login',
      label: method,
    });
  }

  trackSignup(method: 'email' | 'google' | 'linkedin' | 'apple', role: 'investor' | 'developer') {
    this.trackEvent({
      category: 'auth',
      action: 'sign_up',
      label: method,
      custom_parameters: { user_role: role },
    });
  }

  trackLogout() {
    this.trackEvent({
      category: 'auth',
      action: 'logout',
    });
  }

  // Project events
  trackProjectView(projectId: string, projectTitle: string, isUnlocked: boolean) {
    this.trackEvent({
      category: 'project',
      action: 'view_project',
      label: projectTitle,
      custom_parameters: {
        project_id: projectId,
        is_unlocked: isUnlocked,
      },
    });
  }

  trackProjectUnlock(projectId: string, projectTitle: string) {
    this.trackEvent({
      category: 'project',
      action: 'unlock_project',
      label: projectTitle,
      custom_parameters: { project_id: projectId },
    });
  }

  trackProjectCreate(projectId: string, projectTitle: string) {
    this.trackEvent({
      category: 'project',
      action: 'create_project',
      label: projectTitle,
      custom_parameters: { project_id: projectId },
    });
  }

  trackProjectSubmit(projectId: string, projectTitle: string) {
    this.trackEvent({
      category: 'project',
      action: 'submit_project',
      label: projectTitle,
      custom_parameters: { project_id: projectId },
    });
  }

  trackProjectSearch(query: string, filters: Record<string, unknown>, resultsCount: number) {
    this.trackEvent({
      category: 'project',
      action: 'search',
      label: query,
      value: resultsCount,
      custom_parameters: { filters },
    });
  }

  // Payment events
  trackPaymentInitiate(amount: number) {
    this.trackEvent({
      category: 'payment',
      action: 'initiate_payment',
      value: amount,
    });

    // Also track as conversion event
    if (window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: amount,
        items: [{
          item_id: 'view_package',
          item_name: '4 Project Views',
          price: amount,
          quantity: 1,
        }],
      });
    }
  }

  trackPaymentSuccess(amount: number, transactionId: string) {
    this.trackEvent({
      category: 'payment',
      action: 'payment_success',
      value: amount,
      custom_parameters: { transaction_id: transactionId },
    });

    // Track as conversion
    if (window.gtag) {
      window.gtag('event', 'purchase', {
        currency: 'USD',
        value: amount,
        transaction_id: transactionId,
        items: [{
          item_id: 'view_package',
          item_name: '4 Project Views',
          price: amount,
          quantity: 1,
        }],
      });
    }
  }

  trackPaymentFailure(amount: number, error: string) {
    this.trackEvent({
      category: 'payment',
      action: 'payment_failure',
      label: error,
      value: amount,
    });
  }

  // NDA events
  trackNDAView(type: 'master' | 'project', projectId?: string) {
    this.trackEvent({
      category: 'nda',
      action: 'view_nda',
      label: type,
      custom_parameters: { project_id: projectId },
    });
  }

  trackNDASign(type: 'master' | 'project', projectId?: string) {
    this.trackEvent({
      category: 'nda',
      action: 'sign_nda',
      label: type,
      custom_parameters: { project_id: projectId },
    });
  }

  // Meeting events
  trackMeetingRequest(projectId: string, projectTitle: string) {
    this.trackEvent({
      category: 'meeting',
      action: 'request_meeting',
      label: projectTitle,
      custom_parameters: { project_id: projectId },
    });
  }

  trackMeetingResponse(meetingId: string, response: 'accepted' | 'declined') {
    this.trackEvent({
      category: 'meeting',
      action: `meeting_${response}`,
      custom_parameters: { meeting_id: meetingId },
    });
  }

  trackMeetingComplete(meetingId: string) {
    this.trackEvent({
      category: 'meeting',
      action: 'meeting_complete',
      custom_parameters: { meeting_id: meetingId },
    });
  }

  // Engagement events
  trackCTAClick(ctaName: string, location: string) {
    this.trackEvent({
      category: 'engagement',
      action: 'cta_click',
      label: ctaName,
      custom_parameters: { location },
    });
  }

  trackFeatureUsage(feature: string) {
    this.trackEvent({
      category: 'engagement',
      action: 'feature_used',
      label: feature,
    });
  }

  trackError(errorType: string, errorMessage: string, context?: string) {
    this.trackEvent({
      category: 'engagement',
      action: 'error',
      label: errorType,
      custom_parameters: {
        error_message: errorMessage,
        context,
      },
    });
  }

  // Time on page / scroll depth
  trackScrollDepth(depth: 25 | 50 | 75 | 100, pagePath: string) {
    this.trackEvent({
      category: 'engagement',
      action: 'scroll_depth',
      label: pagePath,
      value: depth,
    });
  }

  trackTimeOnPage(seconds: number, pagePath: string) {
    this.trackEvent({
      category: 'engagement',
      action: 'time_on_page',
      label: pagePath,
      value: seconds,
    });
  }
}

export const analytics = new AnalyticsService();
export default analytics;
