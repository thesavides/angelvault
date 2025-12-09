import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSignature, Shield, CheckCircle, AlertCircle, Loader2, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { trackEvent, trackEvents } from '../utils/analytics';

export function InvestorNDAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [hasSignedMasterNDA, setHasSignedMasterNDA] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const returnTo = location.state?.returnTo || '/investor/dashboard';

  useEffect(() => {
    trackEvent('page_view', { page: 'investor_nda' });
    checkNDAStatus();
  }, []);

  const checkNDAStatus = async () => {
    try {
      const res = await api.getMasterNDAStatus();
      const hasSigned = res.has_signed || res.has_signed_master_nda;
      setHasSignedMasterNDA(hasSigned || false);
      if (hasSigned) {
        navigate(returnTo);
      }
    } catch (error) {
      console.error('Failed to check NDA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignNDA = async () => {
    if (!agreed) return;
    
    setIsSigning(true);
    try {
      await api.signMasterNDA('electronic_signature', true);
      trackEvent('nda_signed', { type: 'master' });
      setHasSignedMasterNDA(true);
      setTimeout(() => navigate(returnTo), 1500);
    } catch (error) {
      console.error('Failed to sign NDA:', error);
    } finally {
      setIsSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (hasSignedMasterNDA) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Card className="max-w-md text-center">
          <CardContent className="py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-navy-900 mb-2">NDA Signed!</h2>
            <p className="text-gray-600">Redirecting you back...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container-narrow py-8">
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
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary-100 flex items-center justify-center">
                  <FileSignature className="w-7 h-7 text-primary-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Master Non-Disclosure Agreement</CardTitle>
                  <p className="text-gray-600">Required to view project details</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* NDA Content */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6 max-h-96 overflow-y-auto">
                <h3 className="font-semibold text-navy-900 mb-4">CONFIDENTIALITY AGREEMENT</h3>
                
                <div className="prose prose-sm prose-navy">
                  <p className="mb-4">
                    This Non-Disclosure Agreement ("Agreement") is entered into by and between 
                    AngelVault B.V. ("Platform") and the undersigned investor ("Recipient").
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">1. Confidential Information</h4>
                  <p className="mb-4">
                    "Confidential Information" means all information disclosed by Platform or any 
                    startup listed on the Platform ("Disclosing Party") to Recipient, including but 
                    not limited to: business plans, financial projections, technical specifications, 
                    customer data, trade secrets, and any other proprietary information.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">2. Non-Disclosure Obligations</h4>
                  <p className="mb-4">
                    Recipient agrees to: (a) maintain the confidentiality of all Confidential 
                    Information; (b) not disclose any Confidential Information to third parties; 
                    (c) use Confidential Information solely for evaluating potential investments; 
                    (d) protect Confidential Information with at least the same degree of care used 
                    to protect their own confidential information.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">3. Exceptions</h4>
                  <p className="mb-4">
                    This Agreement does not apply to information that: (a) was publicly known prior 
                    to disclosure; (b) becomes publicly known through no fault of Recipient; 
                    (c) was rightfully in Recipient's possession prior to disclosure; (d) is 
                    independently developed by Recipient without use of Confidential Information.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">4. Term</h4>
                  <p className="mb-4">
                    This Agreement remains in effect for five (5) years from the date of signing.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">5. Return of Materials</h4>
                  <p className="mb-4">
                    Upon request, Recipient shall return or destroy all Confidential Information 
                    and any copies thereof.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">6. Governing Law</h4>
                  <p className="mb-4">
                    This Agreement shall be governed by the laws of the Netherlands.
                  </p>

                  <h4 className="font-semibold mt-4 mb-2">7. Remedies</h4>
                  <p className="mb-4">
                    Recipient acknowledges that breach of this Agreement may cause irreparable harm 
                    and that the Disclosing Party shall be entitled to seek equitable relief, 
                    including injunction and specific performance, in addition to all other remedies.
                  </p>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-3 mb-6">
                <input
                  type="checkbox"
                  id="agree"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="agree" className="text-sm text-gray-700">
                  I, <span className="font-semibold">{user?.first_name} {user?.last_name}</span>, 
                  have read and agree to the terms of this Non-Disclosure Agreement. I understand 
                  that this is a legally binding agreement and that I will be held responsible for 
                  any breach of confidentiality.
                </label>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 mb-6 py-4 border-t border-b border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-primary-600" />
                  <span>Legally Binding</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>POPIA Compliant</span>
                </div>
              </div>

              {/* Sign Button */}
              <Button
                fullWidth
                size="lg"
                onClick={handleSignNDA}
                isLoading={isSigning}
                disabled={!agreed}
              >
                <FileSignature className="w-5 h-5 mr-2" />
                Sign NDA Agreement
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By signing, you agree to be bound by the terms above. Your signature will be 
                recorded with timestamp for legal purposes.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default InvestorNDAPage;
