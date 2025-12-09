import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard, Check, Shield, Zap, Eye, ArrowLeft, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent, trackEvents } from '../utils/analytics';

interface Package {
  id: string;
  name: string;
  views: number;
  price: number;
  popular?: boolean;
  savings?: string;
}

const packages: Package[] = [
  { id: 'starter', name: 'Starter', views: 4, price: 500 },
  { id: 'explorer', name: 'Explorer', views: 10, price: 1000, popular: true, savings: 'Save 20%' },
  { id: 'pro', name: 'Pro Investor', views: 25, price: 2000, savings: 'Save 36%' },
];

export function InvestorPurchasePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<Package>(packages[1]);
  const [viewsRemaining, setViewsRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnTo = location.state?.returnTo || '/investor/dashboard';

  useEffect(() => {
    trackEvent('page_view', { page: 'investor_purchase' });
    loadCurrentViews();
  }, []);

  const loadCurrentViews = async () => {
    try {
      const res = await api.getInvestorDashboard();
      setViewsRemaining(res.views_remaining);
    } catch (error) {
      console.error('Failed to load views:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    setError(null);

    try {
      trackEvent('begin_checkout', {
        package_id: selectedPackage.id,
        package_name: selectedPackage.name,
        value: selectedPackage.price,
      });

      // Try checkout session first, fall back to payment intent
      try {
        const checkoutRes = await api.createCheckoutSession();
        if (checkoutRes.checkout_url) {
          window.location.href = checkoutRes.checkout_url;
          return;
        }
      } catch {
        // Fall back to payment intent flow
      }

      const res = await api.createPaymentIntent();
      if (res.client_secret) {
        // Handle Stripe Elements flow if needed
        setError('Payment flow requires Stripe Elements setup');
      } else {
        setError('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Payment failed:', error);
      setError(error.response?.data?.error || 'Payment initialization failed');
    } finally {
      setIsPurchasing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container-wide py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-navy-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl font-bold text-navy-900 mb-2">
              Purchase Project Views
            </h1>
            <p className="text-gray-600">
              Get access to detailed project information, team backgrounds, and financials
            </p>
            {viewsRemaining > 0 && (
              <p className="mt-2 text-sm text-primary-600">
                You currently have <span className="font-semibold">{viewsRemaining}</span> views remaining
              </p>
            )}
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Card className="border-l-4 border-l-red-500 bg-red-50">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800">{error}</p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Packages */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card
                  hover
                  className={`cursor-pointer relative ${
                    selectedPackage.id === pkg.id
                      ? 'ring-2 ring-primary-500 border-primary-500'
                      : ''
                  } ${pkg.popular ? 'border-gold-400' : ''}`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="gold">Most Popular</Badge>
                    </div>
                  )}
                  {pkg.savings && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="success">{pkg.savings}</Badge>
                    </div>
                  )}
                  <CardContent className="pt-8">
                    <div className="text-center">
                      <h3 className="font-display text-xl font-semibold text-navy-900 mb-2">
                        {pkg.name}
                      </h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-navy-900">
                          {formatCurrency(pkg.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
                        <Eye className="w-5 h-5 text-primary-600" />
                        <span className="font-semibold">{pkg.views} Project Views</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(pkg.price / pkg.views)} per view
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Full pitch deck access',
                    'Team member profiles & backgrounds',
                    'Financial projections & metrics',
                    'Direct meeting requests',
                    'NDA-protected information',
                    'SAFE note execution support',
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Purchase Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <p className="text-gray-600 mb-1">Selected Package</p>
                    <p className="text-xl font-semibold text-navy-900">
                      {selectedPackage.name} - {selectedPackage.views} Views
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-gray-600 mb-1">Total</p>
                    <p className="text-3xl font-bold text-navy-900">
                      {formatCurrency(selectedPackage.price)}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={handlePurchase}
                    isLoading={isPurchasing}
                    leftIcon={<CreditCard className="w-5 h-5" />}
                  >
                    Purchase Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-8 mt-8 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure Payment via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Views Never Expire</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default InvestorPurchasePage;
