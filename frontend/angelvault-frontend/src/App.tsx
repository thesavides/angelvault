import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { initGA, trackPageView } from './utils/analytics';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { PasswordResetPage } from './pages/PasswordResetPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Payment Pages
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentCancelPage } from './pages/PaymentCancelPage';

// Investor Pages
import { InvestorDashboard } from './pages/InvestorDashboard';
import { InvestorNDAPage } from './pages/InvestorNDAPage';
import { InvestorPurchasePage } from './pages/InvestorPurchasePage';
import { InvestorMeetingsPage } from './pages/InvestorMeetingsPage';
import { InvestorProfilePage } from './pages/InvestorProfilePage';
import { InvestorOffersPage } from './pages/InvestorOffersPage';
import { InvestorOfferFormPage } from './pages/InvestorOfferFormPage';
import { InvestorSAFENotesPage } from './pages/InvestorSAFENotesPage';

// Developer Pages
import { DeveloperDashboard } from './pages/DeveloperDashboard';
import { DeveloperProjectsPage } from './pages/DeveloperProjectsPage';
import { DeveloperProjectFormPage } from './pages/DeveloperProjectFormPage';
import { DeveloperMeetingsPage } from './pages/DeveloperMeetingsPage';
import { DeveloperProfilePage } from './pages/DeveloperProfilePage';
import { DeveloperOffersPage } from './pages/DeveloperOffersPage';
import { DeveloperSAFENotesPage } from './pages/DeveloperSAFENotesPage';
import { DeveloperAnalyticsPage } from './pages/DeveloperAnalyticsPage';

// Shared Pages (Investor & Developer)
import { MeetingDetailPage } from './pages/MeetingDetailPage';
import { MeetingRequestPage } from './pages/MeetingRequestPage';
import { SAFENoteDetailPage } from './pages/SAFENoteDetailPage';
import { SettingsPage } from './pages/SettingsPage';

// Admin Pages
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminUserDetailPage } from './pages/AdminUserDetailPage';
import { AdminProjectsPage } from './pages/AdminProjectsPage';
import { AdminProjectDetailPage } from './pages/AdminProjectDetailPage';
import { AdminPaymentsPage } from './pages/AdminPaymentsPage';
import { AdminAuditPage } from './pages/AdminAuditPage';
import { AdminCategoriesPage } from './pages/AdminCategoriesPage';
import { AdminSAFENotesPage } from './pages/AdminSAFENotesPage';
import { AdminOffersPage } from './pages/AdminOffersPage';
import { AdminCommissionsPage } from './pages/AdminCommissionsPage';

// Initialize Google Analytics
initGA();

// Analytics tracker component
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  return null;
}

// Layout with Header and Footer
function MainLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

// Dashboard layout with Header only (no Footer)
function DashboardLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

// Auth layout without Header/Footer
function AuthLayout() {
  return <Outlet />;
}

// Minimal layout for payment pages
function MinimalLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnalyticsTracker />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1A2332',
              color: '#fff',
              borderRadius: '12px',
            },
            success: {
              iconTheme: {
                primary: '#40E0D0',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          {/* Auth routes without header/footer */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
          </Route>

          {/* Public routes with header/footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Route>

          {/* Payment result routes */}
          <Route element={<MinimalLayout />}>
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/cancel" element={<PaymentCancelPage />} />
          </Route>

          {/* Investor routes */}
          <Route element={<DashboardLayout />}>
            <Route
              path="/investor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <InvestorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/nda"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <InvestorNDAPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/purchase"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <InvestorPurchasePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/meetings"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <InvestorMeetingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/meetings/:id"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <MeetingDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/profile"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <InvestorProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/offers"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <InvestorOffersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/offers/new"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <InvestorOfferFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/offers/:id"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <SAFENoteDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/offers/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <InvestorOfferFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/safe-notes"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <InvestorSAFENotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/safe-notes/:id"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <SAFENoteDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investor/settings"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/request-meeting"
              element={
                <ProtectedRoute allowedRoles={['investor']}>
                  <MeetingRequestPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Developer routes */}
          <Route element={<DashboardLayout />}>
            <Route
              path="/developer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <DeveloperDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/projects"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <DeveloperProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/projects/new"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <DeveloperProjectFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/projects/:id/edit"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <DeveloperProjectFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/meetings"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <DeveloperMeetingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/meetings/:id"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <MeetingDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/profile"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <DeveloperProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/offers"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <DeveloperOffersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/offers/:id"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <SAFENoteDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/safe-notes"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <DeveloperSAFENotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/safe-notes/:id"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <SAFENoteDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/analytics"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <DeveloperAnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/developer/settings"
              element={
                <ProtectedRoute allowedRoles={['developer']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin routes */}
          <Route element={<DashboardLayout />}>
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUserDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projects"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/projects/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProjectDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminAuditPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCategoriesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/offers"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminOffersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/safe-notes"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSAFENotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/safe-notes/:id"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SAFENoteDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/commissions"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminCommissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* 404 - Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
