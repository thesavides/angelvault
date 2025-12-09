import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Search, Filter, Loader2, Calendar, User, FileText,
  Settings, Shield, DollarSign, Eye, Edit, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';
import type { AuditLog } from '../types';

const actionIcons: Record<string, any> = {
  login: User,
  logout: User,
  signup: User,
  user_update: Edit,
  project_create: FileText,
  project_update: Edit,
  project_submit: FileText,
  project_approve: Shield,
  project_reject: Trash2,
  project_view: Eye,
  payment_create: DollarSign,
  payment_complete: DollarSign,
  nda_sign: FileText,
  meeting_request: Calendar,
  meeting_accept: Calendar,
  settings_update: Settings,
};

const actionColors: Record<string, string> = {
  login: 'blue',
  logout: 'gray',
  signup: 'green',
  user_update: 'blue',
  project_create: 'primary',
  project_update: 'blue',
  project_submit: 'amber',
  project_approve: 'green',
  project_reject: 'red',
  project_view: 'gray',
  payment_create: 'amber',
  payment_complete: 'green',
  nda_sign: 'primary',
  meeting_request: 'blue',
  meeting_accept: 'green',
  settings_update: 'gray',
};

export function AdminAuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<string>('week');

  useEffect(() => {
    trackEvent('page_view', { page: 'admin_audit' });
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, actionFilter, searchQuery, dateRange]);

  const loadLogs = async () => {
    try {
      const res = await api.getAuditLogs();
      setLogs(res.data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];
    
    if (actionFilter !== 'all') {
      filtered = filtered.filter(l => l.action.includes(actionFilter));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(l =>
        l.action.toLowerCase().includes(query) ||
        l.user?.email?.toLowerCase().includes(query) ||
        l.user?.first_name?.toLowerCase().includes(query) ||
        JSON.stringify(l.details).toLowerCase().includes(query)
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
      filtered = filtered.filter(l => new Date(l.created_at) >= startDate);
    }
    
    setFilteredLogs(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionIcon = (action: string) => {
    for (const [key, Icon] of Object.entries(actionIcons)) {
      if (action.includes(key)) return Icon;
    }
    return Activity;
  };

  const getActionColor = (action: string) => {
    for (const [key, color] of Object.entries(actionColors)) {
      if (action.includes(key)) return color;
    }
    return 'gray';
  };

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
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-navy-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            Track all platform activity and user actions
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action, user, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="all">All Actions</option>
            <option value="login">Authentication</option>
            <option value="project">Projects</option>
            <option value="payment">Payments</option>
            <option value="meeting">Meetings</option>
            <option value="user">User Updates</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <p className="text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} events
          </p>
        </motion.div>

        {/* Logs List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className="p-0">
              {filteredLogs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {filteredLogs.map((log, index) => {
                    const Icon = getActionIcon(log.action);
                    const color = getActionColor(log.action);
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.02 * index }}
                        className="px-6 py-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-5 h-5 text-${color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-navy-900">
                                {formatAction(log.action)}
                              </span>
                              <span className="text-sm text-gray-500">
                                by {log.user?.email || 'System'}
                              </span>
                            </div>
                            {log.details && (
                              <p className="text-sm text-gray-600 line-clamp-1">
                                {typeof log.details === 'object' 
                                  ? JSON.stringify(log.details)
                                  : log.details}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span>{formatDate(log.created_at)}</span>
                              {log.ip_address && <span>IP: {log.ip_address}</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-navy-900 mb-2">No logs found</h3>
                  <p className="text-gray-500">
                    {searchQuery || actionFilter !== 'all' || dateRange !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Activity logs will appear here'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default AdminAuditPage;
