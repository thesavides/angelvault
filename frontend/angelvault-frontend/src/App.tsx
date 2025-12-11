import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

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

// Auth layout without Header/Footer
function AuthLayout() {
  return <Outlet />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
          </Route>

          {/* Main routes with header/footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<LandingPage />} />
            {/* TODO: Add more routes */}
            {/* <Route path="/projects" element={<ProjectsPage />} /> */}
            {/* <Route path="/projects/:id" element={<ProjectDetailPage />} /> */}
            {/* <Route path="/investor/dashboard" element={<InvestorDashboard />} /> */}
            {/* <Route path="/developer/dashboard" element={<DeveloperDashboard />} /> */}
            {/* <Route path="/admin/*" element={<AdminRoutes />} /> */}
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
