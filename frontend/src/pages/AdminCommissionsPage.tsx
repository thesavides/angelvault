import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Percent, Search, Filter, Loader2, DollarSign, Calendar,
  TrendingUp, Download, ChevronLeft, ChevronRight, Building2,
  User, CheckCircle, Clock
} from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { trackEvent } from '../utils/analytics';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface Commission {
  id: string;
  safe_note_id: string;
  amount: number;
  rate: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  created_at: string;
  safe_note?: {
    id: string;
    investment_amount: number;
    project?: {
      id: string;
      title: string;
    };
    investor?: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
}

const statusConfig: Record<string, { label: string; variant: 'primary' | 'warning' | 'success' | 'error' | 'secondary' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  paid: { label: 'Paid', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
};

export function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalCommissions: 0,
    totalEarned: 0,
    pendingAmount: 0,
    averageRate: 0,
  });

  useEffect(() => {
    trackEvent('page_view', { page: 'admin_commissions' });
    loadCommissions();
  }, [page, statusFilter]);

  const loadCommissions = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      
      const response = await api.adminListCommissions(params);
      const items = response.commissions || [];
      setCommissions(items);
      setTotalPages(response.total_pages || 1);
      
      // Calculate stats
      const paid = items.filter(c => c.status === 'paid');
      const pending = items.filter(c => c.status === 'pending');
      setStats({
        totalCommissions: items.length,
        totalEarned: paid.reduce((sum, c) => sum + c.amount, 0),
        pendingAmount: pending.reduce((sum, c) => sum + c.amount, 0),
        averageRate: items.length > 0 ? items.reduce((sum, c) => sum + c.rate, 0) / items.length : 0,
      });
    } catch (error) {
      console.error('Failed to load commissions:', error);
      toast.error('Failed to load commissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (commissionId: string) => {
    try {
      await api.adminMarkCommissionPaid(commissionId);
      toast.success('Commission marked as paid');
      loadCommissions();
    } catch (error) {
      toast.error('Failed to update commission');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || { label: status, variant: 'secondary' as const };
  };

  const filteredCommissions = searchQuery
    ? commissions.filter(commission =>
        commission.safe_note?.project?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commission.safe_note?.investor?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commission.safe_note?.investor?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : commissions;

  if (isLoading && page === 1) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-navy-900">
                Commissions
              </h1>
              <p className="text-gray-600 mt-1">
                Track platform commissions from executed investments
              </p>
            </div>
            <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
              Export CSV
            </Button>
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
                  <Percent className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">{stats.totalCommissions}</p>
                  <p className="text-sm text-gray-500">Total Commissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">{formatCurrency(stats.totalEarned)}</p>
                  <p className="text-sm text-gray-500">Total Earned</p>
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
                  <p className="text-2xl font-bold text-navy-900">{formatCurrency(stats.pendingAmount)}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-navy-900">{stats.averageRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">Avg Rate</p>
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
                <div className="flex gap-2">
                  {(['all', 'pending', 'paid', 'cancelled'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Project</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Investor</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Investment</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Rate</th>
                      <th className="text-right py-4 px-6 text-sm font-medium text-gray-500">Commission</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Status</th>
                      <th className="text-left py-4 px-6 text-sm font-medium text-gray-500">Date</th>
                      <th className="text-center py-4 px-6 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCommissions.map((commission) => {
                      const statusInfo = getStatusInfo(commission.status);
                      return (
                        <tr key={commission.id} className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary-600" />
                              </div>
                              <p className="font-medium text-navy-900">
                                {commission.safe_note?.project?.title || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-navy-900">
                              {commission.safe_note?.investor?.first_name} {commission.safe_note?.investor?.last_name}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <p className="font-medium text-navy-900">
                              {formatCurrency(commission.safe_note?.investment_amount || 0)}
                            </p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge variant="secondary">{commission.rate}%</Badge>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <p className="font-semibold text-green-600">{formatCurrency(commission.amount)}</p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-gray-600">{format(new Date(commission.created_at), 'MMM d, yyyy')}</p>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {commission.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkPaid(commission.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Paid
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCommissions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <Percent className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No commissions found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

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

export default AdminCommissionsPage;
