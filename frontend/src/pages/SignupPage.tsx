import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Building, AlertCircle, Rocket, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { trackEvent, trackEvents } from '../utils/analytics';
import api from '../services/api';

type UserType = 'developer' | 'investor';

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuth();
  
  const [userType, setUserType] = useState<UserType>(
    (searchParams.get('type') as UserType) || 'developer'
  );
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    trackEvent('page_view', { page: 'signup', page_title: 'AngelVault - Sign Up', user_type: userType });
  }, [userType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the Terms of Service');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_name: formData.company,
        role: userType,
      });
      
      trackEvent('signup_success', { method: 'email', role: userType });
      setAuth(response.user, response.token);
      
      const dashboardPath = userType === 'investor' ? '/investor/dashboard' : '/developer/dashboard';
      navigate(dashboardPath);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      trackEvent('signup_error', { error: err.response?.data?.error || 'unknown' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignup = (provider: 'google' | 'linkedin') => {
    trackEvent('oauth_click', { provider, user_type: userType });
    const url = provider === 'google' 
      ? api.getGoogleAuthUrl() 
      : api.getLinkedInAuthUrl();
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-400 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="font-display font-bold text-xl text-navy-900">AngelVault</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-navy-900 mb-2">Create your account</h1>
          <p className="text-gray-600 mb-6">Join the curated marketplace for pre-seed investments</p>

          {/* User Type Toggle */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setUserType('developer')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                userType === 'developer'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Rocket className="w-5 h-5" />
              I'm a Founder
            </button>
            <button
              type="button"
              onClick={() => setUserType('investor')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                userType === 'investor'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              I'm an Investor
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthSignup('google')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">Continue with Google</span>
            </button>
            <button
              onClick={() => handleOAuthSignup('linkedin')}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="#0A66C2" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="font-medium text-gray-700">Continue with LinkedIn</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                leftIcon={<User className="w-5 h-5" />}
                required
              />
              <Input
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              leftIcon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              label={userType === 'investor' ? 'Investment Firm (Optional)' : 'Company Name'}
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder={userType === 'investor' ? 'Your firm name' : 'Your startup name'}
              leftIcon={<Building className="w-5 h-5" />}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
              helperText="Minimum 8 characters"
              required
            />

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              leftIcon={<Lock className="w-5 h-5" />}
              required
            />

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
              </span>
            </label>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-navy-900 to-navy-950 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          {userType === 'developer' ? (
            <>
              <Rocket className="w-16 h-16 text-primary-400 mx-auto mb-6" />
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                Get Your Startup Funded
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Join vetted founders who've raised over $2.5M through AngelVault. No tire-kickers, just serious investors.
              </p>
              <ul className="text-left space-y-4 text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <span className="text-primary-400 text-sm">✓</span>
                  </div>
                  No upfront fees - 2% success fee only
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <span className="text-primary-400 text-sm">✓</span>
                  </div>
                  NDA protection for your IP
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center">
                    <span className="text-primary-400 text-sm">✓</span>
                  </div>
                  Streamlined SAFE note execution
                </li>
              </ul>
            </>
          ) : (
            <>
              <TrendingUp className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
              <h2 className="font-display text-3xl font-bold text-white mb-4">
                Discover Vetted Opportunities
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Skip the noise. Access admin-vetted startups with complete documentation and realistic financials.
              </p>
              <ul className="text-left space-y-4 text-gray-300">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 text-sm">✓</span>
                  </div>
                  40% rejection rate ensures quality
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 text-sm">✓</span>
                  </div>
                  $500 unlocks 4 detailed evaluations
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-yellow-400 text-sm">✓</span>
                  </div>
                  Direct founder meetings on platform
                </li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
