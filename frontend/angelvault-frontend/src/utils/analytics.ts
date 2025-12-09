// Google Analytics 4 Tracking Utility
// Replace GA_MEASUREMENT_ID with your actual GA4 measurement ID

// Type declarations for window globals
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Vite env type
const GA_MEASUREMENT_ID = (import.meta as any).env?.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

// Initialize GA4
export const initGA = () => {
  if (typeof window === 'undefined') return;

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    if (window.dataLayer) {
      window.dataLayer.push(args);
    }
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
    send_page_view: true,
  });
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_title: title,
  });
};

// Track custom events
export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', eventName, params);
};

// Track user identification
export const identifyUser = (userId: string, userProperties?: Record<string, string>) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    user_id: userId,
    ...userProperties,
  });
};

// Pre-defined events for AngelVault
export const trackEvents = {
  // Auth events
  signUp: (method: string, role: string) => {
    trackEvent('sign_up', { method, user_role: role });
  },
  login: (method: string) => {
    trackEvent('login', { method });
  },
  logout: () => {
    trackEvent('logout', {});
  },

  // Investor events
  viewProject: (projectId: string, projectName: string) => {
    trackEvent('view_project', { project_id: projectId, project_name: projectName });
  },
  unlockProject: (projectId: string, projectName: string) => {
    trackEvent('unlock_project', { project_id: projectId, project_name: projectName });
  },
  purchaseViews: (amount: number) => {
    trackEvent('purchase', { currency: 'USD', value: amount, item_name: 'View Package' });
  },
  signNDA: (type: 'master' | 'project', projectId?: string) => {
    trackEvent('sign_nda', { nda_type: type, project_id: projectId || 'none' });
  },
  requestMeeting: (projectId: string) => {
    trackEvent('request_meeting', { project_id: projectId });
  },

  // Developer events
  createProject: (projectId: string) => {
    trackEvent('create_project', { project_id: projectId });
  },
  submitProject: (projectId: string) => {
    trackEvent('submit_project', { project_id: projectId });
  },
  projectApproved: (projectId: string) => {
    trackEvent('project_approved', { project_id: projectId });
  },
  projectRejected: (projectId: string) => {
    trackEvent('project_rejected', { project_id: projectId });
  },
  respondToMeeting: (meetingId: string, response: 'accepted' | 'declined') => {
    trackEvent('respond_meeting', { meeting_id: meetingId, response });
  },

  // Admin events
  adminApproveProject: (projectId: string) => {
    trackEvent('admin_approve_project', { project_id: projectId });
  },
  adminRejectProject: (projectId: string) => {
    trackEvent('admin_reject_project', { project_id: projectId });
  },

  // Engagement events
  clickCTA: (ctaName: string, location: string) => {
    trackEvent('cta_click', { cta_name: ctaName, location });
  },
  searchProjects: (query: string, resultsCount: number) => {
    trackEvent('search', { search_term: query, results_count: resultsCount });
  },
  filterProjects: (filterType: string, filterValue: string) => {
    trackEvent('filter_projects', { filter_type: filterType, filter_value: filterValue });
  },
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  identifyUser,
  trackEvents,
};
