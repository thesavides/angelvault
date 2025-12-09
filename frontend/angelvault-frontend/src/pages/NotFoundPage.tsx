import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 404 Illustration */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <div className="text-[150px] font-display font-bold text-primary-100 leading-none select-none">
                404
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <Search className="w-10 h-10 text-primary-600" />
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-display font-bold text-navy-900 mb-4"
          >
            Page Not Found
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8 max-w-md mx-auto"
          >
            Oops! The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Go Back
            </Button>
            <Link to="/">
              <Button leftIcon={<Home className="w-4 h-4" />}>
                Back to Home
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-12 pt-8 border-t border-gray-100"
          >
            <p className="text-sm text-gray-500 mb-4">Looking for something specific?</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/projects"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Browse Projects
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Sign In
              </Link>
              <span className="text-gray-300">•</span>
              <Link
                to="/signup"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                Create Account
              </Link>
              <span className="text-gray-300">•</span>
              <a
                href="mailto:support@angelvault.io"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <HelpCircle className="w-4 h-4" />
                Contact Support
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default NotFoundPage;
