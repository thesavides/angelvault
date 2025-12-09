import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Eye, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { trackEvent } from '../utils/analytics';
import api from '../services/api';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [viewsRemaining, setViewsRemaining] = useState(0);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    trackEvent('payment_success', { session_id: sessionId || 'unknown' });
    loadPaymentStatus();
  }, []);

  const loadPaymentStatus = async () => {
    try {
      const status = await api.getPaymentPackageStatus();
      setViewsRemaining(status.views_remaining);
    } catch (error) {
      console.error('Failed to load payment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white pt-20 pb-12">
      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center">
            <CardContent className="p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>

              <h1 className="text-3xl font-display font-bold text-navy-900 mb-4">
                Payment Successful!
              </h1>

              <p className="text-gray-600 mb-6">
                Your payment has been processed successfully. You now have access to view projects.
              </p>

              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : (
                <div className="bg-primary-50 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <Eye className="w-6 h-6 text-primary-600" />
                    <div>
                      <p className="text-3xl font-bold text-navy-900">{viewsRemaining}</p>
                      <p className="text-sm text-gray-600">Project Views Available</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Link to="/projects" className="block">
                  <Button className="w-full" size="lg">
                    Browse Projects
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/investor/dashboard" className="block">
                  <Button variant="outline" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                A receipt has been sent to your email address.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default PaymentSuccessPage;
