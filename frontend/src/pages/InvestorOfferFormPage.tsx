import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, DollarSign, Percent, FileSignature, Info,
  Loader2, CheckCircle, Building2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { trackEvent } from '../utils/analytics';
import type { Project, SAFENote } from '../types';
import toast from 'react-hot-toast';

export function InvestorOfferFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [existingOffer, setExistingOffer] = useState<SAFENote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Form state
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [valuationCap, setValuationCap] = useState('');
  const [discountRate, setDiscountRate] = useState('');
  const [isMFN, setIsMFN] = useState(false);
  const [proRataRights, setProRataRights] = useState(true);
  const [customTerms, setCustomTerms] = useState('');

  const isEditing = !!id;

  useEffect(() => {
    trackEvent('page_view', { page: isEditing ? 'edit_offer' : 'new_offer' });
    loadData();
  }, [id, projectId]);

  const loadData = async () => {
    try {
      if (isEditing && id) {
        const offer = await api.getSAFENote(id);
        setExistingOffer(offer);
        setInvestmentAmount(offer.investment_amount.toString());
        setValuationCap(offer.valuation_cap?.toString() || '');
        setDiscountRate(offer.discount_rate?.toString() || '');
        setIsMFN(offer.is_mfn);
        setProRataRights(offer.pro_rata_rights);
        setCustomTerms(offer.custom_terms || '');
        if (offer.project) {
          setProject(offer.project);
        }
      } else if (projectId) {
        const proj = await api.getProject(projectId);
        setProject(proj);
        // Pre-fill from project defaults
        if (proj.valuation_cap) setValuationCap(proj.valuation_cap.toString());
        if (proj.discount_rate) setDiscountRate(proj.discount_rate.toString());
        if (proj.minimum_investment) setInvestmentAmount(proj.minimum_investment.toString());
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!project) {
      toast.error('Please select a project');
      return false;
    }
    if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
      toast.error('Please enter a valid investment amount');
      return false;
    }
    if (project.minimum_investment && parseFloat(investmentAmount) < project.minimum_investment) {
      toast.error(`Minimum investment is $${project.minimum_investment.toLocaleString()}`);
      return false;
    }
    if (project.maximum_investment && parseFloat(investmentAmount) > project.maximum_investment) {
      toast.error(`Maximum investment is $${project.maximum_investment.toLocaleString()}`);
      return false;
    }
    if (!valuationCap && !discountRate && !isMFN) {
      toast.error('Please specify either a valuation cap, discount rate, or MFN terms');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const data = {
        project_id: project!.id,
        investment_amount: parseFloat(investmentAmount),
        valuation_cap: valuationCap ? parseFloat(valuationCap) : undefined,
        discount_rate: discountRate ? parseFloat(discountRate) : undefined,
        is_mfn: isMFN,
        pro_rata_rights: proRataRights,
        custom_terms: customTerms || undefined,
      };

      if (isEditing && id) {
        await api.updateSAFENote(id, data);
        toast.success('Offer updated');
      } else {
        const newOffer = await api.createSAFENote(data);
        toast.success('Draft saved');
        navigate(`/investor/offers/${newOffer.id}`);
        return;
      }

      trackEvent('offer_saved', { project_id: project!.id, amount: investmentAmount });
      navigate('/investor/offers');
    } catch (error: any) {
      console.error('Failed to save offer:', error);
      toast.error(error.response?.data?.error || 'Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendOffer = async () => {
    if (!validateForm()) return;

    setIsSending(true);
    try {
      const data = {
        project_id: project!.id,
        investment_amount: parseFloat(investmentAmount),
        valuation_cap: valuationCap ? parseFloat(valuationCap) : undefined,
        discount_rate: discountRate ? parseFloat(discountRate) : undefined,
        is_mfn: isMFN,
        pro_rata_rights: proRataRights,
        custom_terms: customTerms || undefined,
      };

      let offerId = id;
      if (isEditing && id) {
        await api.updateSAFENote(id, data);
      } else {
        const newOffer = await api.createSAFENote(data);
        offerId = newOffer.id;
      }

      await api.sendSAFENote(offerId!);
      toast.success('Offer sent to founder');
      trackEvent('offer_sent', { project_id: project!.id, amount: investmentAmount });
      navigate('/investor/offers');
    } catch (error: any) {
      console.error('Failed to send offer:', error);
      toast.error(error.response?.data?.error || 'Failed to send offer');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!project && !isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-navy-900 mb-2">No Project Selected</h2>
          <p className="text-gray-600 mb-4">
            Please select a project from the browse page to create an investment offer.
          </p>
          <Button onClick={() => navigate('/projects')}>Browse Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-3xl font-display font-bold text-navy-900">
            {isEditing ? 'Edit Investment Offer' : 'New Investment Offer'}
          </h1>
          <p className="text-gray-600 mt-1">
            Create a SAFE note investment offer
          </p>
        </motion.div>

        {/* Project Card */}
        {project && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                    {project.logo_url ? (
                      <img src={project.logo_url} alt={project.title} className="w-12 h-12 object-contain rounded-lg" />
                    ) : (
                      <Building2 className="w-8 h-8 text-primary-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-900">{project.title}</h3>
                    <p className="text-sm text-gray-500">{project.tagline}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      {project.minimum_investment && (
                        <span>Min: ${project.minimum_investment.toLocaleString()}</span>
                      )}
                      {project.maximum_investment && (
                        <span>Max: ${project.maximum_investment.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSignature className="w-5 h-5" />
                SAFE Note Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Investment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    value={investmentAmount}
                    onChange={(e) => setInvestmentAmount(e.target.value)}
                    placeholder="50,000"
                    className="pl-10"
                    min={project?.minimum_investment || 0}
                    max={project?.maximum_investment || undefined}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  The amount you wish to invest in this company
                </p>
              </div>

              {/* Valuation Cap */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valuation Cap
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    value={valuationCap}
                    onChange={(e) => setValuationCap(e.target.value)}
                    placeholder="5,000,000"
                    className="pl-10"
                    disabled={isMFN}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Maximum company valuation for conversion (leave blank for uncapped)
                </p>
              </div>

              {/* Discount Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Rate
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(e.target.value)}
                    placeholder="20"
                    className="pl-10"
                    min={0}
                    max={100}
                    disabled={isMFN}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Discount on the price per share at conversion
                </p>
              </div>

              {/* MFN Checkbox */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="mfn"
                  checked={isMFN}
                  onChange={(e) => {
                    setIsMFN(e.target.checked);
                    if (e.target.checked) {
                      setValuationCap('');
                      setDiscountRate('');
                    }
                  }}
                  className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <label htmlFor="mfn" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Most Favored Nation (MFN)
                  </label>
                  <p className="text-sm text-gray-500">
                    Your SAFE will automatically receive the best terms offered to any future SAFE investor
                  </p>
                </div>
              </div>

              {/* Pro Rata Rights */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="prorata"
                  checked={proRataRights}
                  onChange={(e) => setProRataRights(e.target.checked)}
                  className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <label htmlFor="prorata" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Pro Rata Rights
                  </label>
                  <p className="text-sm text-gray-500">
                    Right to participate in future funding rounds to maintain ownership percentage
                  </p>
                </div>
              </div>

              {/* Custom Terms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Terms (Optional)
                </label>
                <textarea
                  value={customTerms}
                  onChange={(e) => setCustomTerms(e.target.value)}
                  placeholder="Any additional terms or conditions..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">About SAFE Notes</p>
                  <p>
                    A SAFE (Simple Agreement for Future Equity) is an agreement between an investor 
                    and a company that provides rights to the investor for future equity. SAFEs convert 
                    to equity upon a triggering event, typically a priced funding round.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  isLoading={isSaving}
                  disabled={isSending}
                  className="flex-1"
                >
                  Save as Draft
                </Button>
                <Button
                  onClick={handleSendOffer}
                  isLoading={isSending}
                  disabled={isSaving}
                  leftIcon={<FileSignature className="w-4 h-4" />}
                  className="flex-1"
                >
                  Send Offer to Founder
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default InvestorOfferFormPage;
