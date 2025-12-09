import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, Calendar, Download, Search, Filter,
  Loader2, CheckCircle, Clock, XCircle, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';
import type { Payment } from '../types';

export function AdminPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState({
    total_revenue: 0,
    monthly_revenue: 0,
    total_transactions: 0,
    pending_amount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<string>('all');

  useEffect(() => {
    trackEvent('page_view', { page: 'admin_payments' });
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        api.getAdminPayments(),
        api.getAdminStats(),
      ]);
      setPayments(paymentsRes.payments || []);
      setStats({
        total_revenue: statsRes.total_revenue || 0,
        monthly_revenue: statsRes.monthly_revenue || 0,
        total_transactions: paymentsRes.payments?.length || 0,
        pending_amount: paymentsRes.payments
          ?.filter((p: Payment) => p.status === 'pending')
          .reduce((sum: number, p: Payment) => sum + p.amount, 0) || 0,
      });
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredPayments = () => {
    let filtered = [...payments];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.user?.email?.toLowerCase().includes(query) ||
        p.user?.first_name?.toLowerCase().includes(query) ||
        p.user?.last_name?.toLowerCase().includes(query) ||
        p.stripe_payment_intent_id?.toLowerCase().includes(query)
      );
    }
    
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      filtered = filtered.filter(p => new Date(p.created_at) >= startDate);
    }
    
    return filtered;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'secondary' }> = {
      completed: { label: 'Completed', variant: 'success' },
      succeeded: { label: 'Completed', variant: 'success' },
      pending: { label: 'Pending', variant: 'warning' },
      failed: { label: 'Failed', variant: 'error' },
      refunded: { label: 'Refunded', variant: 'secondary' },
    };
    return config[status] || { label: status, variant: 'secondary' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredPayments = getFilteredPayments();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container-wide py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-display text-3xl font-bold text-navy-900">Payments</h1>
            <p className="text-gray-600 mt-1">
              Track all platform transactions and revenue
            </p>
          </div>
          <Button variant="secondary" leftIcon={<Download className="w-5 h-5" />}>
            Export CSV
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{formatCurrency(stats.total_revenue)}</p>
                <p className="text-sm text-gray-500">Total Revenue</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{formatCurrency(stats.monthly_revenue)}</p>
                <p className="text-sm text-gray-500">This Month</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{stats.total_transactions}</p>
                <p className="text-sm text-gray-500">Transactions</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-900">{formatCurrency(stats.pending_amount)}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user email or payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
        </motion.div>

        {/* Payments Table */}
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
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-navy-900">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-navy-900">Amount</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-navy-900">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-navy-900">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-navy-900">Date</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-navy-900">Payment ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length > 0 ? (
                      filteredPayments.map((payment) => {
                        const status = getStatusBadge(payment.status);
                        return (
                          <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-navy-900">
                                  {payment.user?.first_name} {payment.user?.last_name}
                                </p>
                                <p className="text-sm text-gray-500">{payment.user?.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-navy-900">{formatCurrency(payment.amount)}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-700">{payment.type || 'View Package'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={status.variant} size="sm">{status.label}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-700">{formatDate(payment.created_at)}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-gray-500 font-mono truncate max-w-32">
                                {payment.stripe_payment_intent_id || '-'}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="font-semibold text-navy-900 mb-2">No payments found</h3>
                          <p className="text-gray-500">
                            {searchQuery || statusFilter !== 'all' || dateRange !== 'all'
                              ? 'Try adjusting your filters'
                              : 'Payments will appear here once investors purchase view packages'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminPaymentsPage;
