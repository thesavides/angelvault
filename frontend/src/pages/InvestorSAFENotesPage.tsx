import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSignature, Clock, CheckCircle, XCircle, FileText,
  Search, ChevronRight, Loader2, DollarSign, Building2,
  Calendar, Download, Filter
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

type NoteStatus = 'all' | 'draft' | 'sent' | 'signed_investor' | 'signed_founder' | 'executed' | 'cancelled';

const statusConfig: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary'; icon: React.ElementType }> = {
  draft: { label: 'Draft', variant: 'secondary', icon: FileText },
  sent: { label: 'Sent', variant: 'warning', icon: Clock },
  signed_investor: { label: 'Awaiting Founder', variant: 'primary', icon: Clock },
  signed_founder: { label: 'Ready to Sign', variant: 'warning', icon: FileSignature },
  executed: { label: 'Executed', variant: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'error', icon: XCircle },
};

export function InvestorSAFENotesPage() {
  const { user } = useAuth();
  const [safeNotes, setSafeNotes] = useState<SAFENote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<SAFENote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<NoteStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    trackEvent('page_view', { page: 'investor_safe_notes' });
    loadSAFENotes();
  }, []);

  useEffect(() => {
    filterNotes();
  }, [safeNotes, statusFilter, searchQuery]);

  const loadSAFENotes = async () => {
    try {
      const response = await api.getInvestorSAFENotes();
      setSafeNotes(response.safe_notes || []);
    } catch (error) {
      console.error('Failed to load SAFE notes:', error);
      toast.error('Failed to load SAFE notes');
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotes = () => {
    let filtered = [...safeNotes];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(note => note.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.project?.title?.toLowerCase().includes(query) ||
        note.developer?.company_name?.toLowerCase().includes(query)
      );
    }

    setFilteredNotes(filtered);
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

  const totalInvested = safeNotes
    .filter(n => n.status === 'executed')
    .reduce((sum, n) => sum + n.investment_amount, 0);

  const totalPending = safeNotes
    .filter(n => ['sent', 'signed_investor', 'signed_founder'].includes(n.status))
    .reduce((sum, n) => sum + n.investment_amount, 0);

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
              <h1 className="text-3xl font-display font-bold text-navy-900">
                SAFE Notes
              </h1>
              <p className="text-gray-600 mt-1">
                Track and manage your investment agreements
              </p>
            </div>
            <Link to="/investor/offers/new">
              <Button leftIcon={<FileSignature className="w-4 h-4" />}>
                New Investment
              </Button>
            </Link>
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
                  <FileSignature className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">{safeNotes.length}</p>
                  <p className="text-sm text-gray-500">Total Notes</p>
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
                    {safeNotes.filter(n => n.status === 'executed').length}
                  </p>
                  <p className="text-sm text-gray-500">Executed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">{formatCurrency(totalInvested)}</p>
                  <p className="text-sm text-gray-500">Total Invested</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">{formatCurrency(totalPending)}</p>
                  <p className="text-sm text-gray-500">Pending</p>
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
                      placeholder="Search by project or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {(['all', 'executed', 'signed_investor', 'sent', 'cancelled'] as NoteStatus[]).map((status) => (
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

        {/* SAFE Notes List */}
        <div className="space-y-4">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note, index) => {
              const statusInfo = getStatusInfo(note.status);
              const StatusIcon = statusInfo.icon;

              return (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <Link to={`/investor/safe-notes/${note.id}`}>
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center flex-shrink-0">
                              {note.project?.logo_url ? (
                                <img
                                  src={note.project.logo_url}
                                  alt={note.project.title}
                                  className="w-10 h-10 object-contain rounded-lg"
                                />
                              ) : (
                                <Building2 className="w-6 h-6 text-primary-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-semibold text-navy-900 group-hover:text-primary-600 transition-colors">
                                  {note.project?.title || 'Unknown Project'}
                                </h3>
                                <Badge variant={statusInfo.variant}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mb-3">
                                {note.developer?.company_name || `${note.developer?.first_name} ${note.developer?.last_name}`}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-navy-900 font-semibold">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span>{formatCurrency(note.investment_amount)}</span>
                                </div>
                                {note.valuation_cap && (
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <span className="text-gray-400">Cap:</span>
                                    <span>{formatCurrency(note.valuation_cap)}</span>
                                  </div>
                                )}
                                {note.discount_rate && (
                                  <div className="flex items-center gap-1.5 text-gray-600">
                                    <span className="text-gray-400">Discount:</span>
                                    <span>{note.discount_rate}%</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {note.document_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.open(note.document_url, '_blank');
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
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
                  <FileSignature className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-navy-900 mb-2">
                    {searchQuery || statusFilter !== 'all'
                      ? 'No SAFE notes found'
                      : 'No SAFE notes yet'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Your executed investment agreements will appear here'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Link to="/projects">
                      <Button>Browse Projects</Button>
                    </Link>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InvestorSAFENotesPage;
