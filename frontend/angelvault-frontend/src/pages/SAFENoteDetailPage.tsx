import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, FileSignature, DollarSign, Percent, Calendar,
  CheckCircle, XCircle, Clock, User, Building2, Loader2,
  Download, AlertCircle, Shield, Info, ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';
import type { SAFENote } from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary'; description: string }> = {
  draft: { label: 'Draft', variant: 'secondary', description: 'Offer has not been sent yet' },
  sent: { label: 'Sent', variant: 'warning', description: 'Waiting for founder to review' },
  signed_investor: { label: 'Investor Signed', variant: 'primary', description: 'Waiting for founder signature' },
  signed_founder: { label: 'Founder Signed', variant: 'primary', description: 'Waiting for investor signature' },
  executed: { label: 'Executed', variant: 'success', description: 'Both parties have signed' },
  cancelled: { label: 'Cancelled', variant: 'error', description: 'Offer has been cancelled' },
};

export function SAFENoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [safeNote, setSafeNote] = useState<SAFENote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isInvestor = user?.role === 'investor';
  const isDeveloper = user?.role === 'developer';

  useEffect(() => {
    trackEvent('page_view', { page: 'safe_note_detail', safe_note_id: id });
    loadSafeNote();
  }, [id]);

  const loadSafeNote = async () => {
    try {
      const note = await api.getSAFENote(id!);
      setSafeNote(note);
    } catch (error) {
      console.error('Failed to load SAFE note:', error);
      toast.error('Failed to load SAFE note');
      navigate(-1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSign = async () => {
    if (!safeNote) return;

    const confirmMessage = isInvestor
      ? 'Are you sure you want to sign this SAFE note? This is a legally binding agreement.'
      : 'Are you sure you want to sign this SAFE note? This will execute the investment agreement.';

    if (!window.confirm(confirmMessage)) return;

    setIsSigning(true);
    try {
      // Use electronic signature with user's name
      const signature = `${user?.first_name} ${user?.last_name}`;
      await api.signSAFENote(safeNote.id, signature);
      toast.success('SAFE note signed successfully');
      trackEvent('safe_note_signed', { safe_note_id: safeNote.id, role: user?.role || 'unknown' });
      loadSafeNote();
    } catch (error: any) {
      console.error('Failed to sign SAFE note:', error);
      toast.error(error.response?.data?.error || 'Failed to sign SAFE note');
    } finally {
      setIsSigning(false);
    }
  };

  const handleCancel = async () => {
    if (!safeNote || !cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsCancelling(true);
    try {
      await api.cancelSAFENote(safeNote.id, cancelReason);
      toast.success('SAFE note cancelled');
      trackEvent('safe_note_cancelled', { safe_note_id: safeNote.id, role: user?.role || 'unknown' });
      loadSafeNote();
      setShowCancelModal(false);
    } catch (error: any) {
      console.error('Failed to cancel SAFE note:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel SAFE note');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const canSign = () => {
    if (!safeNote) return false;
    if (isInvestor) {
      return safeNote.status === 'signed_founder';
    }
    if (isDeveloper) {
      return safeNote.status === 'sent' || safeNote.status === 'signed_investor';
    }
    return false;
  };

  const canCancel = () => {
    if (!safeNote) return false;
    return ['draft', 'sent', 'signed_investor', 'signed_founder'].includes(safeNote.status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!safeNote) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">SAFE Note Not Found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[safeNote.status] || statusConfig.draft;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-navy-900">
                SAFE Note Details
              </h1>
              <p className="text-gray-600 mt-1">
                Investment in {safeNote.project?.title}
              </p>
            </div>
            <Badge variant={statusInfo.variant} className="text-sm px-3 py-1">
              {statusInfo.label}
            </Badge>
          </div>
        </motion.div>

        {/* Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className={`rounded-xl p-4 ${
            safeNote.status === 'executed' ? 'bg-green-50 border border-green-200' :
            canSign() ? 'bg-yellow-50 border border-yellow-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              {safeNote.status === 'executed' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : canSign() ? (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              ) : (
                <Clock className="w-6 h-6 text-gray-500" />
              )}
              <div>
                <p className="font-medium text-navy-900">{statusInfo.description}</p>
                {canSign() && (
                  <p className="text-sm text-gray-600 mt-1">
                    Your signature is required to proceed
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Investment Terms */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSignature className="w-5 h-5" />
                    Investment Terms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Investment Amount</p>
                      <p className="text-2xl font-bold text-navy-900">
                        {formatCurrency(safeNote.investment_amount)}
                      </p>
                    </div>
                    {safeNote.valuation_cap && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Valuation Cap</p>
                        <p className="text-2xl font-bold text-navy-900">
                          {formatCurrency(safeNote.valuation_cap)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    {safeNote.discount_rate && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                          <Percent className="w-4 h-4" />
                          <span className="text-sm">Discount Rate</span>
                        </div>
                        <p className="text-lg font-semibold text-navy-900">{safeNote.discount_rate}%</p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm">MFN</span>
                      </div>
                      <p className="text-lg font-semibold text-navy-900">
                        {safeNote.is_mfn ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Pro Rata Rights</span>
                      </div>
                      <p className="text-lg font-semibold text-navy-900">
                        {safeNote.pro_rata_rights ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>

                  {safeNote.custom_terms && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Additional Terms</p>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{safeNote.custom_terms}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Signature Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Signature Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        safeNote.investor_signed_at ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {safeNote.investor_signed_at ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-navy-900">Investor Signature</p>
                        <p className="text-sm text-gray-500">
                          {safeNote.investor_signed_at
                            ? `Signed on ${format(new Date(safeNote.investor_signed_at), 'MMMM d, yyyy')}`
                            : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        safeNote.developer_signed_at ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {safeNote.developer_signed_at ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-navy-900">Founder Signature</p>
                        <p className="text-sm text-gray-500">
                          {safeNote.developer_signed_at
                            ? `Signed on ${format(new Date(safeNote.developer_signed_at), 'MMMM d, yyyy')}`
                            : 'Pending'}
                        </p>
                      </div>
                    </div>
                    {safeNote.executed_at && (
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-navy-900">Executed</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(safeNote.executed_at), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Project</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                      {safeNote.project?.logo_url ? (
                        <img src={safeNote.project.logo_url} alt="" className="w-10 h-10 object-contain rounded-lg" />
                      ) : (
                        <Building2 className="w-6 h-6 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-navy-900">{safeNote.project?.title}</h4>
                      <p className="text-sm text-gray-500">{safeNote.project?.tagline}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Parties Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Parties</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Investor</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">
                          {safeNote.investor?.first_name} {safeNote.investor?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {safeNote.investor?.company_name || 'Individual Investor'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Founder</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-navy-900">
                          {safeNote.developer?.first_name} {safeNote.developer?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {safeNote.developer?.company_name || safeNote.project?.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card>
                <CardContent className="p-4 space-y-3">
                  {canSign() && (
                    <Button
                      onClick={handleSign}
                      isLoading={isSigning}
                      className="w-full"
                      leftIcon={<FileSignature className="w-4 h-4" />}
                    >
                      Sign SAFE Note
                    </Button>
                  )}
                  {safeNote.document_url && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(safeNote.document_url, '_blank')}
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Download Document
                    </Button>
                  )}
                  {canCancel() && (
                    <Button
                      variant="outline"
                      className="w-full text-red-600 hover:text-red-700 hover:border-red-300"
                      onClick={() => setShowCancelModal(true)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                    >
                      Cancel Offer
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-navy-900 mb-4">Cancel SAFE Note</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this investment offer? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Please provide a reason for cancellation..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
                className="flex-1"
              >
                Keep Offer
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                isLoading={isCancelling}
                className="flex-1 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                Confirm Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default SAFENoteDetailPage;
