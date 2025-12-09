import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileSignature, Search, Filter, ChevronRight, Loader2,
  DollarSign, Building2, Calendar, User, Eye, Download,
  CheckCircle, XCircle, Clock, AlertCircle, ChevronLeft
} from 'lucide-react';
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

const statusConfig: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  sent: { label: 'Sent', variant: 'warning' },
  signed_investor: { label: 'Investor Signed', variant: 'primary' },
  signed_founder: { label: 'Founder Signed', variant: 'primary' },
  executed: { label: 'Executed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

export function AdminSAFENotesPage() {
  const [safeNotes, setSafeNotes] = useState<SAFENote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<NoteStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    trackEvent('page_view', { page: 'admin_safe_notes' });
    loadSAFENotes();
  }, [page, statusFilter]);

  const loadSAFENotes = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await api.adminListSAFENotes(params);
      setSafeNotes(response.safe_notes || []);
      setTotalPages(response.total_pages || 1);
    } catch (error) {
      console.error('Failed to load SAFE notes:', error);
      toast.error('Failed to load SAFE notes');
    } finally {
      setIsLoading(false);
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

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || { label: status, variant: 'secondary' as const };
  };

  const filteredNotes = searchQuery
    ? safeNotes.filter(note =>
        note.project?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.investor?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.investor?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.developer?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.developer?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : safeNotes;

  const executedValue = safeNotes
    .filter(n => n.status === 'executed')
    .reduce((sum, n) => sum + n.investment_amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-navy-900">
            SAFE Notes Management
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage all investment agreements
          </p>
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
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">
                    {safeNotes.filter(n => ['sent', 'signed_investor', 'signed_founder'].includes(n.status)).length}
                  </p>
                  <p className="text-sm text-gray-500">Pending</p>
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
                  <p className="text-2xl font-bold text-navy-900">{formatCurrency(executedValue)}</p>
                  <p className="text-sm text-gray-500">Total Executed</p>
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
                      placeholder="Search by project, investor, or developer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                  {(['all', 'sent', 'signed_investor', 'executed', 'cancelled'] as NoteStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                      }}
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

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Project</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Investor</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Developer</th>
                        <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Amount</th>
                        <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                        <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                        <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNotes.map((note) => {
                        const statusInfo = getStatusInfo(note.status);
                        return (
                          <tr key={note.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                  {note.project?.logo_url ? (
                                    <img src={note.project.logo_url} alt="" className="w-8 h-8 object-contain rounded" />
                                  ) : (
                                    <Building2 className="w-5 h-5 text-primary-600" />
                                  )}
                                </div>
                                <span className="font-medium text-navy-900">{note.project?.title || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-medium text-navy-900">
                                  {note.investor?.first_name} {note.investor?.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{note.investor?.email}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <p className="font-medium text-navy-900">
                                  {note.developer?.first_name} {note.developer?.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{note.developer?.email}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="font-semibold text-navy-900">
                                {formatCurrency(note.investment_amount)}
                              </span>
                              {note.valuation_cap && (
                                <p className="text-sm text-gray-500">
                                  Cap: {formatCurrency(note.valuation_cap)}
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </td>
                            <td className="py-4 px-6 text-gray-500">
                              {format(new Date(note.created_at), 'MMM d, yyyy')}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Link to={`/admin/safe-notes/${note.id}`}>
                                  <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                                {note.document_url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(note.document_url, '_blank')}
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredNotes.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-500">
                            No SAFE notes found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminSAFENotesPage;
