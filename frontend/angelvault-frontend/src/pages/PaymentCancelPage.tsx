import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { trackEvent } from '../utils/analytics';

export function PaymentCancelPage() {
  useEffect(() => {
    trackEvent('payment_cancelled');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20 pb-12">
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
                className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <XCircle className="w-10 h-10 text-gray-400" />
              </motion.div>

              <h1 className="text-3xl font-display font-bold text-navy-900 mb-4">
                Payment Cancelled
              </h1>

              <p className="text-gray-600 mb-6">
                Your payment was cancelled. No charges have been made to your account.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-medium text-navy-900 mb-2">Why purchase a view package?</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600">•</span>
                    Access complete project information and financials
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600">•</span>
                    Connect directly with vetted founders
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600">•</span>
                    Execute SAFE notes directly through the platform
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Link to="/investor/purchase" className="block">
                  <Button className="w-full" size="lg">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                </Link>
                <Link to="/projects" className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Projects
                  </Button>
                </Link>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Having trouble?</p>
                <a
                  href="mailto:support@angelvault.io"
                  className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm"
                >
                  <HelpCircle className="w-4 h-4" />
                  Contact Support
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default PaymentCancelPage;
