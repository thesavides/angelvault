import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, FileSignature, Calendar, CreditCard, ChevronRight, TrendingUp,
  CheckCircle, AlertCircle, Loader2, ExternalLink, Clock, DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { trackEvent } from '../utils/analytics';

interface DashboardStats {
  views_remaining: number;
  projects_viewed: number;
  ndas_signed: number;
  meetings_requested: number;
  meetings_completed: number;
}

interface RecentView {
  id: string;
  project: {
    id: string;
    title: string;
    tagline: string;
    funding_goal: number;
    logo_url?: string;
  };
  viewed_at: string;
}

export function InvestorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [hasSignedNDA, setHasSignedNDA] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    trackEvent('page_view', { page: 'investor_dashboard' });
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashboardRes, ndaRes] = await Promise.all([
        api.getInvestorDashboard(),
        api.getMasterNDAStatus(),
      ]);
      setStats({
        views_remaining: dashboardRes.views_remaining,
        projects_viewed: dashboardRes.projects_viewed,
        ndas_signed: dashboardRes.ndas_signed,
        meetings_requested: dashboardRes.meetings_requested,
        meetings_completed: dashboardRes.meetings_completed,
      });
      // Map ProjectUnlock to RecentView format
      const mappedViews = (dashboardRes.recent_views || []).map((unlock: any) => ({
        id: unlock.id,
        project: unlock.project,
        viewed_at: unlock.unlocked_at || unlock.viewed_at,
      }));
      setRecentViews(mappedViews);
      setHasSignedNDA(ndaRes.has_signed || ndaRes.has_signed_master_nda || false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const statCards = [
    { label: 'Views Remaining', value: stats?.views_remaining || 0, icon: Eye, color: 'primary' },
    { label: 'Projects Viewed', value: stats?.projects_viewed || 0, icon: TrendingUp, color: 'blue' },
    { label: 'NDAs Signed', value: stats?.ndas_signed || 0, icon: FileSignature, color: 'green' },
    { label: 'Meetings', value: stats?.meetings_requested || 0, icon: Calendar, color: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container-wide py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy-900">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-gray-600 mt-1">Here's your investment activity overview</p>
        </motion.div>

        {/* Alerts */}
        <div className="space-y-4 mb-8">
          {!hasSignedNDA && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-l-4 border-l-amber-500 bg-amber-50">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-amber-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-navy-900">Sign Master NDA Required</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sign our master NDA to view detailed project information and protect founder IP.
                    </p>
                    <Link to="/investor/nda">
                      <Button size="sm" className="mt-3">Sign NDA Now</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {stats?.views_remaining === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-l-4 border-l-primary-500 bg-primary-50">
                <div className="flex items-start gap-4">
                  <CreditCard className="w-6 h-6 text-primary-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-navy-900">No Views Remaining</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Purchase a view package to continue evaluating opportunities.
                    </p>
                    <Link to="/investor/purchase">
                      <Button size="sm" className="mt-3">Buy 4 Views - $500</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${stat.color}-100 flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-navy-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recently Viewed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recently Viewed Projects</CardTitle>
                  <Link to="/projects" className="text-sm text-primary-600 hover:underline">
                    Browse all
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentViews.length > 0 ? (
                  <div className="space-y-4">
                    {recentViews.map((view) => (
                      <Link
                        key={view.id}
                        to={`/projects/${view.project.id}`}
                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                          {view.project.logo_url ? (
                            <img src={view.project.logo_url} alt="" className="w-8 h-8 object-contain" />
                          ) : (
                            <span className="text-xl font-bold text-primary-600">
                              {view.project.title[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-navy-900 truncate">{view.project.title}</h4>
                          <p className="text-sm text-gray-500 truncate">{view.project.tagline}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-navy-900">
                            {formatCurrency(view.project.funding_goal)}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(view.viewed_at)}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-navy-900 mb-2">No projects viewed yet</h3>
                    <p className="text-gray-500 mb-4">Start exploring vetted investment opportunities</p>
                    <Link to="/projects">
                      <Button>Browse Projects</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  to="/projects"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Browse Projects</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/investor/purchase"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Purchase Views</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/investor/meetings"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">My Meetings</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link
                  to="/investor/profile"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileSignature className="w-5 h-5 text-primary-600" />
                    <span className="font-medium">Edit Profile</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>View Package</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-primary-600">{stats?.views_remaining || 0}</p>
                  <p className="text-gray-500">views remaining</p>
                </div>
                {(stats?.views_remaining || 0) < 2 && (
                  <Link to="/investor/purchase">
                    <Button fullWidth variant="accent">
                      Buy More Views
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default InvestorDashboard;
