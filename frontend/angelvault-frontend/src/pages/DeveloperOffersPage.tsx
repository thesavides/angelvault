import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Coins, Clock, CheckCircle, XCircle, FileText,
  Search, ChevronRight, Loader2, DollarSign, Building2,
  Calendar, User, AlertCircle, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { trackEvent } from '../utils/analytics';
import type { SAFENote } from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type OfferStatus = 'all' | 'sent' | 'signed_investor' | 'signed_founder' | 'executed' | 'cancelled';

const statusConfig: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary'; icon: React.ElementType }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  sent: { label: 'New Offer', variant: 'warning', icon: AlertCircle },
  signed_investor: { label: 'Investor Signed', variant: 'primary', icon: Clock },
  signed_founder: { label: 'You Signed', variant: 'primary', icon: CheckCircle },
  executed: { label: 'Executed', variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'error', icon: XCircle },
};

export function DeveloperOffersPage() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<SAFENote[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<SAFENote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OfferStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    trackEvent('page_view', { page: 'developer_offers' });
    loadOffers();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, statusFilter, searchQuery]);

  const loadOffers = async () => {
    try {
      const response = await api.getDeveloperSAFENotes();
      setOffers(response.safe_notes || []);
    } catch (error) {
      console.error('Failed to load offers:', error);
      toast.error('Failed to load investment offers');
    } finally {
      setIsLoading(false);
    }
  };

  const filterOffers = () => {
    let filtered = [...offers];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(offer => offer.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(offer =>
        offer.project?.title?.toLowerCase().includes(query) ||
        offer.investor?.first_name?.toLowerCase().includes(query) ||
        offer.investor?.last_name?.toLowerCase().includes(query) ||
        offer.investor?.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredOffers(filtered);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || { label: status, variant: 'secondary' as const, icon: FileText };
  };

  const newOffersCount = offers.filter(o => o.status === 'sent' || o.status === 'signed_investor').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-display font-bold text-navy-900">
                  Investment Offers
                </h1>
                {newOffersCount > 0 && (
                  <Badge variant="warning">{newOffersCount} New</Badge>
                )}
              </div>
              <p className="text-gray-600 mt-1">
                Review and respond to SAFE note offers from investors
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Coins className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">{offers.length}</p>
                  <p className="text-sm text-gray-500">Total Offers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">{newOffersCount}</p>
                  <p className="text-sm text-gray-500">Needs Action</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">
                    {offers.filter(o => o.status === 'executed').length}
                  </p>
                  <p className="text-sm text-gray-500">Executed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">
                    {formatCurrency(offers.filter(o => o.status === 'executed').reduce((sum, o) => sum + o.investment_amount, 0))}
                  </p>
                  <p className="text-sm text-gray-500">Capital Raised</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by project or investor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {(['all', 'sent', 'signed_investor', 'executed', 'cancelled'] as OfferStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        statusFilter === status
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'all' ? 'All' : getStatusInfo(status).label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Offers List */}
        <div className="space-y-4">
          {filteredOffers.length > 0 ? (
            filteredOffers.map((offer, index) => {
              const statusInfo = getStatusInfo(offer.status);
              const StatusIcon = statusInfo.icon;
              const needsAction = offer.status === 'sent' || offer.status === 'signed_investor';

              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link to={`/developer/offers/${offer.id}`}>
                    <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer group ${needsAction ? 'ring-2 ring-yellow-400' : ''}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center flex-shrink-0">
                              <User className="w-6 h-6 text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-navy-900 group-hover:text-primary-600 transition-colors">
                                  {offer.investor?.first_name} {offer.investor?.last_name}
                                </h3>
                                <Badge variant={statusInfo.variant}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                                {needsAction && (
                                  <Badge variant="warning">Action Required</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mb-3">
                                {offer.investor?.company_name || 'Individual Investor'} • {offer.project?.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-navy-900 font-semibold">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span>{formatCurrency(offer.investment_amount)}</span>
                                </div>
                                {offer.valuation_cap && (
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <span className="text-gray-400">Cap:</span>
                                    <span>{formatCurrency(offer.valuation_cap)}</span>
                                  </div>
                                )}
                                {offer.discount_rate && (
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <span className="text-gray-400">Discount:</span>
                                    <span>{offer.discount_rate}%</span>
                                  </div>
                                )}
                                {offer.is_mfn && (
                                  <Badge variant="secondary">MFN</Badge>
                                )}
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>{format(new Date(offer.created_at), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="text-center py-12">
                  <Coins className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-navy-900 mb-2">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No offers found'
                      : 'No investment offers yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Investment offers from investors will appear here'}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DeveloperOffersPage;
