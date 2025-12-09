import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { trackEvent } from '../utils/analytics';
import toast from 'react-hot-toast';

type Step = 'request' | 'sent' | 'reset' | 'success';

export function PasswordResetPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState<Step>(token ? 'reset' : 'request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    trackEvent('page_view', { page: 'password_reset', step });
  }, [step]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await api.requestPasswordReset(email);
      setStep('sent');
      trackEvent('password_reset_requested');
    } catch (error: any) {
      console.error('Failed to request password reset:', error);
      // Don't reveal if email exists or not
      setStep('sent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(token!, password);
      setStep('success');
      trackEvent('password_reset_completed');
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      setError(error.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-display font-bold text-navy-900">AngelVault</span>
            </Link>
          </div>

          <Card>
            <CardContent className="p-8">
              {/* Request Step */}
              {step === 'request' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
                      Reset Password
                    </h1>
                    <p className="text-gray-600">
                      Enter your email address and we'll send you instructions to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleRequestReset} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}

                    <Button type="submit" isLoading={isLoading} className="w-full">
                      Send Reset Instructions
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </Link>
                  </div>
                </>
              )}

              {/* Email Sent Step */}
              {step === 'sent' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
                    Check Your Email
                  </h1>
                  <p className="text-gray-600 mb-6">
                    If an account exists for <strong>{email}</strong>, you'll receive password reset instructions shortly.
                  </p>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('request')}
                      className="w-full"
                    >
                      Try Another Email
                    </Button>
                    <Link to="/login">
                      <Button variant="outline" className="w-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Reset Password Step */}
              {step === 'reset' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
                      Create New Password
                    </h1>
                    <p className="text-gray-600">
                      Enter your new password below.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10"
                          required
                          minLength={8}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </div>
                    )}

                    <Button type="submit" isLoading={isLoading} className="w-full">
                      Reset Password
                    </Button>
                  </form>
                </>
              )}

              {/* Success Step */}
              {step === 'success' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-display font-bold text-navy-900 mb-2">
                    Password Reset Complete
                  </h1>
                  <p className="text-gray-600 mb-6">
                    Your password has been successfully reset. You can now sign in with your new password.
                  </p>
                  <Link to="/login">
                    <Button className="w-full">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default PasswordResetPage;
